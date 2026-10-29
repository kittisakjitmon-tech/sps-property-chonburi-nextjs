const { createHash } = require('node:crypto');
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/apiv2');
const auth = require('/opt/homebrew/lib/node_modules/firebase-tools/lib/auth');

const client = new Client({ urlPrefix: 'https://firebaserules.googleapis.com', apiVersion: 'v1', auth: false });
const hash = (text) => createHash('sha256').update(text).digest('hex');

(async () => {
  const account = auth.getGlobalDefaultAccount();
  if (!account) throw new Error('No Firebase CLI account is available');
  const accessToken = await auth.getAccessToken(account.tokens.refresh_token, ['https://www.googleapis.com/auth/cloud-platform']);
  const headers = { Authorization: `Bearer ${accessToken.access_token}` };
  const releases = await client.get('/projects/sps-property/releases', { headers });
  const wanted = (releases.body.releases || []).filter((release) => /cloud\.(firestore|storage)$/.test(release.name));
  for (const release of wanted) {
    const result = await client.get(`/${release.rulesetName}`, { headers });
    const files = result.body.source?.files || [];
    for (const file of files) {
      const isFirestore = release.name.endsWith('cloud.firestore');
      const localName = isFirestore ? 'firestore.rules' : 'storage.rules';
      const local = readFileSync(resolve(__dirname, 'sps-property-project', localName), 'utf8');
      const liveName = `live-${localName}`;
      writeFileSync(resolve(__dirname, liveName), file.content);
      console.log(JSON.stringify({
        service: isFirestore ? 'firestore' : 'storage',
        release: release.name,
        ruleset: release.rulesetName,
        createTime: result.body.createTime || null,
        matchesCopiedLocalFile: hash(local) === hash(file.content),
        savedForComparison: liveName,
      }));
    }
  }
  if (wanted.length === 0) console.log(JSON.stringify({ error: 'No Firestore or Storage rules releases found' }));
})().catch((error) => {
  console.error(JSON.stringify({ rulesAuditError: error.message, status: error.status || null }));
  process.exitCode = 1;
});
