import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDizoh0pHKMkUp32v8oMmrMcePcvOauugM",
  authDomain: "auction-hub-84d3d.firebaseapp.com",
  projectId: "auction-hub-84d3d",
  storageBucket: "auction-hub-84d3d.firebasestorage.app",
  messagingSenderId: "1074565819406",
  appId: "1:1074565819406:web:0aa730565d3cd7157c205f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  try {
    const ref = doc(db, 'auctions', 'test-diagnostic-id');
    await setDoc(ref, { 
      title: 'diagnostic-test', 
      createdAt: Date.now() 
    });
    console.log("SUCCESS: Firestore Write worked!");
    process.exit(0);
  } catch (e) {
    console.error("FIREBASE ERROR:", e.code, e.message);
    process.exit(1);
  }
}
test();
