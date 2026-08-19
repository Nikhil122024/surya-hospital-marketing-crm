import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { firebaseStorage, isFirebaseConfigured } from "./client";

export async function uploadFile(file: File, path: string, onProgress?: (progress: number) => void) {
	if (!firebaseStorage || !isFirebaseConfigured) throw new Error("Firebase Storage is not configured.");
	if (file.size > 10 * 1024 * 1024) throw new Error("Files must be smaller than 10 MB.");
	const upload = uploadBytesResumable(ref(firebaseStorage, path), file);
	return new Promise<string>((resolve, reject) => {
		upload.on("state_changed", (snapshot) => onProgress?.(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)), reject, async () => resolve(await getDownloadURL(upload.snapshot.ref)));
	});
}