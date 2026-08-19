"use client";

import { CheckCircle2, MapPin, Square } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { useAttendance } from "@/hooks/use-attendance";
import { useAuth } from "@/components/auth-provider";

export function AttendanceControl() {
  const { gpsPolicy, department } = useAuth();
  const { active, busy, message, startDay, endDay, gpsStatus, lastLocation, placeName, distanceKm } = useAttendance();

  if (gpsPolicy !== "MANDATORY") return <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-center gap-3"><MapPin className="text-slate-400" /><div><h2 className="font-extrabold text-[#102a43]">GPS disabled for {department ?? "this department"}</h2><p className="mt-1 text-sm text-slate-500">Location is not collected during normal work. Join an authorized camp to activate temporary camp GPS.</p></div></div></section>;

  const run = async (action: () => Promise<void>, success: string) => {
    try { await action(); toast.success(success); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Unable to update attendance."); }
  };

  const status = !active ? "OFF" : gpsStatus === "GPS_ERROR" ? "ERROR" : gpsStatus === "GPS_SEARCHING" ? "SEARCHING" : "ACTIVE";
  return <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(16,42,67,.04)]">
    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
      <div><div className="flex items-center gap-2 text-sm font-bold text-slate-500"><span className={`h-2.5 w-2.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-300"}`} />GPS Status: {status}</div><h2 className="mt-2 text-2xl font-extrabold text-[#102a43]">{active ? "CHECKED IN" : "Ready for field work"}</h2><p className="mt-2 text-sm text-slate-500">{active ? "GPS Tracking Active" : "Location starts only after check-in and stops after checkout."}</p></div>
      {active ? <Button variant="danger" disabled={busy} onClick={() => void run(endDay, "Checked out successfully.")}><Square size={16} />{busy ? "Checking out..." : "CHECK OUT"}</Button> : <Button disabled={busy} onClick={() => void run(startDay, "Checked in successfully.")}><MapPin size={16} />{busy ? "Checking in..." : "CHECK IN"}</Button>}
    </div>
    {active && <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2 lg:grid-cols-5"><div className="sm:col-span-2 lg:col-span-5"><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current place</p><p className="mt-1 font-bold text-[#102a43]">{placeName ?? "Finding location name..."}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Latitude</p><p className="mt-1 font-bold text-[#102a43]">{lastLocation?.latitude.toFixed(6) ?? "-"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Longitude</p><p className="mt-1 font-bold text-[#102a43]">{lastLocation?.longitude.toFixed(6) ?? "-"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Accuracy</p><p className="mt-1 font-bold text-[#102a43]">{lastLocation ? `${Math.round(lastLocation.accuracy)} m` : "-"}</p></div><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Distance Travelled</p><p className="mt-1 font-bold text-[#102a43]">{distanceKm.toFixed(2)} km</p></div></div>}
    {message && <div className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700"><CheckCircle2 size={17} />{message}</div>}
  </section>;
}