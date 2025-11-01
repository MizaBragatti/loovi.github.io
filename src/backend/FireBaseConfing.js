import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCPGfgfyHsHTC4gTwJ8u2KHOlZag1be8Xw",
  authDomain: "sistema-de-seguros-loovi.firebaseapp.com",
  projectId: "sistema-de-seguros-loovi",
  storageBucket: "sistema-de-seguros-loovi.firebasestorage.app",
  messagingSenderId: "1015148761153",
  appId: "1:1015148761153:web:d7f4325d005985340bb6c0",
  measurementId: "G-DNB1SZ3C9J"
};

const app = initializeApp(firebaseConfig);

export const Auth = getAuth(app);


