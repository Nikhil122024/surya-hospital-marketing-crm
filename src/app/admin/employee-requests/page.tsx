"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Eye, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge, Button, PageHeader } from "@/components/ui";
import { createRecord, listRecords, updateRecord, type FirestoreRecord } from "@/lib/firebase/repository";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { createDemoRecord, getDemoData, updateDemoRecord } from "@/lib/demo-service";

const demo = !isFirebaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export default function EmployeeRequestsPage() {
  const client = useQueryClient();
  const [reason, setReason] = useState("");
  const [rejecting, setRejecting] = useState<FirestoreRecord | null>(null);
  const { data = [], isLoading, isError } = useQuery({ queryKey: ["employeeRequests"], queryFn: () => isFirebaseConfigured ? listRecords<FirestoreRecord>("employeeRequests") : getDemoData("employeeRequests"), enabled: isFirebaseConfigured || demo });
  const refresh = () => { void client.invalidateQueries({ queryKey: ["employeeRequests"] }); void client.invalidateQueries({ queryKey: ["admin-overview"] }); };

  const approve = async (request: FirestoreRecord) => {
    if (request.status !== "PENDING") return;
    try {
      if (demo) {
        updateDemoRecord("employeeRequests", request.id, { status: "APPROVED", reviewedAt: new Date().toISOString(), reviewedBy: "ADMIN001" });
        createDemoRecord("users", { employeeId: request.employeeId ?? request.id, name: request.name, email: request.email, department: request.department, designation: request.designation ?? "Employee", role: request.department === "MARKETING" ? "MARKETING_EXECUTIVE" : "EMPLOYEE", status: "ACTIVE", approved: true, gpsPolicy: request.department === "MARKETING" ? "MANDATORY" : "DISABLED" });
      } else {
        if (!firebaseAuth?.currentUser) throw new Error("Not authenticated");
        const token = await firebaseAuth.currentUser.getIdToken();
        const response = await fetch("/api/admin/employee-requests/approve", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ requestId: request.id, role: request.department === "MARKETING" ? "MARKETING_EXECUTIVE" : "EMPLOYEE", gpsPolicy: request.department === "MARKETING" ? "MANDATORY" : "DISABLED", campAccess: true }) });
        if (!response.ok) throw new Error("Unable to approve request.");
      }
      toast.success("Employee approved successfully");
      refresh();
    } catch { toast.error("Unable to update request. Please try again."); }
  };

  const reject = async () => {
    if (!rejecting || rejecting.status !== "PENDING") return;
    try {
      const values = { status: "REJECTED", rejectionReason: reason.trim() || "Not approved by administration.", reviewedAt: new Date().toISOString(), reviewedBy: "ADMIN001" };
      if (demo) updateDemoRecord("employeeRequests", rejecting.id, values);
      else { await updateRecord("employeeRequests", rejecting.id, values); await createRecord("auditLogs", { action: "REJECT_EMPLOYEE_REQUEST", entity: "employeeRequests", entityId: rejecting.id, metadata: { email: rejecting.email, reason } }); }
      toast.success("Employee request rejected.");
      setRejecting(null);
      setReason("");
      refresh();
    } catch { toast.error("Unable to update request. Please try again."); }
  };

  return <><PageHeader eyebrow="Administration" title="Employee Requests" description="Review and approve employee access requests before account activation." /><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-xs font-extrabold uppercase text-slate-500"><tr>{["Employee ID", "Name", "Email", "Department", "Designation", "Status", "Actions"].map((label) => <th key={label} className="px-5 py-4">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{isLoading && <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading requests...</td></tr>}{isError && <tr><td colSpan={7} className="p-8 text-center text-rose-600">Unable to load employee requests.</td></tr>}{!isLoading && !isError && data.map((request) => <tr key={request.id}><td className="px-5 py-4 font-bold">{String(request.employeeId ?? request.id)}</td><td className="px-5 py-4">{String(request.name ?? "-")}</td><td className="px-5 py-4">{String(request.email ?? "-")}</td><td className="px-5 py-4">{String(request.department ?? "-")}</td><td className="px-5 py-4">{String(request.designation ?? "-")}</td><td className="px-5 py-4"><Badge tone={request.status === "APPROVED" ? "green" : request.status === "REJECTED" ? "red" : "amber"}>{String(request.status)}</Badge></td><td className="px-5 py-4"><div className="flex gap-2">{request.status === "PENDING" && <><Button onClick={() => void approve(request)}><Check size={15} />Approve</Button><Button variant="danger" onClick={() => setRejecting(request)}><X size={15} />Reject</Button></>}<Button variant="ghost" aria-label="View request"><Eye size={15} /></Button></div></td></tr>)}</tbody></table></div></div>{rejecting && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6"><h2 className="text-xl font-extrabold text-[#102a43]">Reject employee request?</h2><textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Reason for rejection (optional)" className="mt-5 min-h-28 w-full rounded-xl border border-slate-200 p-3 text-sm" /><div className="mt-5 flex justify-end gap-3"><Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button><Button variant="danger" onClick={() => void reject()}>Reject Request</Button></div></div></div>}</>;
}