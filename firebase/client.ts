
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBJZhQoUEdaNGE-Wj-yXfhFywu0oT6nxtE",
  authDomain: "fir-auth-f8d5e.firebaseapp.com",
  projectId: "fir-auth-f8d5e",
  storageBucket: "fir-auth-f8d5e.firebasestorage.app",
  messagingSenderId: "165071461908",
  appId: "1:165071461908:web:7d7ada0fa26a1bbea51101",
  measurementId: "G-KBD23JVHSX"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

