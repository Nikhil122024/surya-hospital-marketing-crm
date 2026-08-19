import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, updateDoc, type DocumentData, type QueryConstraint } from "firebase/firestore";
import { firebaseAuth, firestore, isFirebaseConfigured } from "./client";

export type FirestoreRecord = DocumentData & { id: string };

function requireFirestore() {
  if (!firestore || !firebaseAuth || !isFirebaseConfigured) throw new Error("Firebase is not configured. Add .env.local values before using CRM data.");
  if (!firebaseAuth.currentUser) throw new Error("Your session has expired. Please sign in again.");
  return { db: firestore, userId: firebaseAuth.currentUser.uid };
}

export async function listRecords<T extends FirestoreRecord>(collectionName: string, constraints: QueryConstraint[] = [], maxResults = 100) {
  const { db } = requireFirestore();
  const snapshot = await getDocs(query(collection(db, collectionName), ...constraints, limit(maxResults)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}

export async function getRecord<T extends FirestoreRecord>(collectionName: string, recordId: string) {
  const { db } = requireFirestore();
  const snapshot = await getDoc(doc(db, collectionName, recordId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as T) : null;
}

export async function createRecord<T extends Record<string, unknown>>(collectionName: string, values: T) {
  const { db, userId } = requireFirestore();
  const reference = await addDoc(collection(db, collectionName), { ...values, createdBy: userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return reference.id;
}

export async function updateRecord<T extends Record<string, unknown>>(collectionName: string, recordId: string, values: T) {
  const { db } = requireFirestore();
  await updateDoc(doc(db, collectionName, recordId), { ...values, updatedAt: serverTimestamp() });
}

export async function deleteRecord(collectionName: string, recordId: string) {
  const { db } = requireFirestore();
  await deleteDoc(doc(db, collectionName, recordId));
}

export { orderBy };
