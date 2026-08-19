import type { FirestoreRecord } from "@/lib/firebase/repository";
import { getDemoData } from "@/lib/demo-service";

export function getDemoRecords(collection: string): FirestoreRecord[] {
  return getDemoData(collection);
}
