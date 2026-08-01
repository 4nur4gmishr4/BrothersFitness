/**
 * Firebase Configuration
 * Used for Google Sign-In Authentication
 */
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

// Firebase config - set these in .env.local if using Firebase Auth
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB_dummy_key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "dummy.firebaseapp.com",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "dummy-project",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "dummy-project.appspot.com",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789012:web:dummy12345",
};

// Initialize Firebase only once
let firebaseApp: FirebaseApp | undefined;
let firebaseAuth: Auth | undefined;
let googleProvider: GoogleAuthProvider | undefined;
let firestoreDb: Firestore | undefined;

export function getFirebaseApp(): FirebaseApp {
    if (!firebaseApp) {
        if (getApps().length === 0) {
            firebaseApp = initializeApp(firebaseConfig);
        } else {
            firebaseApp = getApps()[0];
        }
    }
    return firebaseApp;
}

export function getFirebaseAuth(): Auth {
    if (!firebaseAuth) {
        firebaseAuth = getAuth(getFirebaseApp());
    }
    return firebaseAuth;
}

export function getFirestoreDb(): Firestore {
    if (!firestoreDb) {
        firestoreDb = getFirestore(getFirebaseApp());
    }
    return firestoreDb;
}

export function getGoogleProvider(): GoogleAuthProvider {
    if (!googleProvider) {
        googleProvider = new GoogleAuthProvider();
        googleProvider.addScope('email');
        googleProvider.addScope('profile');
    }
    return googleProvider;
}

// Re-export for convenience
export { signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
export type { User as FirebaseUser, UserCredential } from 'firebase/auth';
