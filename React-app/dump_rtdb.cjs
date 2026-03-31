const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDPql5-GKYCCyfpSbpwlZ3E_zLpnqKb_nE",
  authDomain: "test-21190.firebaseapp.com",
  databaseURL: "https://test-21190-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-21190",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

get(ref(db, '/')).then((snapshot) => {
  if (snapshot.exists()) {
    const data = snapshot.val();
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log("No data available");
  }
  process.exit();
}).catch((error) => {
  console.error(error);
  process.exit(1);
});
