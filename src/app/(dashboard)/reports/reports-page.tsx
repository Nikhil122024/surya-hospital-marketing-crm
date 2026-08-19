"use client";

import { Download, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, PageHeader } from "@/components/ui";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listRecords, type FirestoreRecord } from "@/lib/firebase/repository";

function escapeCsv(value: unknown) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function downloadCsv(title: string, rows: FirestoreRecord[]) { if (!rows.length) { toast.error("No Firestore data is available for this report."); return; } const keys = [...new Set(rows.flatMap((row) => Object.keys(row).filter((key) => !["createdAt", "updatedAt"].includes(key))))]; const csv = [["Report", title], ["Generated", new Date().toISOString()], [], keys, ...rows.map((row) => keys.map((key) => escapeCsv(row[key])))] .map((row) => row.join(",")).join("\n"); const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); const link = document.createElement("a"); link.href = url; link.download = `${title.toLowerCase().replaceAll(" ", "-")}.csv`; link.click(); URL.revokeObjectURL(url); toast.success("CSV report downloaded."); }

export default function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["report-data"], enabled: isFirebaseConfigured, queryFn: async () => { const [visits, leads, camps] = await Promise.all([listRecords("doctorVisits"), listRecords("leads"), listRecords("camps")]); return { visits, leads, camps }; } });
  const reports = [{ title: "Daily field report", rows: data?.visits ?? [] }, { title: "Lead conversion report", rows: data?.leads ?? [] }, { title: "Camp performance report", rows: data?.camps ?? [] }];
  return <><PageHeader eyebrow="Insights" title="Reports" description="Export real Firestore activity into clean, shareable CSV reports." /><div className="grid gap-5 md:grid-cols-3">{reports.map((report) => <div key={report.title} className="rounded-2xl border border-slate-200 bg-white p-6"><FileText className="mb-5 text-blue-600" /><h2 className="font-extrabold">{report.title}</h2><p className="mt-2 text-sm text-slate-500">{isLoading ? "Loading Firestore data..." : `${report.rows.length} records available`}</p><Button className="mt-6" variant="secondary" disabled={!isFirebaseConfigured || isLoading} onClick={() => downloadCsv(report.title, report.rows)}><Download size={16} />Export CSV</Button></div>)}</div>{!isFirebaseConfigured && <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Configure Firebase to generate reports from live data.</p>}</>;
}
