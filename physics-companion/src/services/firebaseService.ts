import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { AppState } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
};
let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && !String(firebaseConfig.apiKey).startsWith('your_'));
}
function getDb(): Firestore | null {
  if (!isFirebaseConfigured()) return null;
  if (!appInstance) appInstance = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  if (!dbInstance && appInstance) dbInstance = getFirestore(appInstance);
  return dbInstance;
}
export async function syncStateToCloud(state: AppState): Promise<boolean> {
  const db = getDb();
  if (!db || !state.syncId) return false;
  try {
    await setDoc(doc(db, 'physics_users', state.syncId), { ...state, chatHistory: state.chatHistory.slice(-30), updatedAt: new Date().toISOString() });
    return true;
  } catch { return false; }
}
export async function fetchStateFromCloud(syncId: string): Promise<AppState | null> {
  const db = getDb();
  if (!db || !syncId) return null;
  try {
    const snap = await getDoc(doc(db, 'physics_users', syncId));
    return snap.exists() ? (snap.data() as AppState) : null;
  } catch { return null; }
}