import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from './../../firebase-applet-config.json';

let db: any;
let auth: any;

try {
  const app = initializeApp(firebaseConfig);
  // @ts-ignore
  db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  auth = getAuth(app);

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
  // We don't throw to avoid crashing the whole app, instead we can show a notification if we had more time.
  // For now, logging to console is safer for app stability.
}

export { db, auth, handleFirestoreError };
