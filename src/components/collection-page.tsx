"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, MoreHorizontal, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, PageHeader } from "@/components/ui";
import { createRecord, deleteRecord, listRecords, updateRecord, type FirestoreRecord } from "@/lib/firebase/repository";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getDemoRecords } from "@/lib/demo-records";
import { useAuth } from "@/components/auth-provider";
import { formatCurrency } from "@/lib/utils";
import { createDemoRecord, deleteDemoRecord, updateDemoRecord } from "@/lib/demo-service";

type FieldType = "text" | "email" | "tel" | "date" | "number" | "textarea" | "select";
export interface CollectionField { name: string; label: string; type?: FieldType; required?: boolean; options?: string[]; }
export interface CollectionColumn { name: string; label: string; currency?: boolean; }
interface CollectionPageProps { title: string; description: string; collection: string; actionLabel: string; fields: CollectionField[]; columns: CollectionColumn[]; statusField?: string; }

function displayValue(value: unknown, currency?: boolean) {
  if (value === null || value === undefined || value === "") return "-";
  if (currency && typeof value === "number") return formatCurrency(value);
  return String(value);
}

export function CollectionPage({ title, description, collection, actionLabel, fields, columns, statusField }: CollectionPageProps) {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<FirestoreRecord | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<FirestoreRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const demoMode = !isFirebaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { data = [], isLoading, isError } = useQuery({ queryKey: [collection], queryFn: () => isFirebaseConfigured ? listRecords<FirestoreRecord>(collection) : Promise.resolve(getDemoRecords(collection)), enabled: isFirebaseConfigured || demoMode });
  const employeeScoped = ["doctorVisits", "leads", "expenses", "tasks", "dailyReports"].includes(collection) && !["ADMIN", "SUPER_ADMIN"].includes(role ?? "");
  const visibleData = employeeScoped ? data.filter((row) => row.employeeId === user?.id || row.createdBy === user?.id) : data;
  const filtered = useMemo(() => visibleData.filter((row) => columns.some((column) => String(row[column.name] ?? "").toLowerCase().includes(search.toLowerCase()))), [columns, search, visibleData]);
  const refresh = () => { void queryClient.invalidateQueries({ queryKey: [collection] }); void queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }); void queryClient.invalidateQueries({ queryKey: ["admin-"] }); };

  const save = async (formData: FormData) => {
    setSaving(true);
    try {
      const values: Record<string, unknown> = {};
      fields.forEach((field) => {
        const value = String(formData.get(field.name) ?? "").trim();
        if (field.type === "number") values[field.name] = value ? Number(value) : 0;
        else values[field.name] = value;
      });
      if (user?.id) { values.employeeId = user.id; values.createdBy = user.id; }
      if (demoMode) { if (editing) updateDemoRecord(collection, editing.id, values); else createDemoRecord(collection, values); }
      else if (editing) await updateRecord(collection, editing.id, values);
      else await createRecord(collection, values);
      const actionMessage = collection === "doctorVisits" && !editing ? "Visit added successfully" : collection === "leads" && !editing ? "Lead created successfully" : `${title} ${editing ? "updated" : "created"} successfully.`;
      toast.success(actionMessage);
      setEditing(undefined); refresh();
    } catch (error) { toast.error(error instanceof Error ? error.message : `Unable to save ${title.toLowerCase()}.`); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!deleting) return;
    try { if (demoMode) deleteDemoRecord(collection, deleting.id); else await deleteRecord(collection, deleting.id); toast.success(demoMode ? `${title} removed from local demo mode.` : `${title} deleted successfully.`); setDeleting(null); refresh(); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete this record."); }
  };

  return <><PageHeader eyebrow="Operations" title={title} description={description} action={<Button onClick={() => setEditing(null)}><Plus size={16} />{actionLabel}</Button>} />
    <div className="mb-5 flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${title.toLowerCase()}...`} className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 text-sm outline-none focus:border-blue-400" /></div><Button variant="secondary" onClick={refresh}>Refresh</Button></div>
    {isLoading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading {title.toLowerCase()}...</div>}
    {!isFirebaseConfigured && !demoMode && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">Firebase is not configured. Add the required values to `.env.local` before using {title.toLowerCase()}.</div>}
    {demoMode && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-sm text-amber-800">Explicit development demo mode is active. Records are local to this session.</div>}
    {isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">Unable to load {title.toLowerCase()}. Check Firebase permissions.</div>}
    {!isLoading && !isError && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-extrabold uppercase tracking-wider text-slate-500"><tr>{columns.map((column) => <th key={column.name} className="px-5 py-4">{column.label}</th>)}<th className="px-5 py-4">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((row) => <tr key={row.id} className="transition hover:bg-blue-50/30">{columns.map((column) => <td key={column.name} className="px-5 py-4">{column.name === statusField ? <Badge tone={String(row[column.name]).toLowerCase().includes("active") || String(row[column.name]).toLowerCase().includes("approved") || String(row[column.name]).toLowerCase().includes("completed") ? "green" : String(row[column.name]).toLowerCase().includes("reject") || String(row[column.name]).toLowerCase().includes("expired") ? "red" : "amber"}>{displayValue(row[column.name])}</Badge> : displayValue(row[column.name], column.currency)}</td>)}<td className="px-5 py-4"><div className="flex gap-1"><button onClick={() => setEditing(row)} aria-label={`Edit ${title}`} className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"><Edit3 size={16} /></button><button onClick={() => setDeleting(row)} aria-label={`Delete ${title}`} className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"><Trash2 size={16} /></button></div></td></tr>)}{filtered.length === 0 && <tr><td colSpan={columns.length + 1} className="px-5 py-12 text-center text-sm text-slate-500">No {title.toLowerCase()} found.</td></tr>}</tbody></table></div></div>}
    {editing !== undefined && <RecordModal title={editing ? `Edit ${title}` : actionLabel} fields={fields} record={editing} saving={saving} onClose={() => setEditing(undefined)} onSubmit={save} />}
    {deleting && <ConfirmModal title={`Delete ${title.toLowerCase()}?`} onCancel={() => setDeleting(null)} onConfirm={remove} />}
  </>;
}

export function RecordModal({ title, fields, record, saving, onClose, onSubmit }: { title: string; fields: CollectionField[]; record: FirestoreRecord | null; saving: boolean; onClose: () => void; onSubmit: (data: FormData) => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/40 p-4"><form action={onSubmit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-6 flex items-center justify-between"><h2 className="text-xl font-extrabold text-[#102a43]">{title}</h2><button type="button" onClick={onClose} aria-label="Close form" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="grid gap-4 sm:grid-cols-2">{fields.map((field) => <label key={field.name} className={`block text-sm font-bold text-[#102a43] ${field.type === "textarea" ? "sm:col-span-2" : ""}`}>{field.label}{field.type === "textarea" ? <textarea name={field.name} required={field.required} defaultValue={String(record?.[field.name] ?? "")} className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-sm font-normal outline-none focus:border-blue-400" /> : field.type === "select" ? <select name={field.name} required={field.required} defaultValue={String(record?.[field.name] ?? field.options?.[0] ?? "")} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-normal outline-none focus:border-blue-400">{field.options?.map((option) => <option key={option}>{option}</option>)}</select> : <input name={field.name} type={field.type ?? "text"} required={field.required} defaultValue={String(record?.[field.name] ?? "")} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-blue-400" />}</label>)}</div><div className="mt-6 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={onClose}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button></div></form></div>;
}

function ConfirmModal({ title, onCancel, onConfirm }: { title: string; onCancel: () => void; onConfirm: () => void }) { return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#102a43]/40 p-4"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><MoreHorizontal className="mb-4 text-rose-600" /><h2 className="text-xl font-extrabold text-[#102a43]">{title}</h2><p className="mt-2 text-sm text-slate-500">This action cannot be undone.</p><div className="mt-6 flex justify-end gap-3"><Button variant="secondary" onClick={onCancel}>Cancel</Button><Button variant="danger" onClick={onConfirm}><Trash2 size={16} />Delete</Button></div></div></div>; }
