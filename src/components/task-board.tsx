"use client";

import { CheckCircle2, Circle, Play, RotateCcw, XCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { where } from "firebase/firestore";
import { toast } from "sonner";
import { Badge, Button, PageHeader, ProgressBar } from "@/components/ui";
import { createRecord, listRecords, updateRecord, type FirestoreRecord } from "@/lib/firebase/repository";
import { getDemoRecords } from "@/lib/demo-records";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { getLocation } from "@/hooks/use-attendance";
import { updateDemoRecord } from "@/lib/demo-service";

const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
function taskDate(value: unknown) { return typeof value === "string" ? value.slice(0, 10) : ""; }

export function TaskBoard() {
  const { user, gpsPolicy } = useAuth();
  const client = useQueryClient();
  const [updating, setUpdating] = useState<string | null>(null);
  const demo = !isFirebaseConfigured && process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  const { data: allTasks = [], isLoading } = useQuery({ queryKey: ["tasks", user?.id], queryFn: () => isFirebaseConfigured ? listRecords<FirestoreRecord>("tasks", [where("assignedTo", "==", user?.id)]) : Promise.resolve(getDemoRecords("tasks")), enabled: Boolean(user?.id && (isFirebaseConfigured || demo)) });
  const tasks = allTasks.filter((task) => task.assignedTo === user?.id || task.createdBy === user?.id || (demo && !task.assignedTo));
  const todaysTasks = tasks.filter((task) => taskDate(task.dueDate) === today());
  const completed = todaysTasks.filter((task) => task.status === "COMPLETED").length;
  const progress = todaysTasks.length ? Math.round(completed / todaysTasks.length * 100) : 0;
  const refresh = () => client.invalidateQueries({ queryKey: ["tasks", user?.id] });
  const updateStatus = async (task: FirestoreRecord, status: string) => {
    if (updating) return;
    setUpdating(task.id);
    try {
      const values: Record<string, unknown> = { status, ...(status === "IN_PROGRESS" ? { startedAt: new Date().toISOString() } : {}), ...(status === "COMPLETED" ? { completedAt: new Date().toISOString() } : {}) };
      if (status === "IN_PROGRESS" && task.gpsRequired) { if (gpsPolicy !== "MANDATORY") throw new Error("This field task requires an authorized GPS session."); values.taskStartedLocation = await getLocation(); }
      if (demo) updateDemoRecord("tasks", task.id, values); else await updateRecord("tasks", task.id, values);
      await createRecord("auditLogs", { action: status === "COMPLETED" ? "TASK_COMPLETED" : "TASK_STARTED", entity: "tasks", entityId: task.id, metadata: { status } }).catch(() => undefined);
      toast.success(status === "COMPLETED" ? "Task completed successfully" : status === "CANCELLED" ? "Task cancelled successfully" : "Task started successfully"); refresh();
    } catch { toast.error("Unable to update task. Please try again."); } finally { setUpdating(null); }
  };
   return <><PageHeader eyebrow="Daily Work" title="Tasks" description="Complete your assigned work and keep today&apos;s progress moving." /><section className="mb-6 rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-end justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Today&apos;s Progress</p><p className="mt-1 text-3xl font-extrabold text-[#102a43]">{completed} / {todaysTasks.length} Tasks</p></div><p className="text-2xl font-extrabold text-teal-600">{progress}%</p></div><div className="mt-4"><ProgressBar value={progress} color="bg-teal-500" /></div></section>{demo && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Demo mode is active. Task changes are local until Firebase is configured.</div>}{isLoading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading tasks...</div> : <div className="space-y-3">{tasks.map((task) => <div key={task.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center"><div className="rounded-xl bg-blue-50 p-3 text-blue-600">{task.status === "COMPLETED" ? <CheckCircle2 size={20} /> : task.status === "IN_PROGRESS" ? <RotateCcw size={20} /> : task.status === "CANCELLED" ? <XCircle size={20} /> : <Circle size={20} />}</div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-extrabold text-[#102a43]">{String(task.title ?? "Task")}</h2><Badge tone={task.priority === "URGENT" || task.priority === "HIGH" ? "red" : "blue"}>{String(task.priority ?? "NORMAL")}</Badge>{task.gpsRequired && <Badge tone="green">GPS required</Badge>}</div><p className="mt-1 text-sm text-slate-500">{String(task.description ?? "No description")}</p><p className="mt-2 text-xs font-semibold text-slate-400">Due {String(task.dueDate ?? "-")}</p></div>{task.status === "TODO" && <Button disabled={updating === task.id} onClick={() => void updateStatus(task, "IN_PROGRESS")}><Play size={15} />{updating === task.id ? "Updating..." : "Start Task"}</Button>}{task.status === "IN_PROGRESS" && <><Button disabled={updating === task.id} onClick={() => void updateStatus(task, "COMPLETED")}><CheckCircle2 size={15} />{updating === task.id ? "Completing..." : "Complete Task"}</Button><Button variant="secondary" disabled={updating === task.id} onClick={() => void updateStatus(task, "CANCELLED")}><XCircle size={15} />Cancel</Button></>}{task.status === "COMPLETED" && <Badge tone="green">Completed</Badge>}{task.status === "CANCELLED" && <Badge tone="red">Cancelled</Badge>}</div>)}{!tasks.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No tasks assigned for this workspace.</div>}</div>}</>;
}
