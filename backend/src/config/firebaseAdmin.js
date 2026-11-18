
import "dotenv/config";

import {
  initializeApp,
  getApps,
  cert,
} from "firebase-admin/app";

import { getAuth } from "firebase-admin/auth";

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey,
};

if (!firebaseConfig.projectId || !firebaseConfig.clientEmail || !privateKey) {
  throw new Error("Firebase Admin credentials are missing in backend .env");
}

const firebaseApp =
  getApps().length > 0
    ? getApps()[0]
    : initializeApp({
        credential: cert(firebaseConfig),
      });

export const firebaseAdminAuth = getAuth(firebaseApp);
