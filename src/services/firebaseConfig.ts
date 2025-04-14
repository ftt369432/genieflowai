import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Use real Firebase configuration from the client
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDItejnhSm8zRoEW9aLP7dJwhWWtNE8-w8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "genieflowlaw.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "genieflowlaw",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "genieflowlaw.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "460991833008",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:460991833008:web:1b36e15d4dd5f04c09ec75",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-LGMXCWTY2Z"
};

// Use Google Client ID from .env
const googleClientId = import.meta.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || '893839456473-j0r1799niv3d5o9k5o503j3sd0huivdh.apps.googleusercontent.com';

console.log("Initializing Firebase with config:", { 
  apiKey: firebaseConfig.apiKey ? "PRESENT" : "MISSING", 
  projectId: firebaseConfig.projectId,
  googleClientId: googleClientId ? "PRESENT" : "MISSING"
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Initialize Analytics if in browser environment
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Firebase Analytics could not be initialized:", error);
  }
}

export { app, auth, analytics, googleClientId };

// Helper to initialize Firebase in other modules
export const initFirebase = () => {
  return app;
}; 