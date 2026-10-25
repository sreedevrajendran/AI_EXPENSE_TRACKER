import * as admin from 'firebase-admin';
import { getMockFirestore } from './mockDb';

const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY?.trim();
const privateKey = rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : undefined;

export const isFirebaseConfigured = Boolean(projectId && clientEmail && privateKey);

if (isFirebaseConfigured && !admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: projectId!,
                clientEmail: clientEmail!,
                privateKey: privateKey!,
            }),
        });
        admin.firestore().settings({ ignoreUndefinedProperties: true });
        console.log('Firebase Admin SDK initialized successfully.');
    } catch (error) {
        console.error('Firebase Admin SDK initialization error', error);
    }
} else if (!isFirebaseConfigured) {
    console.warn('Firebase Admin credentials not set. Using local in-memory storage.');
}

export const db = isFirebaseConfigured && admin.apps.length > 0
    ? admin.firestore()
    : (getMockFirestore() as unknown as admin.firestore.Firestore);

export const auth = isFirebaseConfigured && admin.apps.length > 0
    ? admin.auth()
    : (null as unknown as admin.auth.Auth);

export const storage = isFirebaseConfigured && admin.apps.length > 0
    ? admin.storage()
    : (null as unknown as admin.storage.Storage);
