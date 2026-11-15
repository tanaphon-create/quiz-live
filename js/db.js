// ชั้นเชื่อมต่อข้อมูลแบบ realtime — ใช้ API เดียวกันทั้ง Firebase และโหมดทดลอง (local)
import { FIREBASE } from './config.js';

const FB_V = '10.12.2';
export const TS = { '.sv': 'timestamp' }; // เวลาเซิร์ฟเวอร์ (Firebase เข้าใจ object นี้โดยตรง)

export async function connect() {
  const forceLocal = new URLSearchParams(location.search).has('local');
  if (!forceLocal && FIREBASE && FIREBASE.databaseURL) return firebaseDB();
  return localDB();
}

async function firebaseDB() {
  const base = `https://www.gstatic.com/firebasejs/${FB_V}/`;
  const [{ initializeApp }, A, D] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-database.js'),
  ]);
  const app = initializeApp(FIREBASE, 'quizlive');
  const auth = A.getAuth(app);
  await auth.authStateReady();
  if (!auth.currentUser) await A.signInAnonymously(auth);
  const db = D.getDatabase(app);
  const r = (p) => D.ref(db, p);
  let offset = 0;
  D.onValue(r('.info/serverTimeOffset'), (s) => (offset = s.val() || 0));
  return {
    mode: 'firebase',
    uid: auth.currentUser.uid,
    now: () => Date.now() + offset,
    get: async (p) => (await D.get(r(p))).val(),
    set: (p, v) => D.set(r(p), v),
    update: (p, o) => D.update(r(p), o),
    remove: (p) => D.remove(r(p)),
    on: (p, cb) => D.onValue(r(p), (s) => cb(s.val())),
    onDisconnect: (p, v) => D.onDisconnect(r(p)).set(v),
    connected: (cb) => D.onValue(r('.info/connected'), (s) => cb(!!s.val())),
  };
}

function localDB() {
  const KEY = 'quizlive:db';
  let uid = sessionStorage.getItem('quizlive:uid');
  if (!uid) {
    uid = 'u' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('quizlive:uid', uid);
  }
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('quizlive') : null;
  const load = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  let tree = load();
  const listeners = new Set();
  const split = (p) => p.split('/').filter(Boolean);
  const getAt = (t, p) => {
    let n = t;
    for (const k of split(p)) {
      if (n == null || typeof n !== 'object') return null;
      n = n[k];
    }
    return n === undefined ? null : n;
  };
  const resolve = (v) => {
    if (v && typeof v === 'object') {
      if (v['.sv'] === 'timestamp') return Date.now();
      const o = Array.isArray(v) ? [] : {};
      for (const k in v) o[k] = resolve(v[k]);
      return o;
    }
    return v;
  };
  const setAt = (p, v) => {
    const ks = split(p);
    const chain = [tree];
    let n = tree;
    for (let i = 0; i < ks.length - 1; i++) {
      if (n[ks[i]] == null || typeof n[ks[i]] !== 'object') {
        if (v == null) return;
        n[ks[i]] = {};
      }
      n = n[ks[i]];
      chain.push(n);
    }
    const last = ks[ks.length - 1];
    if (v == null) {
      delete n[last];
      for (let i = chain.length - 1; i > 0; i--) {
        if (Object.keys(chain[i]).length) break;
        delete chain[i - 1][ks[i - 1]];
      }
    } else n[last] = v;
  };
  const fire = () => {
    for (const l of listeners) {
      const s = JSON.stringify(getAt(tree, l.path));
      if (s !== l.last) {
        l.last = s;
        try { l.cb(JSON.parse(s)); } catch (e) { console.error(e); }
      }
    }
  };
  const commit = async (fn) => {
    tree = load();
    fn();
    localStorage.setItem(KEY, JSON.stringify(tree));
    bc && bc.postMessage(1);
    fire();
  };
  const refresh = () => { tree = load(); fire(); };
  if (bc) bc.onmessage = refresh;
  window.addEventListener('storage', (e) => e.key === KEY && refresh());

  return {
    mode: 'local',
    uid,
    now: () => Date.now(),
    get: async (p) => { tree = load(); return JSON.parse(JSON.stringify(getAt(tree, p))); },
    set: (p, v) => commit(() => setAt(p, resolve(v))),
    update: (p, o) => commit(() => { for (const k in o) setAt(p + '/' + k, resolve(o[k])); }),
    remove: (p) => commit(() => setAt(p, null)),
    on: (p, cb) => {
      const l = { path: p, cb, last: undefined };
      listeners.add(l);
      queueMicrotask(() => {
        l.last = JSON.stringify(getAt(tree, p));
        cb(JSON.parse(l.last));
      });
      return () => listeners.delete(l);
    },
    onDisconnect: (p, v) => {
      window.addEventListener('pagehide', () => {
        tree = load(); setAt(p, v);
        localStorage.setItem(KEY, JSON.stringify(tree));
        bc && bc.postMessage(1);
      });
    },
    connected: (cb) => cb(true),
  };
}
