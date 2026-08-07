import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) return getAnalytics(app);
  return null;
};

export default app;
