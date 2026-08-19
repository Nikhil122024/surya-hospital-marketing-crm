"use client";

import { useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, PageHeader } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getLocation, useAttendance } from "@/hooks/use-attendance";
import { createRecord, listRecords, type FirestoreRecord } from "@/lib/firebase/repository";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { createDemoRecord, getDemoData } from "@/lib/demo-service";

const visitTypes = ["Society Visit", "School Visit", "College Visit", "Bank Visit", "Market Visit", "Hospital Visit", "Corporate Visit", "Other"];
const statuses = ["Follow-up Needed", "MOU Signed", "Camp Confirmed", "Rejected", "Completed", "Other"];

export default function FieldVisitsPage() {
  const { user, department } = useAuth();
  const { active } = useAttendance();
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !isFirebaseConfigured;
  const { data: visits = [] } = useQuery({ queryKey: ["fieldVisits", user?.id], queryFn: () => (isFirebaseConfigured ? listRecords<FirestoreRecord>("fieldVisits") : Promise.resolve(getDemoData("fieldVisits"))).then((records) => records.filter((record) => record.employeeId === user?.id)), enabled: Boolean(user?.id && (isFirebaseConfigured || demo)) });

  const save = async (form: HTMLFormElement) => {
    if (!user?.id) return;
    if (!active) { toast.error("Check in before saving a field visit."); return; }
    setSaving(true);
    try {
      const location = await getLocation();
      const data = new FormData(form);
      const values = {
        employeeId: user.id,
        employeeName: user.name,
        department,
        date: String(data.get("date")),
        visitType: String(data.get("visitType")),
        organisation: String(data.get("organisation")),
        area: String(data.get("area")),
        contactPerson: String(data.get("contactPerson")),
        designation: String(data.get("designation")),
        phone: String(data.get("phone")),
        email: String(data.get("email")),
        status: String(data.get("status")),
        campType: String(data.get("campType")),
        campBudget: Number(data.get("campBudget") || 0),
        followUpDate: String(data.get("followUpDate") || ""),
        remarks: String(data.get("remarks") || ""),
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        timestamp: location.timestamp,
        attendanceId: active.id,
      };
      if (isFirebaseConfigured) await createRecord("fieldVisits", values); else if (demo) createDemoRecord("fieldVisits", values); else throw new Error("Firebase must be configured before saving field visits.");
      await client.invalidateQueries({ queryKey: ["fieldVisits", user.id] });
      toast.success("Field visit saved with current GPS location.");
      setOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save field visit.");
    } finally { setSaving(false); }
  };

  return <>
    <PageHeader eyebrow="Field Work" title="Field Visits" description="Log outreach visits from your active GPS session." action={<Button onClick={() => setOpen(true)} disabled={!active}><Plus size={16} />Add field visit</Button>} />
    {!active && <div className="mb-5 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800"><MapPin size={18} />Check in to activate GPS before adding a field visit.</div>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500"><tr><th className="px-5 py-4">Date</th><th className="px-5 py-4">Organisation</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Follow-up</th></tr></thead><tbody className="divide-y divide-slate-100">{visits.map((visit) => <tr key={visit.id}><td className="px-5 py-4">{String(visit.date ?? "-")}</td><td className="px-5 py-4 font-bold text-[#102a43]">{String(visit.organisation ?? "-")}</td><td className="px-5 py-4">{String(visit.visitType ?? "-")}</td><td className="px-5 py-4">{String(visit.status ?? "-")}</td><td className="px-5 py-4">{String(visit.followUpDate ?? "-")}</td></tr>)}{visits.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-slate-500">No field visits recorded yet.</td></tr>}</tbody></table></div></div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/40 p-4"><form onSubmit={(event) => { event.preventDefault(); void save(event.currentTarget); }} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><h2 className="text-xl font-extrabold text-[#102a43]">Add field visit</h2><p className="mt-1 text-sm text-slate-500">Your identity and GPS coordinates are attached automatically.</p><div className="mt-6 grid gap-4 sm:grid-cols-2">{[["date", "Date", "date"], ["organisation", "Organisation / Place", "text"], ["area", "Area / Sector", "text"], ["contactPerson", "Contact Person", "text"], ["designation", "Designation", "text"], ["phone", "Phone", "tel"], ["email", "Email", "email"], ["followUpDate", "Follow-up Date", "date"], ["campType", "Camp Type", "text"], ["campBudget", "Camp Budget", "number"]].map(([name, label, type]) => <label key={name} className="text-sm font-bold text-[#102a43]">{label}<input name={name} type={type} required={name === "date" || name === "organisation"} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-400" /></label>)}<label className="text-sm font-bold text-[#102a43]">Visit Type<select name="visitType" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal">{visitTypes.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-bold text-[#102a43]">Status<select name="status" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal">{statuses.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm font-bold text-[#102a43] sm:col-span-2">Remarks / Next Action<textarea name="remarks" className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-400" /></label></div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save visit"}</Button></div></form></div>}
  </>;
}
