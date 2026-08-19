"use client";

import { Bell, Check, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge, Button, PageHeader } from "@/components/ui";
import { deleteRecord, listRecords, updateRecord, type FirestoreRecord } from "@/lib/firebase/repository";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { getDemoRecords } from "@/lib/demo-records";

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const demoMode = !isFirebaseConfigured && process.env.NODE_ENV !== "production";
  const { data = [], isLoading, isError } = useQuery({ queryKey: ["notifications"], queryFn: () => isFirebaseConfigured ? listRecords<FirestoreRecord>("notifications") : Promise.resolve(getDemoRecords("notifications")), enabled: isFirebaseConfigured || demoMode });
  const markRead = async (id: string) => { try { if (demoMode) queryClient.setQueryData<FirestoreRecord[]>(["notifications"], (current = []) => current.map((item) => item.id === id ? { ...item, read: true } : item)); else await updateRecord("notifications", id, { read: true }); await queryClient.invalidateQueries({ queryKey: ["notifications"] }); toast.success("Notification marked as read."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update notification."); } };
  const remove = async (id: string) => { try { if (demoMode) queryClient.setQueryData<FirestoreRecord[]>(["notifications"], (current = []) => current.filter((item) => item.id !== id)); else await deleteRecord("notifications", id); await queryClient.invalidateQueries({ queryKey: ["notifications"] }); toast.success("Notification deleted."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to delete notification."); } };
  const unread = data.filter((item) => item.read !== true).length;
  return <><PageHeader eyebrow="Workspace" title="Notifications" description={`${unread} unread notification${unread === 1 ? "" : "s"}.`} /><div className="max-w-3xl space-y-3">{isLoading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Loading notifications...</div>}{isError && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-sm text-rose-700">Unable to load notifications. Check Firebase permissions.</div>}{!isLoading && !isError && data.map((item) => <div key={item.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Bell size={18} /></div><div className="flex-1"><div className="flex justify-between gap-3"><h2 className="font-bold">{String(item.title ?? "Notification")}</h2><Badge tone={item.read ? "gray" : "blue"}>{item.read ? "Read" : "New"}</Badge></div><p className="mt-1 text-sm text-slate-500">{String(item.description ?? "")}</p><p className="mt-3 text-xs text-slate-400">{String(item.type ?? "General")}</p><div className="mt-4 flex gap-2">{!item.read && <Button variant="secondary" onClick={() => markRead(item.id)}><Check size={15} />Mark read</Button>}<Button variant="ghost" onClick={() => remove(item.id)} aria-label="Delete notification"><Trash2 size={15} />Delete</Button></div></div></div>)}{!isLoading && !isError && !data.length && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No notifications found.</div>}</div></>;
}
