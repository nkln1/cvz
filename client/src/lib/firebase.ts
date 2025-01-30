import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  messagingSenderId: "888159174030",
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: "G-WJFXR34GRB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with persistence
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("Firebase persistence enabled successfully");
  })
  .catch((error) => {
    console.error("Error enabling persistence:", error);
  });

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Cloud Messaging
let messaging: any = null;
try {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  }
  messaging = getMessaging(app);
} catch (error) {
  console.error("Error initializing Firebase Messaging:", error);
}

export { app, auth, db, messaging };

// Log Firebase configuration status
console.log("Firebase Auth Status:", auth.currentUser ? "Logged in" : "Not logged in");
console.log("Firestore Status:", db ? "Initialized" : "Not initialized");
console.log("Messaging Status:", messaging ? "Initialized" : "Not initialized");