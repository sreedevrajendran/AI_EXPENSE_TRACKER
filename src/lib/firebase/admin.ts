import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        // Parse the private key from string, replacing \n with actual newlines
        const privateKey = process.env.FIREBASE_PRIVATE_KEY
            ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
            : undefined;

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: process.env.FIREBASE_PROJECT_ID,
                clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                privateKey: privateKey,
            }),
        });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin SDK initialization error', error);
    }
}

export const db = admin.apps.length > 0 ? admin.firestore() : (null as unknown as admin.firestore.Firestore);
export const auth = admin.apps.length > 0 ? admin.auth() : (null as unknown as admin.auth.Auth);
export const storage = admin.apps.length > 0 ? admin.storage() : (null as unknown as admin.storage.Storage);
