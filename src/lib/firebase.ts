import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from './../../firebase-applet-config.json';

let db: any;
let auth: any;
let storage: any;

try {
  const app = initializeApp(firebaseConfig);
  // @ts-ignore
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);
  storage = getStorage(app);

  const testConnection = async () => {
    if (!db) return;
    try {
      await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.error("Please check your Firebase configuration.");
      }
    }
  };
  testConnection();
} catch (e) {
  console.error("Firebase initialization failed:", e);
}

interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: any, operationType: string, path: string | null = null) {
  const info: FirestoreErrorInfo = {
    error: error.code || error.message || String(error),
    operationType: operationType as any,
    path,
    authInfo: auth?.currentUser ? {
      userId: auth.currentUser.uid,
      email: auth.currentUser.email,
      emailVerified: auth.currentUser.emailVerified,
      isAnonymous: auth.currentUser.isAnonymous,
      providerInfo: auth.currentUser.providerData,
    } : null,
  };
  console.error("Firestore Error:", info);
}

export { db, auth, storage, handleFirestoreError };
