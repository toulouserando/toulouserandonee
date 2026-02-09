import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";

// 1. On définit la config sans valeurs "dummy" qui font planter Firebase
export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
};

// 2. Initialisation sécurisée
let app: FirebaseApp | undefined;

// On ne tente l'initialisation QUE si le projectId est réellement défini
if (typeof window !== "undefined" || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  try {
    if (firebaseConfig.projectId && firebaseConfig.projectId !== "toulouserando-dummy") {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
  } catch (error) {
    console.error("Erreur lors de l'initialisation Firebase:", error);
  }
}

export { app };