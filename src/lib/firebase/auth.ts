import { browserLocalPersistence, browserSessionPersistence, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut as firebaseSignOut } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "./client";
import type { User } from "@/types";

export const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === "true";
const demoSessionKey = "surya-demo-user";
const demoUsers: Record<string, User> = {
	"employee@surya.com": { id: "EMP003", uid: "EMP003", name: "Rajiv Mehta", role: "EMPLOYEE", department: "MARKETING", designation: "Marketing Executive", email: "employee@surya.com", status: "ACTIVE", approved: true, gpsPolicy: "MANDATORY" } as User,
	"marketing@surya.com": { id: "EMP001", uid: "EMP001", name: "Amit Kumar", role: "MARKETING_EXECUTIVE", department: "MARKETING", designation: "Marketing Executive", email: "marketing@surya.com", status: "ACTIVE", approved: true, gpsPolicy: "MANDATORY" } as User,
	"admin@surya.com": { id: "ADMIN001", uid: "ADMIN001", name: "Surya Admin", role: "SUPER_ADMIN", department: "ADMINISTRATION", designation: "Administrator", email: "admin@surya.com", status: "ACTIVE", approved: true, gpsPolicy: "DISABLED" } as User,
};
export function getDemoUser(email: string) { return demoUsers[email.toLowerCase()] ?? null; }

export function authErrorMessage(error: unknown) {
	const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
	if (["auth/invalid-credential", "auth/wrong-password", "auth/user-not-found", "auth/invalid-email"].includes(code)) return "Invalid email or password.";
	if (code === "auth/user-disabled") return "Your account has been disabled. Please contact the Marketing Administrator.";
	if (code === "auth/too-many-requests") return "Too many attempts. Please wait and try again later.";
	if (code === "auth/network-request-failed") return "Network connection unavailable. Please try again.";
	if (error instanceof Error && error.message.includes("Firebase is not configured")) return "Firebase is not configured. Contact the administrator before signing in.";
	return error instanceof Error ? error.message : "Unable to sign in. Please try again.";
}

function requireAuth() {
	if (!firebaseAuth || !isFirebaseConfigured) throw new Error("Firebase is not configured. Add the values from .env.example.");
	return firebaseAuth;
}

export async function signIn(email: string, password: string, remember = false) {
	if (isDemoMode && !isFirebaseConfigured) {
		const demoUser = getDemoUser(email);
		const expectedPassword = email.toLowerCase() === "admin@surya.com" ? "admin123" : email.toLowerCase() === "marketing@surya.com" ? "marketing123" : "employee123";
		if (!demoUser || password !== expectedPassword) throw new Error("Invalid email or password.");
		const normalizedEmail = email.toLowerCase();
		localStorage.setItem(demoSessionKey, normalizedEmail);
		sessionStorage.setItem(demoSessionKey, normalizedEmail);
		window.dispatchEvent(new Event("surya-demo-auth"));
		return { user: { uid: demoUser.id, email: demoUser.email } };
	}
	const auth = requireAuth();
	await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
	await signInWithEmailAndPassword(auth, email, password);
}
export async function signOut() {
	if (isDemoMode && !isFirebaseConfigured) { localStorage.removeItem(demoSessionKey); sessionStorage.removeItem(demoSessionKey); window.dispatchEvent(new Event("surya-demo-auth")); return; }
	await firebaseSignOut(requireAuth());
}
export async function resetPassword(email: string) { await sendPasswordResetEmail(requireAuth(), email); }