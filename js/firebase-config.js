// ============================================================
//  NEXUS ER:LC DASHBOARD — FIREBASE CONFIGURATION
//  
//  HOW TO SETUP (FREE):
//  1. Go to https://console.firebase.google.com/
//  2. Click "Add project" → name it anything (e.g. "nexus-erlc")
//  3. Disable Google Analytics (optional) → Create project
//  4. Click the </> icon (Web app) → Register app
//  5. Copy the firebaseConfig values below
//  6. In Firebase console: Build → Firestore Database
//     → Create database → Start in TEST mode → Choose region
//  7. Replace the placeholder values below with your real config
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBUrqFgAE96QgPnZKgUTvVr2Zz3LKGg_3k",
  authDomain: "testing-98046.firebaseapp.com",
  projectId: "testing-98046",
  storageBucket: "testing-98046.firebasestorage.app",
  messagingSenderId: "438830288868",
  appId: "1:438830288868:web:5b402ce807b7e847ed01f1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Collections
const COLLECTIONS = {
  staff:         'staff',
  shifts:        'shifts',
  patrols:       'patrols',
  announcements: 'announcements',
  activity:      'activity',
  settings:      'settings'
};

// ============================================================
//  OFFLINE FALLBACK (localStorage) — works even without Firebase
//  The dashboard will use localStorage if Firebase is not configured.
// ============================================================
const USE_LOCAL = firebaseConfig.apiKey === "YOUR_API_KEY";

if (USE_LOCAL) {
  console.warn("⚠️  Firebase not configured. Running in LOCAL MODE (localStorage).");
  console.warn("   Data will only persist in this browser. See firebase-config.js to connect Firebase.");
}

// Unified data layer — uses Firestore OR localStorage transparently
const DataStore = {
  _get(col) {
    try { return JSON.parse(localStorage.getItem('nexus_' + col) || '[]'); }
    catch { return []; }
  },
  _set(col, data) {
    localStorage.setItem('nexus_' + col, JSON.stringify(data));
  },
  _getObj(key) {
    try { return JSON.parse(localStorage.getItem('nexus_obj_' + key) || 'null'); }
    catch { return null; }
  },
  _setObj(key, val) {
    localStorage.setItem('nexus_obj_' + key, JSON.stringify(val));
  },

  async getAll(col) {
    if (USE_LOCAL) return this._get(col);
    const snap = await db.collection(col).orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async add(col, data) {
    const id = 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);
    const record = { id, createdAt: new Date().toISOString(), ...data };
    if (USE_LOCAL) {
      const arr = this._get(col);
      arr.unshift(record);
      this._set(col, arr);
      return id;
    }
    const ref = await db.collection(col).add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    return ref.id;
  },

  async update(col, id, data) {
    if (USE_LOCAL) {
      const arr = this._get(col);
      const idx = arr.findIndex(r => r.id === id);
      if (idx !== -1) arr[idx] = { ...arr[idx], ...data };
      this._set(col, arr);
      return;
    }
    await db.collection(col).doc(id).update(data);
  },

  async delete(col, id) {
    if (USE_LOCAL) {
      const arr = this._get(col).filter(r => r.id !== id);
      this._set(col, arr);
      return;
    }
    await db.collection(col).doc(id).delete();
  },

  async clearAll(col) {
    if (USE_LOCAL) { this._set(col, []); return; }
    const snap = await db.collection(col).get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  },

  async getSetting(key) {
    if (USE_LOCAL) return this._getObj(key);
    const doc = await db.collection('settings').doc(key).get();
    return doc.exists ? doc.data() : null;
  },

  async setSetting(key, val) {
    if (USE_LOCAL) { this._setObj(key, val); return; }
    await db.collection('settings').doc(key).set(val);
  }
};
