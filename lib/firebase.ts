import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDPL1JWi1tpN4zpkAlc4I2YpglOz20T_js",
  authDomain: "colony-bois.firebaseapp.com",
  projectId: "colony-bois",
  storageBucket: "colony-bois.firebasestorage.app",
  messagingSenderId: "556277553301",
  appId: "1:556277553301:web:521a90fd2d0dd0f992639c",
  measurementId: "G-2RXB0TBD10",
};

const IDB_RECOVERY_KEY = "cbs-firestore-idb-recovered";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function isIdbFailure(reason: unknown) {
  const text = reason instanceof Error ? `${reason.name} ${reason.message}` : String(reason ?? "");
  return /indexeddb|idbdatabase|corruption/i.test(text);
}

function createFirestore() {
  if (typeof window === "undefined") return getFirestore(app);

  const skipPersistent =
    process.env.NODE_ENV !== "production" || window.sessionStorage.getItem(IDB_RECOVERY_KEY) === "1";

  try {
    return initializeFirestore(
      app,
      skipPersistent
        ? { localCache: memoryLocalCache() }
        : { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) },
    );
  } catch {
    try {
      return initializeFirestore(app, { localCache: memoryLocalCache() });
    } catch {
      return getFirestore(app);
    }
  }
}

export const auth = getAuth(app);
export const db = createFirestore();
export const storage = getStorage(app);

if (typeof window !== "undefined") {
  const recover = async (reason: unknown) => {
    if (!isIdbFailure(reason) || sessionStorage.getItem(IDB_RECOVERY_KEY) === "1") return;
    sessionStorage.setItem(IDB_RECOVERY_KEY, "1");
    try {
      const list = (await indexedDB.databases?.()) ?? [];
      for (const info of list) {
        if (info.name && /firebase|firestore/i.test(info.name)) indexedDB.deleteDatabase(info.name);
      }
    } catch {
      // Browser may block listing databases; reload still switches to memory cache.
    }
    window.location.reload();
  };

  window.addEventListener("unhandledrejection", (event) => {
    if (!isIdbFailure(event.reason)) return;
    event.preventDefault();
    void recover(event.reason);
  });
  window.addEventListener("error", (event) => {
    if (!isIdbFailure(event.error ?? event.message)) return;
    event.preventDefault();
    void recover(event.error ?? event.message);
  });
}

export const initAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) return getAnalytics(app);
  return null;
};

export default app;
