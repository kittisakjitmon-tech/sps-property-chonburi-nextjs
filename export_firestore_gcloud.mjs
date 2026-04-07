import https from 'https';
import fs from 'fs';

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'metadata.google.internal',
      path: '/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://firestore.googleapis.com',
      headers: { 'Metadata-Flavor': 'Google' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.end();
  });
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function getDocuments(collectionPath) {
  // Get access token from gcloud
  const { execSync } = await import('child_process');
  const accessToken = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
  
  const allDocs = [];
  let nextPageToken = null;
  const baseUrl = `https://firestore.googleapis.com/v1/projects/sps-property/databases/(default)/documents/${collectionPath}`;

  do {
    let url = baseUrl + '?pageSize=300';
    if (nextPageToken) url += '&pageToken=' + nextPageToken;
    
    const urlObj = new URL(url);
    const response = await request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.documents) {
      allDocs.push(...response.documents);
    }
    nextPageToken = response.nextPageToken;
    
    if (nextPageToken) {
      console.error(`Fetched ${allDocs.length} documents so far...`);
    }
  } while (nextPageToken);

  return allDocs;
}

function fieldsToObject(fields) {
  const obj = {};
  for (const [key, value] of Object.entries(fields || {})) {
    if (value === null || value.nullValue !== undefined) obj[key] = '';
    else if (value.stringValue !== undefined) obj[key] = value.stringValue;
    else if (value.integerValue !== undefined) obj[key] = parseInt(value.integerValue);
    else if (value.doubleValue !== undefined) obj[key] = parseFloat(value.doubleValue);
    else if (value.booleanValue !== undefined) obj[key] = value.booleanValue;
    else if (value.timestampValue !== undefined) obj[key] = value.timestampValue;
    else if (value.arrayValue !== undefined) {
      obj[key] = value.arrayValue.values?.map(v => 
        v.stringValue || v.integerValue || v.doubleValue || v.booleanValue || JSON.stringify(v)
      ).join(';') || '';
    }
    else if (value.mapValue !== undefined) obj[key] = JSON.stringify(value.mapValue.fields || {});
    else obj[key] = JSON.stringify(value);
  }
  return obj;
}

function escapeCSV(value) {
  if (value === undefined || value === null) return '';
  if (typeof value === 'object') value = JSON.stringify(value);
  let str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    str = `"${str}"`;
  }
  return str;
}

async function exportProperties() {
  console.error('Fetching documents from Firestore properties collection...');
  const docs = await getDocuments('properties');
  console.error(`\nTotal documents: ${docs.length}`);

  if (docs.length === 0) {
    console.error('No documents found');
    return;
  }

  const allFields = new Set();
  const allDocs = [];

  for (const doc of docs) {
    const id = doc.name.split('/').pop();
    const obj = fieldsToObject(doc.fields || {});
    allDocs.push({ id, ...obj });
    Object.keys(obj).forEach(key => allFields.add(key));
  }

  const fields = ['id', ...Array.from(allFields).sort()];
  
  // Create CSV content
  const csvLines = [fields.map(escapeCSV).join(',')];
  
  for (const doc of allDocs) {
    const row = fields.map(field => escapeCSV(doc[field]));
    csvLines.push(row.join(','));
  }

  const csvContent = csvLines.join('\n');
  
  // Write to file
  fs.writeFileSync('properties_export.csv', csvContent, 'utf8');
  console.error('Exported to properties_export.csv');
  
  // Also output to stdout for piping
  console.log(csvContent);
}

exportProperties().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
