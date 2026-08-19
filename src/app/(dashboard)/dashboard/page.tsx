"use client";

import { Activity, ClipboardCheck, IndianRupee, MapPin, Stethoscope, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AttendanceControl } from "@/components/attendance-control";
import { QuickAdd } from "@/components/quick-add";
import { useAuth } from "@/components/auth-provider";
import { Badge, Button, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { formatCurrency } from "@/lib/utils";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { listRecords, type FirestoreRecord } from "@/lib/firebase/repository";
import { getDemoRecords } from "@/lib/demo-records";

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const isToday = (value: unknown) => typeof value === "string" && value.slice(0, 10) === today();
const demo = !isFirebaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE === "true";
type DashboardData = { visits: FirestoreRecord[]; leads: FirestoreRecord[]; tasks: FirestoreRecord[]; attendance: FirestoreRecord[]; targets: FirestoreRecord[] };
async function read(collection: string) { return isFirebaseConfigured ? listRecords<FirestoreRecord>(collection) : getDemoRecords(collection); }
function useDashboardData(userId?: string) { return useQuery<DashboardData>({ queryKey: ["dashboard-metrics", userId, today()], enabled: Boolean(userId && (isFirebaseConfigured || demo)), queryFn: async () => { const [visits, leads, tasks, attendance, targets] = await Promise.all([read("doctorVisits"), read("leads"), read("tasks"), read("attendance"), read("targets")]); return { visits, leads, tasks, attendance, targets }; }, refetchInterval: 30000 }); }

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboardData(user?.id);
  const records = data ?? { visits: [], leads: [], tasks: [], attendance: [], targets: [] };
  const own = (record: FirestoreRecord) => record.employeeId === user?.id || record.createdBy === user?.id;
  const visits = records.visits.filter((record) => own(record) && isToday(record.date));
  const leads = records.leads.filter((record) => own(record) && (isToday(record.date) || isToday(record.createdAt)));
  const tasks = records.tasks.filter((record) => record.assignedTo === user?.id && isToday(record.dueDate));
  const attendance = records.attendance.find((record) => record.employeeId === user?.id && isToday(record.date));
  const revenue = leads.reduce((total, record) => total + Number(record.revenue ?? 0), 0);
  const completedTasks = tasks.filter((record) => record.status === "COMPLETED").length;
  const target = Number(records.targets.find((record) => record.employeeId === user?.id && Number(record.month) === new Date().getMonth() + 1)?.visitsTarget ?? 0);
  const progress = target ? Math.round(visits.length / target * 100) : 0;
  const workingMinutes = Number(attendance?.workingMinutes ?? 0);
  const workingHours = `${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m`;
  const distance = Number(attendance?.totalDistanceKm ?? attendance?.distanceCoveredKm ?? 0);
  const isMarketing = user?.department === "MARKETING" || user?.gpsPolicy === "MANDATORY";
  const greeting = new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening";
  if (!isMarketing) return <><PageHeader eyebrow={String(user?.department ?? "Employee")} title="Employee Dashboard" description={`Welcome back, ${user?.name ?? "there"}.`} /><div className="grid gap-5 md:grid-cols-3"><StatCard label="Assigned tasks" value={String(tasks.length)} detail={`${completedTasks} completed`} icon={ClipboardCheck} /><StatCard label="Working hours" value={workingHours} detail="Today&apos;s attendance" icon={Activity} tone="teal" /><StatCard label="GPS status" value="OFF" detail="GPS disabled for this department" icon={MapPin} tone="amber" /></div></>;
  return <><PageHeader eyebrow={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })} title={`${greeting}, ${user?.name.split(" ")[0] ?? "there"}`} description="Your live field activity and daily work plan." action={<div className="flex gap-2"><Button variant="secondary"><Target size={16} />Today</Button><QuickAdd /></div>} /><div className="space-y-6"><AttendanceControl /><section className="grid grid-cols-2 gap-4 xl:grid-cols-4"><StatCard label="Today&apos;s tasks" value={String(tasks.length)} detail={`${completedTasks} completed · ${tasks.length - completedTasks} pending`} icon={ClipboardCheck} /><StatCard label="Working hours" value={workingHours} detail={attendance?.status === "CHECKED_IN" ? "Session active" : "Today&apos;s attendance"} icon={Activity} tone="teal" /><StatCard label="Distance" value={`${distance.toFixed(2)} km`} detail="GPS distance" icon={MapPin} tone="amber" /><StatCard label="GPS status" value={attendance?.status === "CHECKED_IN" ? "ACTIVE" : "OFF"} detail={attendance?.status === "CHECKED_IN" ? "Tracking active" : "Check in to start"} icon={MapPin} /></section><section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl bg-[#102a43] p-6 text-white shadow-xl shadow-blue-100 sm:p-8"><div className="flex items-center gap-2 text-sm text-blue-100"><span className="h-2 w-2 rounded-full bg-teal-400" />{isLoading ? "Loading demo metrics" : "Live activity metrics"}</div><p className="mt-6 text-sm text-blue-100">Employee</p><h2 className="mt-1 text-3xl font-extrabold">{user?.name}</h2><p className="mt-2 text-sm text-blue-200">{user?.department} · {user?.designation}</p><Badge tone="green">{attendance?.status === "CHECKED_IN" ? "GPS ACTIVE" : "GPS OFF"}</Badge></div><div className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target progress</p><p className="mt-1 text-2xl font-extrabold">{progress}% complete</p></div><Target className="text-teal-500" size={24} /></div><ProgressBar value={progress} color="bg-teal-500" /><div className="mt-5 grid grid-cols-3 gap-3 text-center"><div><p className="text-xl font-extrabold">{visits.length}{target ? ` / ${target}` : ""}</p><p className="text-[11px] text-slate-400">Visits</p></div><div><p className="text-xl font-extrabold">{leads.length}</p><p className="text-[11px] text-slate-400">Leads</p></div><div><p className="text-xl font-extrabold">{formatCurrency(revenue)}</p><p className="text-[11px] text-slate-400">Revenue</p></div></div></div></section><div className="grid grid-cols-2 gap-4 xl:grid-cols-4"><StatCard label="Today&apos;s visits" value={String(visits.length)} detail="Doctor visits" icon={Stethoscope} /><StatCard label="Today&apos;s leads" value={String(leads.length)} detail="Referral leads" icon={Activity} tone="teal" /><StatCard label="Today&apos;s revenue" value={formatCurrency(revenue)} detail="Lead conversion value" icon={IndianRupee} tone="amber" /><StatCard label="Pending tasks" value={String(tasks.length - completedTasks)} detail="Assigned work" icon={ClipboardCheck} /></div></div></>;
}