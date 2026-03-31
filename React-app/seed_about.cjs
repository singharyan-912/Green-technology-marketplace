const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

const firebaseConfig = {
  apiKey: "AIzaSyDPql5-GKYCCyfpSbpwlZ3E_zLpnqKb_nE",
  authDomain: "test-21190.firebaseapp.com",
  databaseURL: "https://test-21190-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-21190",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const aboutData = {
  mission: "Empowering individuals to transition to sustainable energy through innovation and accessibility.",
  vision: "To become the world's leading marketplace for sustainable living, making eco-friendly tech the 'new normal' for every household.",
  story: "Founded in 2025, GreenTech started with a simple question: 'Why is it so hard to find reliable solar tech and eco-products in one place?' What began as a small project to curate EV batteries and solar lights has grown into a global marketplace. We partner with vetted vendors who share our passion for the environment, ensuring that every product you buy contributes to a healthier earth.",
  stats: {
    productsSold: "5k+",
    vettedVendors: "120+",
    co2Saved: "10k"
  },
  values: [
    { title: "Innovation", description: "We constantly seek out the latest advancements in clean energy and sustainable materials." },
    { title: "Integrity", description: "Transparency is key. We only list products that meet our strict eco-friendly standards." },
    { title: "Community", description: "We support local green entrepreneurs and foster a community of eco-conscious shoppers." },
    { title: "Accessibility", description: "Saving the planet shouldn't be expensive. We work hard to keep green tech affordable." }
  ]
};

set(ref(db, 'about'), aboutData).then(() => {
  console.log("About section seeded successfully!");
  process.exit();
}).catch((error) => {
  console.error("Error seeding about section:", error);
  process.exit(1);
});
