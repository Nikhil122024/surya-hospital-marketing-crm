import { NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminAuth = getAdminAuth(); const adminFirestore = getAdminFirestore();
    const caller = await adminAuth.verifyIdToken(authorization.slice(7));
    const callerProfile = (await adminFirestore.doc(`users/${caller.uid}`).get()).data();
    if (!callerProfile || !["ADMIN", "SUPER_ADMIN"].includes(String(callerProfile.role))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { requestId, role, gpsPolicy, campAccess } = await request.json() as { requestId?: string; role?: string; gpsPolicy?: string; campAccess?: boolean };
    if (!requestId) return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    const requestRef = adminFirestore.doc(`employeeRequests/${requestId}`); const requestSnapshot = await requestRef.get(); const employeeRequest = requestSnapshot.data();
    if (!employeeRequest || employeeRequest.status !== "PENDING") return NextResponse.json({ error: "Request is no longer pending" }, { status: 409 });
    const temporaryPassword = `${crypto.randomUUID()}aA1!`; const account = await adminAuth.createUser({ email: employeeRequest.email, password: temporaryPassword, displayName: employeeRequest.name });
    await adminFirestore.doc(`users/${account.uid}`).set({ employeeId: employeeRequest.employeeId, name: employeeRequest.name, email: employeeRequest.email, phone: employeeRequest.phone, department: employeeRequest.department, designation: employeeRequest.designation, managerId: employeeRequest.managerId, joiningDate: employeeRequest.joiningDate, role: role ?? "EMPLOYEE", gpsPolicy: gpsPolicy ?? (employeeRequest.department === "MARKETING" ? "MANDATORY" : "DISABLED"), campAccess: campAccess ?? false, status: "ACTIVE", approvedAt: new Date(), approvedBy: caller.uid, createdAt: new Date(), updatedAt: new Date() });
    await requestRef.update({ status: "APPROVED", reviewedAt: new Date(), reviewedBy: caller.uid, approvedAt: new Date() });
    await adminFirestore.collection("auditLogs").add({ action: "APPROVE_EMPLOYEE_REQUEST", adminId: caller.uid, requestId, targetUserId: account.uid, timestamp: new Date(), metadata: { email: employeeRequest.email } });
    return NextResponse.json({ success: true, uid: account.uid, temporaryPassword });
  } catch (error) { console.error("Employee approval failed", error); return NextResponse.json({ error: "Unable to approve employee request" }, { status: 500 }); }
}
