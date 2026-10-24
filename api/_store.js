// Data layer. One interface, two engines:
//   • MongoDB Atlas  when MONGODB_URI is set (production, and local dev with your .env)
//   • in memory      when it is not (quick demos and automated tests; data vanishes on restart)
//
// HOW THE DATA IS ORGANISED (one "folder" per person)
// MongoDB has no real folders, so each collection below is one folder-type, and every document inside it carries
// the owner's id in a field called `uid`, e.g. "user12_k3f9a2". Filter any collection by that uid in Atlas / Compass
// and you see exactly that person's folder.
//
//   users      one ROOT document per person (_id = uid). Counts for each folder, last seen, last location, status.
//   auth       login details (name, email, phone, password hash)           _id = uid        (members only)
//   devices    each browser/phone that person used (platform, language…)   _id = device id  + uid
//   events     every click / screen / action                                              + uid
//   photos     the actual image files, kept forever                                       + uid
//   locations  every location answer (latitude, longitude, status)                        + uid
//   wishes     the friend's details + the templates used                                  + uid
//   counters   the running number that makes "user1_", "user2_", …
//
// The id is created by the server the first time a browser says hello. When that person signs up the same id
// becomes their account; when they log in on another phone, what that phone collected is merged into the account.
import crypto from 'node:crypto';

const DAY = 864e5;
const FOLDERS = ['events', 'photos', 'locations', 'wishes', 'auth'];
const emptyFolders = () => Object.fromEntries(FOLDERS.map((f) => [f, 0]));
const makeUid = (n) => `user${n}_${Array.from(crypto.randomBytes(6), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('')}`;
const CACHE_MS = 30_000;
let cached;

export async function store() {
  if (!cached) cached = process.env.MONGODB_URI ? await mongoStore() : memoryStore();
  return cached;
}

/** vid -> uid, remembered for a short while so a burst of requests costs one lookup. */
function uidCache() {
  const g = globalThis;
  const m = (g.__wbUids ||= new Map());
  return {
    get(vid) {
      const h = m.get(vid);
      return h && Date.now() - h.t < CACHE_MS ? h.uid : null;
    },
    set(vid, uid) {
      if (m.size > 5000) m.clear();
      m.set(vid, { uid, t: Date.now() });
    },
  };
}

function setPath(obj, path, v) {
  const parts = path.split('.');
  let o = obj;
  for (const p of parts.slice(0, -1)) o = o[p] ??= {};
  o[parts[parts.length - 1]] = v;
}

const userRoot = (uid, n, vid) => ({ _id: uid, n, status: 'visitor', vids: [vid], createdAt: Date.now(), folders: emptyFolders() });
const lastSeenFields = (set) => ({
  lastSeenAt: set.lastSeen,
  os: set.os,
  device: set.platform?.device,
  lang: set.lang,
  tz: set.tz,
  lastGeo: set.lastGeo,
});

/* ------------------------------------------------------------------ memory */
function memoryStore() {
  console.warn('[wishbox] MONGODB_URI is not set: using the in-memory store (data is lost on restart).');
  const t = { users: new Map(), auth: new Map(), devices: new Map(), events: [], photos: new Map(), wishes: new Map(), locations: [], n: 0 };
  const cache = uidCache();
  const bump = (uid, folder, by = 1) => {
    const u = t.users.get(uid);
    if (u) u.folders[folder] = (u.folders[folder] || 0) + by;
  };
  return {
    kind: 'memory',
    async resolveUid(vid) {
      const hit = cache.get(vid);
      if (hit) return { uid: hit, fresh: false };
      let d = t.devices.get(vid);
      let fresh = false;
      if (!d) {
        const uid = makeUid(++t.n);
        d = { _id: vid, uid, createdAt: Date.now() };
        t.devices.set(vid, d);
        t.users.set(uid, userRoot(uid, t.n, vid));
        fresh = true;
      }
      cache.set(vid, d.uid);
      return { uid: d.uid, fresh };
    },
    async touchDevice(uid, vid, set, first, inc) {
      const d = t.devices.get(vid) || { _id: vid, createdAt: Date.now() };
      Object.assign(d, set, { uid }, first || {});
      for (const [k, n] of Object.entries(inc || {})) d[k] = (d[k] || 0) + n;
      t.devices.set(vid, d);
      const u = t.users.get(uid);
      if (u) Object.assign(u, lastSeenFields(set));
    },
    async addEvents(uid, list) {
      t.events.push(...list);
      bump(uid, 'events', list.length);
    },
    async addLocation(doc) {
      t.locations.push(doc);
      bump(doc.uid, 'locations');
      const u = t.users.get(doc.uid);
      if (u) {
        u.locationStatus = doc.status;
        if (doc.status === 'granted') u.lastLocation = { latitude: doc.latitude, longitude: doc.longitude, accuracy: doc.accuracy, at: doc.at };
      }
    },
    async authByEmail(email) {
      return [...t.auth.values()].find((u) => u.email === email) || null;
    },
    async authById(uid) {
      return t.auth.get(uid) || null;
    },
    async createAuth(doc) {
      if (t.auth.has(doc._id)) throw Object.assign(new Error('HAS_ACCOUNT'), { code: 'HAS_ACCOUNT' });
      if ([...t.auth.values()].some((x) => x.email === doc.email)) throw Object.assign(new Error('EXISTS'), { code: 'EXISTS' });
      t.auth.set(doc._id, doc);
      const u = t.users.get(doc._id);
      if (u) Object.assign(u, { status: 'member', name: doc.name });
      bump(doc._id, 'auth');
    },
    async updateAuth(uid, set) {
      const u = t.auth.get(uid);
      if (u) Object.assign(u, set);
    },
    /** Point this browser at an account. A plain visitor's data is merged into the account; another member's is not touched. */
    async attachDevice(vid, to) {
      const cur = t.devices.get(vid);
      const from = cur?.uid;
      if (from === to) return;
      const d = cur || { _id: vid, createdAt: Date.now() };
      d.uid = to;
      t.devices.set(vid, d);
      cache.set(vid, to);
      const dest = t.users.get(to);
      if (dest) dest.vids = [...new Set([...(dest.vids || []), vid])];
      if (from && !t.auth.has(from) && t.users.has(from)) {
        for (const list of [t.events, t.locations]) for (const x of list) if (x.uid === from) Object.assign(x, { uid: to, mergedFrom: from });
        for (const m of [t.photos, t.wishes, t.devices]) for (const x of m.values()) if (x.uid === from) Object.assign(x, { uid: to, mergedFrom: from });
        const src = t.users.get(from);
        for (const f of FOLDERS) bump(to, f, src.folders[f] || 0);
        if (dest && src.lastLocation && !dest.lastLocation) dest.lastLocation = src.lastLocation;
        Object.assign(src, { status: 'merged', mergedInto: to });
      }
    },
    async userRoot(uid) {
      return t.users.get(uid) || null;
    },
    async getPhoto(id) {
      return t.photos.get(id) || null;
    },
    async putPhoto(doc) {
      if (!t.photos.has(doc._id)) {
        t.photos.set(doc._id, doc);
        bump(doc.uid, 'photos');
      }
    },
    async putWish(id, uid, onInsert, set, flags, template) {
      const cur = t.wishes.get(id);
      if (cur && cur.uid !== uid) return; // somebody else's: never overwrite
      const w = cur || { _id: id, uid, ...onInsert, templates: [], flags: {} };
      if (!cur) bump(uid, 'wishes');
      Object.assign(w, set);
      for (const f of flags) setPath(w, `flags.${f}`, true);
      if (template && !w.templates.includes(template)) w.templates.push(template);
      t.wishes.set(id, w);
    },
    async gallery(uid) {
      const mine = (d) => d.uid === uid;
      return {
        photos: [...t.photos.values()].filter(mine).sort((a, b) => b.createdAt - a.createdAt).slice(0, 300),
        wishes: [...t.wishes.values()].filter(mine).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 300),
      };
    },
    async dump() {
      return { users: [...t.users.values()], auth: [...t.auth.values()], devices: [...t.devices.values()], events: t.events, photos: [...t.photos.values()], wishes: [...t.wishes.values()], locations: t.locations };
    },
  };
}

/* ------------------------------------------------------------------ MongoDB */
async function mongoStore() {
  const { MongoClient } = await import('mongodb');
  const g = globalThis;
  if (process.env.MONGODB_DNS) {
    // some networks cannot look up Atlas's mongodb+srv:// address; use these DNS servers instead (e.g. 8.8.8.8,1.1.1.1)
    const dns = await import('node:dns');
    dns.setServers(process.env.MONGODB_DNS.split(',').map((x) => x.trim()).filter(Boolean));
  }
  if (!g.__wbMongo) {
    const client = new MongoClient(process.env.MONGODB_URI.trim(), { maxPoolSize: 5, serverSelectionTimeoutMS: 8000, appName: 'wishbox' });
    g.__wbMongo = client.connect().then(() => client);
    g.__wbMongo.catch(() => {
      g.__wbMongo = null; // try again on the next request instead of failing forever
      g.__wbIndexes = null;
    });
  }
  const client = await g.__wbMongo;
  const db = client.db(process.env.MONGODB_DB || 'wishbox');
  // w:1 = acknowledged by the primary only: noticeably faster than "majority" for clicks and device rows
  const fast = { writeConcern: { w: 1 } };
  const c = {
    users: db.collection('users'),
    auth: db.collection('auth'),
    devices: db.collection('devices', fast),
    events: db.collection('events', fast),
    photos: db.collection('photos'),
    wishes: db.collection('wishes'),
    locations: db.collection('locations', fast),
    counters: db.collection('counters'),
  };
  if (!g.__wbIndexes) {
    g.__wbIndexes = Promise.all([
      c.auth.createIndex({ email: 1 }, { unique: true }),
      c.users.createIndex({ n: 1 }, { unique: true, sparse: true }),
      c.users.createIndex({ vids: 1 }),
      c.devices.createIndex({ uid: 1 }),
      c.events.createIndex({ uid: 1, ts: -1 }),
      c.events.createIndex({ name: 1, ts: -1 }),
      c.photos.createIndex({ uid: 1, createdAt: -1 }),
      c.wishes.createIndex({ uid: 1, updatedAt: -1 }),
      c.locations.createIndex({ uid: 1, at: -1 }),
      c.locations.createIndex({ loc: '2dsphere' }, { sparse: true }),
    ]).catch((e) => console.error('[wishbox] index creation failed', e.message));
  }
  await g.__wbIndexes;

  const cache = uidCache();
  const inflight = (g.__wbInflight ||= new Map());
  const bump = (uid, folder, by = 1) => c.users.updateOne({ _id: uid }, { $inc: { [`folders.${folder}`]: by } });
  const dupKey = (e) => e?.code === 11000;

  async function createFor(vid) {
    const doc = await c.counters.findOneAndUpdate({ _id: 'user' }, { $inc: { n: 1 } }, { upsert: true, returnDocument: 'after' });
    const n = doc.n;
    const mine = makeUid(n);
    try {
      await c.devices.updateOne({ _id: vid }, { $setOnInsert: { uid: mine, createdAt: Date.now() } }, { upsert: true });
    } catch (e) {
      if (!dupKey(e)) throw e; // two requests raced to create the same device: the other one won
    }
    const d = await c.devices.findOne({ _id: vid }, { projection: { uid: 1 } });
    if (d.uid === mine) {
      const { _id, ...root } = userRoot(mine, n, vid);
      await c.users.updateOne({ _id }, { $setOnInsert: root }, { upsert: true });
    }
    return { uid: d.uid, fresh: d.uid === mine };
  }

  return {
    kind: 'mongo',
    async resolveUid(vid) {
      const hit = cache.get(vid);
      if (hit) return { uid: hit, fresh: false };
      if (inflight.has(vid)) return inflight.get(vid);
      const p = (async () => {
        const d = await c.devices.findOne({ _id: vid }, { projection: { uid: 1 } });
        const r = d?.uid ? { uid: d.uid, fresh: false } : await createFor(vid);
        cache.set(vid, r.uid);
        return r;
      })().finally(() => inflight.delete(vid));
      inflight.set(vid, p);
      return p;
    },
    async touchDevice(uid, vid, set, first, inc) {
      await Promise.all([
        c.devices.updateOne({ _id: vid }, { $set: { ...set, uid, ...(first || {}) }, ...(inc ? { $inc: inc } : {}) }, { upsert: true }),
        c.users.updateOne({ _id: uid }, { $set: lastSeenFields(set) }),
      ]);
    },
    async addEvents(uid, list) {
      if (!list.length) return;
      await Promise.all([c.events.insertMany(list, { ordered: false }), bump(uid, 'events', list.length)]);
    },
    async addLocation(doc) {
      const set = { locationStatus: doc.status };
      if (doc.status === 'granted') set.lastLocation = { latitude: doc.latitude, longitude: doc.longitude, accuracy: doc.accuracy, at: doc.at };
      await Promise.all([c.locations.insertOne(doc), c.users.updateOne({ _id: doc.uid }, { $set: set, $inc: { 'folders.locations': 1 } })]);
    },
    authByEmail: (email) => c.auth.findOne({ email }),
    authById: (uid) => c.auth.findOne({ _id: uid }),
    async createAuth(doc) {
      try {
        await c.auth.insertOne(doc);
      } catch (e) {
        if (dupKey(e)) throw Object.assign(new Error('dup'), { code: e.keyPattern?.email || /email/.test(e.message) ? 'EXISTS' : 'HAS_ACCOUNT' });
        throw e;
      }
      await c.users.updateOne({ _id: doc._id }, { $set: { status: 'member', name: doc.name }, $inc: { 'folders.auth': 1 } });
    },
    async updateAuth(uid, set) {
      await c.auth.updateOne({ _id: uid }, { $set: set });
    },
    async attachDevice(vid, to) {
      const cur = await c.devices.findOne({ _id: vid }, { projection: { uid: 1 } });
      const from = cur?.uid;
      if (from === to) return;
      await c.devices.updateOne({ _id: vid }, { $set: { uid: to }, $setOnInsert: { createdAt: Date.now() } }, { upsert: true });
      await c.users.updateOne({ _id: to }, { $addToSet: { vids: vid } });
      cache.set(vid, to);
      if (!from) return;
      const [hasAuth, src] = await Promise.all([c.auth.findOne({ _id: from }, { projection: { _id: 1 } }), c.users.findOne({ _id: from })]);
      if (hasAuth || !src) return; // another member's data stays theirs
      const move = { $set: { uid: to, mergedFrom: from } };
      await Promise.all([
        c.events.updateMany({ uid: from }, move),
        c.locations.updateMany({ uid: from }, move),
        c.photos.updateMany({ uid: from }, move),
        c.wishes.updateMany({ uid: from }, move),
        c.devices.updateMany({ uid: from }, move),
      ]);
      const inc = Object.fromEntries(FOLDERS.map((f) => [`folders.${f}`, src.folders?.[f] || 0]));
      await c.users.updateOne({ _id: to }, { $inc: inc });
      if (src.lastLocation) await c.users.updateOne({ _id: to, lastLocation: { $exists: false } }, { $set: { lastLocation: src.lastLocation } });
      await c.users.updateOne({ _id: from }, { $set: { status: 'merged', mergedInto: to } });
    },
    userRoot: (uid) => c.users.findOne({ _id: uid }),
    getPhoto: (id) => c.photos.findOne({ _id: id }),
    async putPhoto(doc) {
      const { _id, ...rest } = doc;
      const r = await c.photos.updateOne({ _id }, { $setOnInsert: rest }, { upsert: true });
      if (r.upsertedCount) await bump(doc.uid, 'photos');
    },
    async putWish(id, uid, onInsert, set, flags, template) {
      const update = { $set: { ...set, ...Object.fromEntries(flags.map((f) => [`flags.${f}`, true])) }, $setOnInsert: { ...onInsert } };
      if (template) update.$addToSet = { templates: template };
      try {
        // the uid is part of the filter, so a wish that belongs to somebody else can never be overwritten
        const r = await c.wishes.updateOne({ _id: id, uid }, update, { upsert: true });
        if (r.upsertedCount) await bump(uid, 'wishes');
      } catch (e) {
        if (!dupKey(e)) throw e;
      }
    },
    async gallery(uid) {
      const [photos, wishes] = await Promise.all([
        c.photos.find({ uid }, { projection: { bytes: 0 } }).sort({ createdAt: -1 }).limit(300).toArray(),
        c.wishes.find({ uid }).sort({ updatedAt: -1 }).limit(300).toArray(),
      ]);
      return { photos, wishes };
    },
    async dump() {
      return {};
    },
  };
}

export const NOW = () => Date.now();
export { DAY, FOLDERS };
