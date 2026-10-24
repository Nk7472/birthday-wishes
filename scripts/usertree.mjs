// npm run usertree              -> every person and how much is in each of their folders
// npm run usertree -- user3_k9x2ab  -> open one person's folders (auth, devices, events, photos, locations, wishes)
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
if (!process.env.MONGODB_URI) {
  console.log('✗ MONGODB_URI is not set. Copy .env.example to .env.local and fill it in.');
  process.exit(1);
}
const when = (t) => (t ? new Date(t).toLocaleString() : '-');
const want = process.argv[2];
try {
  const { MongoClient } = await import('mongodb');
  if (process.env.MONGODB_DNS) (await import('node:dns')).setServers(process.env.MONGODB_DNS.split(',').map((x) => x.trim()));
  const client = new MongoClient(process.env.MONGODB_URI.trim(), { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'wishbox');
  const col = (n) => db.collection(n);

  if (!want) {
    const users = await col('users').find({ n: { $exists: true } }).sort({ n: 1 }).limit(200).toArray();
    console.log(`${users.length} people in "${db.databaseName}":\n`);
    for (const u of users) {
      const f = u.folders || {};
      console.log(`${u._id.padEnd(18)} ${String(u.status).padEnd(8)} ${(u.name || '').padEnd(14)} events ${f.events || 0} · photos ${f.photos || 0} · locations ${f.locations || 0} · wishes ${f.wishes || 0} · ${u.os || '?'} · last seen ${when(u.lastSeenAt)}${u.mergedInto ? ` → merged into ${u.mergedInto}` : ''}`);
    }
  } else {
    const root = await col('users').findOne({ _id: want });
    if (!root) {
      console.log(`✗ No person with id ${want}. Run "npm run usertree" to list ids.`);
      process.exit(1);
    }
    console.log(`📁 ${want}   (${root.status}${root.name ? `, ${root.name}` : ''})   created ${when(root.createdAt)}`);
    console.log(`   last seen ${when(root.lastSeenAt)} · ${root.os || '?'} · ${root.device || '?'} · ${root.lang || ''} · ${root.tz || ''}`);
    if (root.lastLocation) console.log(`   last location ${root.lastLocation.latitude}, ${root.lastLocation.longitude} (±${Math.round(root.lastLocation.accuracy || 0)} m)`);
    const a = await col('auth').findOne({ _id: want }, { projection: { passHash: 0 } });
    console.log(`\n├─ auth        ${a ? `${a.name} · ${a.email} · ${a.phone} (password stored hashed, not shown)` : 'not signed up yet'}`);
    const devices = await col('devices').find({ uid: want }).toArray();
    console.log(`├─ devices     ${devices.length}`);
    for (const d of devices) console.log(`│    ${d._id.slice(0, 8)}…  ${d.platform?.os || '?'} ${d.platform?.model || ''} ${d.platform?.browser || ''}  visits ${d.visits || 0}  first ${when(d.firstSeen)}  from ${d.firstGeo?.city || d.firstGeo?.country || '?'}`);
    const events = await col('events').find({ uid: want }).sort({ ts: -1 }).limit(8).toArray();
    console.log(`├─ events      ${await col('events').countDocuments({ uid: want })}  (latest ${events.length})`);
    for (const e of events) console.log(`│    ${when(e.ts)}  ${e.name}  ${e.screen || ''}  ${JSON.stringify(e.props || {})}`);
    const photos = await col('photos').find({ uid: want }, { projection: { bytes: 0 } }).sort({ createdAt: -1 }).toArray();
    console.log(`├─ photos      ${photos.length}`);
    for (const p of photos) console.log(`│    ${p._id}  ${p.type}  ${Math.round((p.size || 0) / 1024)} KB  ${when(p.createdAt)}`);
    const locs = await col('locations').find({ uid: want }).sort({ at: -1 }).limit(8).toArray();
    console.log(`├─ locations   ${await col('locations').countDocuments({ uid: want })}`);
    for (const l of locs) console.log(`│    ${when(l.at)}  ${l.status}${l.latitude !== undefined ? `  lat ${l.latitude}  long ${l.longitude}` : ''}`);
    const wishes = await col('wishes').find({ uid: want }).sort({ updatedAt: -1 }).toArray();
    console.log(`└─ wishes      ${wishes.length}`);
    for (const w of wishes) console.log(`     ${w.category || ''}  "${w.name}"${w.reason ? ` for ${w.reason}` : ''}  templates: ${(w.templates || []).join(', ') || w.template}  ${JSON.stringify(w.flags || {})}`);
  }
  await client.close();
} catch (e) {
  console.log('✗ Could not read the database.\n');
  console.log(explainDbError(e));
  process.exit(1);
}
