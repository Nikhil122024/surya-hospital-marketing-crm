"use client";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { firebaseAuth, firestore } from "@/lib/firebase/client";
import { getDemoUser, isDemoMode, signOut } from "@/lib/firebase/auth";
import { BrandLogo } from "@/components/brand-logo";
import { toast } from "sonner";
import type { Department, GpsPolicy, Role, User } from "@/types";
interface AuthState { user: User | null; profile: User | null; role: Role | null; department: Department | string | null; gpsPolicy: GpsPolicy; campAccess: boolean; loading: boolean; isAuthenticated: boolean; hasRole: (role: Role) => boolean; }
const AuthContext = createContext<AuthState>({ user: null, profile: null, role: null, department: null, gpsPolicy: "DISABLED", campAccess: false, loading: true, isAuthenticated: false, hasRole: () => false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const router = useRouter();
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!firebaseAuth) {
			const demoEmail = isDemoMode ? localStorage.getItem("surya-demo-user") ?? sessionStorage.getItem("surya-demo-user") : null;
			setUser(demoEmail ? getDemoUser(demoEmail) : null);
			setLoading(false);
			return;
		}
		return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
			if (!firebaseUser) { setUser(null); setLoading(false); return; }
			const snapshot = firestore ? await getDoc(doc(firestore, "users", firebaseUser.uid)) : null;
			const profile = snapshot?.exists() ? ({ id: firebaseUser.uid, ...snapshot.data() } as User) : null;
			const allowedRole = profile?.role && ["EMPLOYEE", "MARKETING_EXECUTIVE", "MARKETING_MANAGER", "ADMIN", "SUPER_ADMIN"].includes(profile.role);
			if (!profile || !allowedRole || profile.status !== "ACTIVE") { toast.error(!profile ? "Your account profile has not been approved/configured by administration." : !allowedRole ? "Unauthorized access." : profile.status === "PENDING" ? "Your employee account is awaiting administrator approval." : profile.status === "REJECTED" ? "Your employee access request was not approved." : profile.status === "DISABLED" || profile.status === "INACTIVE" ? "Your account has been disabled. Please contact administration." : "Your account has not been activated by administration."); await signOut(); setUser(null); setLoading(false); return; }
			setUser(profile);
			setLoading(false);
		});
	}, []);
	useEffect(() => {
		if (!isDemoMode || firebaseAuth) return;
		const syncDemoUser = () => setUser(getDemoUser(localStorage.getItem("surya-demo-user") ?? sessionStorage.getItem("surya-demo-user") ?? ""));
		syncDemoUser();
		window.addEventListener("surya-demo-auth", syncDemoUser);
		window.addEventListener("storage", syncDemoUser);
		return () => { window.removeEventListener("surya-demo-auth", syncDemoUser); window.removeEventListener("storage", syncDemoUser); };
	}, []);

	useEffect(() => {
		if (loading) return;
		if (!user && pathname !== "/" && pathname !== "/register" && !pathname.startsWith("/login") && !pathname.startsWith("/admin/login")) router.replace(pathname.startsWith("/admin") ? "/admin/login" : "/login");
		if ((user?.role === "SUPER_ADMIN" || user?.role === "ADMIN") && pathname === "/login") router.replace("/admin/dashboard");
		if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login") && user && !["SUPER_ADMIN", "ADMIN"].includes(user.role)) router.replace("/dashboard");
		if (!pathname.startsWith("/admin") && pathname !== "/" && pathname !== "/login" && ["SUPER_ADMIN", "ADMIN"].includes(user?.role ?? "")) router.replace("/admin/dashboard");
	}, [loading, pathname, router, user]);

	if (loading && !pathname.startsWith("/login")) return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f4f8fb] text-[#102a43]"><BrandLogo className="h-20 w-20 rounded-2xl bg-white p-2 shadow-sm" /><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200"><div className="h-full w-1/2 animate-pulse rounded-full bg-[#1473e6]" /></div><p className="text-sm font-semibold text-slate-500">Securely signing you in...</p></div>;
	return <AuthContext.Provider value={{ user, profile: user, role: user?.role ?? null, department: user?.department ?? null, gpsPolicy: user?.gpsPolicy ?? (user?.department === "MARKETING" ? "MANDATORY" : "DISABLED"), campAccess: user?.campAccess ?? false, loading, isAuthenticated: Boolean(user), hasRole: (role) => user?.role === role }}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
export function useRole() { const { role, department, gpsPolicy, campAccess } = useAuth(); return { role, department, gpsPolicy, campAccess, isAdmin: role === "SUPER_ADMIN" || role === "ADMIN", isManager: role === "MARKETING_MANAGER", isExecutive: role === "MARKETING_EXECUTIVE", isMarketing: department === "MARKETING" }; }
export function ProtectedRoute({ children }: { children: React.ReactNode }) { const { isAuthenticated } = useAuth(); return isAuthenticated ? children : null; }
export function RoleGuard({ roles, children }: { roles: Role[]; children: React.ReactNode }) { const { user } = useAuth(); return user && roles.includes(user.role) ? children : null; }