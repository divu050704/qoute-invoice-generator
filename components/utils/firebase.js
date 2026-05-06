import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD2He3RORDaXFFJGDAsSQh3MmO_UJ9vjH8",
  authDomain: "quotepg.firebaseapp.com",
  projectId: "quotepg",
  storageBucket: "quotepg.firebasestorage.app",
  messagingSenderId: "778653067075",
  appId: "1:778653067075:web:20b782f7edeed28cbe71f6",
  measurementId: "G-7WP68YQ7HZ"
};

const app = initializeApp(firebaseConfig);
export const db      = getFirestore(app);
export const storage = getStorage(app);

// Try to use AsyncStorage for auth persistence (requires native rebuild).
// Falls back to memory persistence if not yet linked.
let auth;
try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (_) {
  // AsyncStorage not linked yet — use memory persistence until next native rebuild
  const { getAuth } = require('firebase/auth');
  auth = getAuth(app);
}
export { auth };
