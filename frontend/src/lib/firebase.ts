// src/lib/firebase.ts
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
    getFirestore, Firestore,
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
} from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock-api-key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock-project-id",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const IS_REAL_CONFIG = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== 'mock-api-key'
);

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (typeof window !== 'undefined' && IS_REAL_CONFIG) {
    // Initialize Firebase App (singleton)
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    // Initialize Firestore with:
    // - Persistent multi-tab cache → offline reads always work from cache
    // - experimentalForceLongPolling → better connectivity behind corporate firewalls/VPNs
    // This eliminates the "Backend didn't respond within 10 seconds" warning
    // because cached data will be served immediately instead of waiting for the network.
    db = getApps().length === 1
        ? initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
            experimentalForceLongPolling: true, // [FIX] Prevents WebChannel timeout errors
        })
        : getFirestore(app);

    auth = getAuth(app);
} else {
    // Mock objects for SSR/Build or when Firebase keys are not configured
    app = {} as FirebaseApp;
    db = {} as Firestore;
    auth = {} as Auth;
}

export { db, auth };
export default app;
