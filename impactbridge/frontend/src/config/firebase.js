import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAOHWX6EMohXSPzFBhWGuIh6jB-4U_kiyE",
  authDomain: "impact-e00b2.firebaseapp.com",
  projectId: "impact-e00b2",
  storageBucket: "impact-e00b2.firebasestorage.app",
  messagingSenderId: "534723532387",
  appId: "1:534723532387:web:440f36355a1c75257cca56",
  measurementId: "G-4VNPGPF2QL"
};

export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
// analytics only in browser context
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
