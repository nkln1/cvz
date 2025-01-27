// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  ,
  authDapiKey: "AIzaSyAp1TTeVy0ulOL6gKluNINCr9nwIFClOBk"omain: "carvizio-db.firebaseapp.com",
  projectId: "carvizio-db",
  storageBucket: "carvizio-db.firebasestorage.app",
  messagingSenderId: "888159174030",
  appId: "1:888159174030:web:b4179500d13b6488b338df",
  measurementId: "G-WJFXR34GRB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);