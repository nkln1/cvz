import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";

// Firebase configuration
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
let app;
try {
  app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // Enable persistence
  setPersistence(auth, browserLocalPersistence)
    .then(() => {
      console.log("Firebase persistence enabled successfully");
    })
    .catch((error) => {
      console.error("Error enabling persistence:", error);
    });
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
  throw error;
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Define collections
export const collectionsConfig = {
  users: collection(db, 'users'),
  clients: collection(db, 'clients'),
  services: collection(db, 'services'),
  bookings: collection(db, 'bookings'),
  reviews: collection(db, 'reviews')
};

// Log Firebase configuration status
console.log("Firebase Auth Status:", auth.currentUser ? "Logged in" : "Not logged in");
console.log("Firestore Status:", db ? "Initialized" : "Not initialized");

// Collection References - use these for database operations
export const {
  users: usersCollection,
  clients: clientsCollection,
  services: servicesCollection,
  bookings: bookingsCollection,
  reviews: reviewsCollection
} = collectionsConfig;