import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const app = getApps().length === 0 
  ? initializeApp({
      projectId: 'sps-property',
    })
  : getApps()[0];

const db = getFirestore(app);

async function exportProperties() {
  const snapshot = await db.collection('properties').get();
  
  if (snapshot.empty) {
    console.log('No documents found');
    return;
  }

  const allFields = new Set();
  const docs = [];
  
  snapshot.forEach(doc => {
    const data = doc.data();
    docs.push({ id: doc.id, ...data });
    Object.keys(data).forEach(key => allFields.add(key));
  });

  const fields = ['id', ...Array.from(allFields).sort()];
  
  // Output CSV to stdout
  process.stdout.write(fields.join(',') + '\n');

  for (const doc of docs) {
    const row = fields.map(field => {
      let value = doc[field];
      if (value === undefined || value === null) return '';
      if (typeof value === 'object') value = JSON.stringify(value).replace(/"/g, '""');
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

exportProperties().catch(console.error);
