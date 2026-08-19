"use client";

import { ClipboardList, DollarSign, Hospital, MapPin, Plus, Stethoscope, UserRound, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { RecordModal, type CollectionField } from "@/components/collection-page";
import { createRecord } from "@/lib/firebase/repository";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import type { FirestoreRecord } from "@/lib/firebase/repository";
import { useAuth } from "@/components/auth-provider";
import { useQueryClient } from "@tanstack/react-query";

const options = [
  { label: "Doctor visit", collection: "doctorVisits", icon: Stethoscope, fields: [{ name: "date", label: "Date", type: "date", required: true }, { name: "doctor", label: "Doctor", required: true }, { name: "hospital", label: "Hospital", required: true }, { name: "purpose", label: "Purpose", required: true }] as CollectionField[] },
  { label: "Lead", collection: "leads", icon: UserRound, fields: [{ name: "patient", label: "Patient name", required: true }, { name: "phone", label: "Phone", type: "tel", required: true }, { name: "department", label: "Department", required: true }, { name: "status", label: "Status", type: "select", options: ["NEW", "CONTACTED", "FOLLOW_UP", "APPOINTMENT", "OPD_CONVERTED", "IPD_CONVERTED", "LOST"] }] as CollectionField[] },
  { label: "Hospital", collection: "hospitals", icon: Hospital, fields: [{ name: "name", label: "Hospital name", required: true }, { name: "address", label: "Address", required: true }, { name: "contactPerson", label: "Contact person" }, { name: "phone", label: "Phone", type: "tel" }] as CollectionField[] },
  { label: "Camp", collection: "camps", icon: MapPin, fields: [{ name: "name", label: "Camp name", required: true }, { name: "location", label: "Location", required: true }, { name: "date", label: "Date", type: "date", required: true }] as CollectionField[] },
  { label: "Expense", collection: "expenses", icon: DollarSign, fields: [{ name: "date", label: "Date", type: "date", required: true }, { name: "category", label: "Category", type: "select", options: ["Fuel", "Parking", "Food", "Hotel", "Printing", "Miscellaneous"] }, { name: "amount", label: "Amount", type: "number", required: true }, { name: "description", label: "Description", required: true }] as CollectionField[] },
  { label: "Daily report", collection: "dailyReports", icon: ClipboardList, fields: [{ name: "date", label: "Date", type: "date", required: true }, { name: "totalVisits", label: "Total visits", type: "number" }, { name: "leads", label: "Leads", type: "number" }, { name: "revenue", label: "Revenue", type: "number" }, { name: "challenges", label: "Challenges", type: "textarea" }, { name: "tomorrowPlan", label: "Tomorrow plan", type: "textarea" }] as CollectionField[] },
];

export function QuickAdd() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<(typeof options)[number] | null>(null);
  const [saving, setSaving] = useState(false);
  const save = async (data: FormData) => {
    setSaving(true);
    try { const values: Record<string, unknown> = {}; selected?.fields.forEach((field) => { const value = String(data.get(field.name) ?? ""); values[field.name] = field.type === "number" ? Number(value || 0) : value; }); if (user?.id) { values.employeeId = user.id; values.createdBy = user.id; } if (isFirebaseConfigured) await createRecord(selected?.collection ?? "", values); else if (process.env.NODE_ENV !== "production") queryClient.setQueryData<FirestoreRecord[]>([selected?.collection], (current = []) => [{ ...values, id: `demo-${crypto.randomUUID()}` }, ...current]); else throw new Error("Firebase must be configured before saving CRM data."); toast.success(isFirebaseConfigured ? `${selected?.label} created successfully.` : `${selected?.label} added in local demo mode.`); setSelected(null); setOpen(false); await queryClient.invalidateQueries(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to create record."); }
    finally { setSaving(false); }
  };
  return <><Button onClick={() => setOpen(true)}><Plus size={16} />Quick add</Button>{open && !selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/40 p-4"><div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-extrabold text-[#102a43]">Quick add</h2><button onClick={() => setOpen(false)} aria-label="Close quick add"><X size={18} /></button></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{options.map((option) => { const Icon = option.icon; return <button key={option.collection} onClick={() => setSelected(option)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-slate-200 p-3 text-sm font-bold text-[#102a43] hover:border-blue-400 hover:bg-blue-50"><Icon size={20} className="text-blue-600" />{option.label}</button>; })}</div></div></div>}{selected && <RecordModal title={`Add ${selected.label}`} fields={selected.fields} record={null} saving={saving} onClose={() => { setSelected(null); setOpen(false); }} onSubmit={save} />}</>;
}
