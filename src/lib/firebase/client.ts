import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    getFirestore,
    Firestore,
} from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let clientApp: FirebaseApp | undefined;
let clientDb: Firestore | undefined;

export function getClientFirebaseApp(): FirebaseApp | undefined {
    if (typeof window === "undefined") return undefined;
    if (!getApps().length) {
        if (firebaseConfig.projectId) {
            clientApp = initializeApp(firebaseConfig);
        }
    } else {
        clientApp = getApp();
    }
    return clientApp;
}

/**
 * Initializes and returns the client Firestore instance with multi-tab synchronized persistence.
 * This prevents the Capacitor Android webview persistence freeze bug that occurs with legacy enableIndexedDbPersistence.
 */
export function getClientFirestore(): Firestore | undefined {
    if (typeof window === "undefined") return undefined;
    if (clientDb) return clientDb;

    const app = getClientFirebaseApp();
    if (!app) return undefined;

    try {
        clientDb = initializeFirestore(app, {
            localCache: persistentLocalCache({
                tabManager: persistentMultipleTabManager(),
            }),
        });
    } catch {
        // Fall back to getFirestore if already initialized or if multi-tab manager is already active
        try {
            clientDb = getFirestore(app);
        } catch {
            // ignore
        }
    }

    return clientDb;
}
