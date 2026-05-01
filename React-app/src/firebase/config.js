import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { initializeFirestore, setLogLevel } from "firebase/firestore";
import { getDatabase, ref, get, set, push, update, remove, onValue, query, orderByChild, equalTo } from "firebase/database";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Keep Firestore for backward compatibility if needed
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false
});
setLogLevel("debug");

// Realtime Database
const database = getDatabase(app);

export { 
    app, 
    auth, 
    db, 
    database, 
    ref, 
    get, 
    set, 
    push, 
    update, 
    remove, 
    onValue, 
    query, 
    orderByChild, 
    equalTo,
    GoogleAuthProvider,
    signInWithPopup
};

