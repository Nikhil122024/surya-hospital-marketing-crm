import { collection, getDocs, limit, query } from "firebase/firestore";
import { firestore } from "./client";

export async function getCollection<T>(collectionName: string, maxResults = 100): Promise<T[]> {
	if (!firestore) return [];
	const snapshot = await getDocs(query(collection(firestore, collectionName), limit(maxResults)));
	return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
}