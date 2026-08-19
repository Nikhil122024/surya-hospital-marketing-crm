"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MapPin, Play, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { useAuth } from "@/components/auth-provider";
import { getLocation, type LocationPoint } from "@/hooks/use-attendance";
import { createRecord, listRecords, updateRecord, type FirestoreRecord } from "@/lib/firebase/repository";
import { getDemoRecords } from "@/lib/demo-records";
import { isFirebaseConfigured } from "@/lib/firebase/client";

export function CampModeControl() {
  const { user } = useAuth(); const queryClient = useQueryClient(); const demo = !isFirebaseConfigured && process.env.NODE_ENV !== "production";
  const [campId, setCampId] = useState(""); const [busy, setBusy] = useState(false); const [active, setActive] = useState<{ id: string; campId: string; start: LocationPoint } | null>(null);
  const { data: camps = [] } = useQuery({ queryKey: ["camp-mode-camps"], queryFn: () => isFirebaseConfigured ? listRecords<FirestoreRecord>("camps") : Promise.resolve(getDemoRecords("camps")), enabled: isFirebaseConfigured || demo });
  useEffect(() => { if (!active || !user?.id) return; const timer = window.setInterval(async () => { try { const location = await getLocation(); if (isFirebaseConfigured) await createRecord("campLocationHistory", { campId: active.campId, employeeId: user.id, department: user.department, ...location }); } catch { /* Browsers may suspend background location work. */ } }, 5 * 60 * 1000); return () => window.clearInterval(timer); }, [active, user]);
  const joinAndStart = async () => { if (!campId || !user?.id) { toast.error("Select a camp first."); return; } setBusy(true); try { const location = await getLocation(); if (isFirebaseConfigured) await createRecord("campParticipants", { campId, employeeId: user.id, department: user.department, joinedAt: new Date().toISOString(), status: "ACTIVE", gpsRequired: true }); const attendanceId = isFirebaseConfigured ? await createRecord("campAttendance", { campId, employeeId: user.id, department: user.department, checkInTime: new Date().toISOString(), gpsRequired: true, status: "CHECKED_IN", ...location }) : `demo-attendance-${campId}`; setActive({ id: attendanceId, campId, start: location }); toast.success(isFirebaseConfigured ? "Camp started with GPS tracking." : "Camp GPS started in local demo mode."); } catch (error) { toast.error(error instanceof Error ? error.message : "Location access is required to start camp mode."); } finally { setBusy(false); } };
  const endCamp = async () => { if (!active || !user?.id) return; setBusy(true); try { const location = await getLocation(); if (isFirebaseConfigured) { await updateRecord("campAttendance", active.id, { status: "COMPLETED", checkOutTime: new Date().toISOString(), endLocation: location }); await queryClient.invalidateQueries({ queryKey: ["camp-mode-camps"] }); } setActive(null); toast.success("Camp mode ended. GPS tracking stopped."); } catch (error) { toast.error(error instanceof Error ? error.message : "Unable to end camp mode."); } finally { setBusy(false); } };
  if (!user?.campAccess) return null;
  return <section className="mb-6 rounded-2xl border border-teal-100 bg-teal-50/60 p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-wider text-teal-700">Conditional GPS</p><h2 className="mt-1 text-lg font-extrabold text-[#102a43]">Camp Mode</h2><p className="mt-1 text-sm text-slate-600">GPS activates only from Start Camp to End Camp.</p></div>{active ? <Button variant="danger" disabled={busy} onClick={() => void endCamp()}><Square size={16} />{busy ? "Ending..." : "End Camp"}</Button> : <div className="flex gap-2"><select value={campId} onChange={(event) => setCampId(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Select available camp</option>{camps.map((camp) => <option key={camp.id} value={camp.id}>{String(camp.name ?? camp.id)}</option>)}</select><Button disabled={busy} onClick={() => void joinAndStart()}><Play size={16} />{busy ? "Locating..." : "Start Camp"}</Button></div>}</div>{active && <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-teal-700"><MapPin size={14} />Camp GPS active. Location collection is time-limited to this camp.</p>}</section>;
}
