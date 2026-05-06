import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import * as SecureStore from 'expo-secure-store';

// react-native-fs is a native module — only available in custom native builds.
// Gracefully fall back to memory-only mode if it's null (e.g. in Expo Go).
let RNFS = null;
try {
  RNFS = require('react-native-fs').default || require('react-native-fs');
  if (typeof RNFS?.DocumentDirectoryPath !== 'string') RNFS = null;
} catch (_) {
  RNFS = null;
}
const canUseFileCache = RNFS !== null;

const getCacheFilePath = (uid) => {
  if (!canUseFileCache) return null;
  return RNFS.DocumentDirectoryPath + '/doc_cache_' + uid + '.json';
};

// ── In-memory state ──────────────────────────────────────────────────────────
let cachedUserId = null;
let documentCache = null;   // Entire Firestore document cached here
let cacheLoaded = false;
let loadingPromise = null;   // Prevent concurrent Firestore reads

// ── User ID ──────────────────────────────────────────────────────────────────
const getUserId = async () => {
  if (cachedUserId) return cachedUserId;
  try {
    const id = await SecureStore.getItemAsync('app_user_id');
    cachedUserId = id || 'anonymous_user';
    return cachedUserId;
  } catch {
    return 'anonymous_user';
  }
};

// ── Load entire Firestore document ONCE into memory ──────────────────────────
const loadDocumentCache = () => {
  if (cacheLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise; // Already loading

  loadingPromise = (async () => {
    try {
      const uid = await getUserId();
      const cachePath = getCacheFilePath(uid);

      // Try to load from local file system first for INSTANT UI rendering
      let localCacheExists = false;
      if (canUseFileCache && cachePath) {
        try {
          const fileExists = await RNFS.exists(cachePath);
          if (fileExists) {
            const localData = await RNFS.readFile(cachePath, 'utf8');
            if (localData) {
              documentCache = JSON.parse(localData);
              localCacheExists = true;
            }
          }
        } catch (err) {
          console.error('Local cache read error:', err);
        }
      }

      // If no local cache or just to sync with remote, fetch from Firestore
      const fetchFromFirestore = async () => {
        try {
          const docRef = doc(db, 'users', uid);
          // Timeout after 10 seconds so app never hangs on splash screen
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Firestore timeout')), 10000)
          );
          const snap = await Promise.race([getDoc(docRef), timeoutPromise]);
          if (snap.exists()) {
            documentCache = snap.data();
            // Save to local file cache if available
            if (canUseFileCache && cachePath) {
              try { await RNFS.writeFile(cachePath, JSON.stringify(documentCache), 'utf8'); } catch (_) { }
            }
          } else if (!localCacheExists) {
            documentCache = {};
          }
        } catch (e) {
          console.error('Firestore load error (or timeout):', e.message);
          if (!localCacheExists) documentCache = {};
        }
      };

      if (!localCacheExists) {
        // Must wait for Firestore (max 5 seconds)
        await fetchFromFirestore();
      } else {
        // Sync in background, don't wait
        fetchFromFirestore();
      }

    } catch (e) {
      console.error('Initialization error:', e);
      if (!documentCache) documentCache = {};
    } finally {
      cacheLoaded = true;
      loadingPromise = null;
    }
  })();

  return loadingPromise;
};

// ── Public API ────────────────────────────────────────────────────────────────

/** Read a key — first call fetches from Firestore, rest are instant from cache */
export const getItemAsync = async (key) => {
  try {
    await loadDocumentCache();
    const val = documentCache?.[key];
    if (val === undefined || val === null) return null;
    return JSON.stringify(val);
  } catch (e) {
    console.error('getItemAsync error:', e);
    return null;
  }
};

const sanitizeForFirestore = (obj) => {
  if (Array.isArray(obj)) {
    const hasNestedArray = obj.some(item => Array.isArray(item));
    if (hasNestedArray) {
      return obj.map(item => Array.isArray(item) ? sanitizeForFirestore(item[0] || {}) : sanitizeForFirestore(item));
    }
    return obj.map(item => sanitizeForFirestore(item));
  } else if (obj !== null && typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = sanitizeForFirestore(obj[key]);
    }
    return newObj;
  }
  return obj;
};

/** Write a key — updates cache immediately, then syncs to Firestore in background */
export const setItemAsync = async (key, value) => {
  try {
    const uid = await getUserId();
    const docRef = doc(db, 'users', uid);
    let parsedValue = JSON.parse(value);

    // Firebase doesn't support nested arrays. Sanitize to prevent crashes.
    parsedValue = sanitizeForFirestore(parsedValue);

    // Update in-memory cache immediately (UI feels instant)
    if (!documentCache) documentCache = {};
    documentCache[key] = parsedValue;

    // Update local file cache (only if native module available)
    if (canUseFileCache) {
      try {
        const cachePath = getCacheFilePath(uid);
        if (cachePath) await RNFS.writeFile(cachePath, JSON.stringify(documentCache), 'utf8');
      } catch (err) {
        console.error('Local cache write error:', err);
      }
    }

    // Sync to Firestore in the background (fire-and-forget for speed)
    setDoc(docRef, { [key]: parsedValue }, { merge: true }).catch(e => {
      console.error('Firestore background sync error:', e);
    });
  } catch (e) {
    console.error('setItemAsync error:', e);
    throw e;
  }
};

/** Delete a key — clears in cache and Firestore */
export const deleteItemAsync = async (key) => {
  try {
    const uid = await getUserId();
    const docRef = doc(db, 'users', uid);

    if (documentCache) documentCache[key] = [];

    if (canUseFileCache) {
      try {
        const cachePath = getCacheFilePath(uid);
        if (cachePath) await RNFS.writeFile(cachePath, JSON.stringify(documentCache), 'utf8');
      } catch (err) { }
    }

    await setDoc(docRef, { [key]: [] }, { merge: true });
  } catch (e) {
    console.error('deleteItemAsync error:', e);
  }
};

/** Preload all data from Firestore — call this right after login */
export const preloadUserData = async () => {
  cacheLoaded = false;
  documentCache = null;
  await loadDocumentCache();
};

/** Call on logout to wipe all cached state */
export const clearCachedUserId = () => {
  cachedUserId = null;
  documentCache = null;
  cacheLoaded = false;
  loadingPromise = null;
};
