import https from 'https';

const projectId = 'sps-property';
const accessToken = 'ya29.a0Aa7MYirvRhN3m-cdIm6IpXVkwmQdMm6Oa0PHIWIlvp6_3SKa7MMp5tBjohVVic-lotrNirKLm48BqT6qGsaMQvbqyL9zWTPDsn5JoxudYbcizkkhx-ZLUgc34w4IFUKp8Usw_EHNFX0yGUUWmoIc2U4slHO9AODqaYHbyj-4DU64WwyLPJBMCOZNnmKaacSXBHjXPvx1A4JuoQaCgYKAScSARYSFQHGX2MiyzLxbucGQqsgIQX_03MJcA0213';

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
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collectionPath}?pageSize=300`;
  
  const allDocs = [];
  let nextPageToken = null;

  do {
    const pageUrl = nextPageToken 
      ? `${url}&pageToken=${nextPageToken}`
      : url;
    
    const response = await request({
      hostname: 'firestore.googleapis.com',
      path: pageUrl,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.documents) {
      allDocs.push(...response.documents);
    }
    nextPageToken = response.nextPageToken;
  } while (nextPageToken);

  return allDocs;
}

function fieldsToObject(fields) {
  const obj = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) obj[key] = value.stringValue;
    else if (value.integerValue !== undefined) obj[key] = parseInt(value.integerValue);
    else if (value.doubleValue !== undefined) obj[key] = parseFloat(value.doubleValue);
    else if (value.booleanValue !== undefined) obj[key] = value.booleanValue;
    else if (value.arrayValue !== undefined) obj[key] = value.arrayValue.values?.map(v => v.stringValue || v.integerValue || v.doubleValue) || [];
    else if (value.mapValue !== undefined) obj[key] = JSON.stringify(value.mapValue.fields || {});
    else obj[key] = JSON.stringify(value);
  }
  return obj;
}

async function exportProperties() {
  console.error('Fetching documents from Firestore...');
  const docs = await getDocuments('properties');
  console.error(`Found ${docs.length} documents`);

  if (docs.length === 0) return;

  const allFields = new Set();
  const allDocs = [];

  for (const doc of docs) {
    const id = doc.name.split('/').pop();
    const obj = fieldsToObject(doc.fields || {});
    allDocs.push({ id, ...obj });
    Object.keys(obj).forEach(key => allFields.add(key));
  }

  const fields = ['id', ...Array.from(allFields).sort()];
  
  // Output CSV
  process.stdout.write(fields.join(',') + '\n');

  for (const doc of allDocs) {
    const row = fields.map(field => {
      let value = doc[field];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') value = JSON.stringify(value);
      let str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        str = `"${str}"`;
      }
      return str;
    });
    process.stdout.write(row.join(',') + '\n');
  }
}

exportProperties().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
