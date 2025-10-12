import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';

const adminConfig = {
	projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
	clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
	privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const adminApp = !getApps().length
	? initializeApp({
			credential: cert(adminConfig),
			databaseURL: process.env.NEXT_PUBLIC_FIREBASE_RTDB_URL,
		})
	: getApps()[0];

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
export const adminRTDB = getDatabase(adminApp);
