// npm run dbcheck   ->  connects to your Atlas database, says what is wrong if it cannot, and shows what is stored.
import fs from 'node:fs';
import path from 'node:path';
import { explainDbError } from '../api/_util.js';

for (const f of ['.env', '.env.local']) {
  const p = path.resolve(f);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !line.trim().startsWith('#')) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log('✗ MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}
console.log('Connecting to', uri.replace(/\/\/([^:]+):[^@]*@/, '//$1:****@'), '...');
try {
  const { MongoClient } = await import('mongodb');
  if (process.env.MONGODB_DNS) (await import('node:dns')).setServers(process.env.MONGODB_DNS.split(',').map((x) => x.trim()));
  const client = new MongoClient(uri.trim(), { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'wishbox');
  await db.command({ ping: 1 });
  console.log(`✓ Connected. Database "${db.databaseName}":`);
  for (const name of ['users', 'auth', 'devices', 'events', 'photos', 'locations', 'wishes']) {
    console.log(`  ${name.padEnd(10)} ${await db.collection(name).countDocuments()} documents`);
  }
  const recent = await db.collection('events').find({}, { projection: { _id: 0, uid: 1, name: 1, screen: 1, props: 1, ts: 1 } }).sort({ ts: -1 }).limit(8).toArray();
  if (recent.length) {
    console.log('\nLatest events:');
    for (const e of recent) console.log(' ', new Date(e.ts).toLocaleString(), (e.uid || '').padEnd(16), e.name, e.screen || '', JSON.stringify(e.props || {}));
  }
  console.log('\nSee one person\'s folders:  npm run usertree -- <id>   (list ids with: npm run usertree)');
  await client.close();
} catch (e) {
  console.log('✗ Could not connect.\n');
  console.log(explainDbError(e));
  console.log('\n(raw error: ' + String(e.message).slice(0, 200) + ')');
  process.exit(1);
}
