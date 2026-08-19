"use client";

import { MapPin } from "lucide-react";
import { GoogleMap } from "@/components/maps/GoogleMap";
import type { FirestoreRecord } from "@/lib/firebase/repository";
import type { GPSLocation } from "@/types";

export function AdminMarketingMap({ employees, locations, selectedId }: { employees: FirestoreRecord[]; locations: FirestoreRecord[]; selectedId?: string }) {
  const latestByEmployee = new Map<string, FirestoreRecord>();
  locations.forEach((location) => {
    if (typeof location.employeeId !== "string") return;
    const previous = latestByEmployee.get(location.employeeId);
    if (!previous || String(location.timestamp ?? "") > String(previous.timestamp ?? "")) latestByEmployee.set(location.employeeId, location);
  });
  const markers: GPSLocation[] = employees.flatMap((employee) => {
    const location = latestByEmployee.get(employee.id);
    return location ? [{ latitude: Number(location.latitude), longitude: Number(location.longitude), label: `${String(employee.name)} · ${String(location.source ?? "GPS")}` }] : [];
  });
  const selectedLocation = selectedId ? latestByEmployee.get(selectedId) : undefined;
  const currentLocation = selectedLocation ? { latitude: Number(selectedLocation.latitude), longitude: Number(selectedLocation.longitude), label: "Selected employee" } : undefined;

  return <section className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Marketing team GPS</p><h2 className="mt-1 text-xl font-extrabold text-[#102a43]">Team positions</h2><p className="mt-1 text-sm text-slate-500">Latest location points from active or completed field sessions.</p></div><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><MapPin size={15} className="text-teal-600" />{markers.length}/{employees.length} employees located</div></div><div className="mt-5"><GoogleMap markers={markers} currentLocation={currentLocation} /></div></section>;
}
