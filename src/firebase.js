import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDzMqRBa7ZkoL_j8LI_qH6UD5t5N6epLCQ",
  authDomain: "summarist-fd153.firebaseapp.com",
  projectId: "summarist-fd153",
  storageBucket: "summarist-fd153.firebasestorage.app",
  messagingSenderId: "57461188331",
  appId: "1:57461188331:web:ed5130c2b52e7b61bac0ae",
  measurementId: "G-CJ4ED5XY0F"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);