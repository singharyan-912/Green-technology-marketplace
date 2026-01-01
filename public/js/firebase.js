// js/firebase.js

// 1. Import all necessary functions from the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onValue, 
    remove, 
    update, 
    get,
    query,
    orderByChild,
    equalTo 
} from "https://www.gstatic.com/firebasejs/9.1.0/firebase-database.js";

// ADDED THIS: Import for Authentication
import { getAuth } from "https://www.gstatic.com/firebasejs/9.1.0/firebase-auth.js";

// 2. Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDPql5-GKYCCyfpSbpwlZ3E_zLpnqKb_nE",
  authDomain: "test-21190.firebaseapp.com",
  databaseURL: "https://test-21190-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-21190",
  storageBucket: "test-21190.firebasestorage.app",
  messagingSenderId: "278421424793",
  appId: "1:278421424793:web:b4957fb97a3e5092758608",
  measurementId: "G-YE2500CC5F"
};

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app); 
const auth = getAuth(app); // ADDED THIS: Initialize Auth

// 4. Export EVERYTHING in one single block
export { 
    app, 
    database, 
    auth, // ADDED THIS: Export Auth
    ref, 
    push, 
    onValue, 
    remove, 
    update, 
    get, 
    query, 
    orderByChild, 
    equalTo 
};