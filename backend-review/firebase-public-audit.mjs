import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getCountFromServer, query, where, limit } from 'firebase/firestore';

for (const name of ['.env.local', '.env']) {
  const path = resolve(process.cwd(), name);
  if (existsSync(path)) process.loadEnvFile(path);
}

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
if (!config.projectId || !config.apiKey) throw new Error('Firebase public configuration is unavailable');
const app = initializeApp(config, `readonly-audit-${Date.now()}`);
const db = getFirestore(app);
const countBy = (rows, getter) => Object.fromEntries([...rows.reduce((map, row) => {
  const key = getter(row) || '(missing)';
  map.set(key, (map.get(key) || 0) + 1);
  return map;
}, new Map()).entries()].sort((a, b) => b[1] - a[1]));
const missing = (rows, key) => rows.filter((row) => row[key] == null || row[key] === '').length;
const dateValue = (value) => value?.toDate?.()?.toISOString?.() || null;

try {
  const [propertySnap, blogSnap] = await Promise.all([
    getDocs(collection(db, 'properties')),
    getDocs(query(collection(db, 'blogs'), where('published', '==', true), limit(100))),
  ]);
  const properties = propertySnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const blogs = blogSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const titleCounts = countBy(blogs, (b) => String(b.title || '').trim());
  const sensitiveFields = ['ownerName', 'ownerPhone', 'contactPhone', 'phone', 'tel', 'agentContact'];
  console.log(JSON.stringify({
    projectId: config.projectId,
    properties: {
      totalReadableByPublicClient: properties.length,
      status: countBy(properties, (p) => p.status),
      propertyTypes: countBy(properties, (p) => p.propertyType || p.type),
      provinces: countBy(properties, (p) => p.province || p.location?.province),
      districts: countBy(properties, (p) => p.district || p.location?.district),
      missing: {
        title: missing(properties, 'title'),
        price: missing(properties, 'price'),
        createdBy: missing(properties, 'createdBy'),
        slug: missing(properties, 'slug'),
        coverImageUrl: missing(properties, 'coverImageUrl'),
        createdAt: missing(properties, 'createdAt'),
        updatedAt: missing(properties, 'updatedAt'),
      },
      noImages: properties.filter((p) => !Array.isArray(p.images) || p.images.length === 0).length,
      directInstallment: properties.filter((p) => p.directInstallment === true).length,
      rental: properties.filter((p) => p.listingType === 'rent' || p.isRental === true).length,
      contactFieldsPresentButValuesNotRead: Object.fromEntries(sensitiveFields.map((key) => [key, properties.filter((p) => p[key] != null).length])),
    },
    publishedBlogs: {
      total: blogs.length,
      missingTitle: missing(blogs, 'title'),
      missingContent: missing(blogs, 'content'),
      missingImages: blogs.filter((b) => !Array.isArray(b.images) || b.images.length === 0).length,
      missingSummary: missing(blogs, 'summary'),
      missingAuthorName: missing(blogs, 'authorName'),
      missingPublishedAt: missing(blogs, 'createdAt'),
      aiAuthorField: blogs.filter((b) => typeof b.author === 'string' && b.author.includes('AI')).length,
      latestCreatedAt: blogs.map((b) => dateValue(b.createdAt)).filter(Boolean).sort().at(-1) || null,
      duplicateTitleGroups: Object.entries(titleCounts).filter(([title, count]) => title && count > 1),
    },
  }, null, 2));

  const accessResults = {};
  for (const name of ['users', 'leads', 'loan_requests', 'appointments', 'viewing_requests', 'inquiries', 'pending_properties', 'audit_logs']) {
    try {
      await getCountFromServer(collection(db, name));
      accessResults[name] = 'anonymous aggregate read allowed';
    } catch (error) {
      accessResults[name] = error?.code === 'permission-denied' ? 'anonymous read denied' : `check failed: ${error?.code || 'unknown'}`;
    }
  }
  console.log(JSON.stringify({ anonymousAccessChecks: accessResults }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ auditError: error?.code || error?.message || 'unknown' }));
  process.exitCode = 1;
}
