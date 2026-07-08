import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export function getAdminDb() {
  // If env vars are missing (e.g. during Vercel build without them set), return null
  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
    console.warn("Firebase Admin environment variables are missing. Skipping initialization.");
    return null;
  }

  if (!getApps().length) {
    try {
      initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Replace escaped newline characters from the env string
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } catch (error: any) {
      console.error('Firebase admin initialization error', error.stack);
      return null;
    }
  }

  return getFirestore();
}
