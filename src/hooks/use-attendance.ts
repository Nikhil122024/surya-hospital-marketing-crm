"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createRecord, listRecords, updateRecord, type FirestoreRecord } from "@/lib/firebase/repository";
import { isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/components/auth-provider";
import { createDemoRecord, getDemoData, updateDemoRecord } from "@/lib/demo-service";

export type LocationPoint = { latitude: number; longitude: number; accuracy: number; timestamp: string };
type AttendanceRecord = FirestoreRecord & { employeeId?: string; date?: string; status?: string; startTime?: string; checkInTime?: string; startLocation?: LocationPoint; checkInLocation?: LocationPoint; totalDistanceKm?: number; distanceCoveredKm?: number; workingMinutes?: number };
type GpsStatus = "GPS_OFF" | "GPS_SEARCHING" | "GPS_ON" | "GPS_ERROR";
const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
const TRACK_INTERVAL_MS = 5 * 60 * 1000;
const MAX_ACCURACY_METERS = 100;
const MAX_JUMP_KM = 50;

export function getLocation(): Promise<LocationPoint> {
  return new Promise((resolve, reject) => {
    if (!window.isSecureContext && window.location.hostname !== "localhost") { reject(new Error("Location requires HTTPS or localhost.")); return; }
    if (!navigator.geolocation) { reject(new Error("Geolocation is unavailable on this device.")); return; }
    navigator.geolocation.getCurrentPosition((position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: new Date().toISOString() }), (error) => reject(new Error(error.code === error.PERMISSION_DENIED ? "Location access is required for Marketing field operations." : "Unable to determine your location. Try again.")), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
  });
}
export function distanceInKm(first: LocationPoint, second: LocationPoint) { const radians = (value: number) => value * Math.PI / 180; const latitudeDelta = radians(second.latitude - first.latitude); const longitudeDelta = radians(second.longitude - first.longitude); const a = Math.sin(latitudeDelta / 2) ** 2 + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2; return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); }
function validPoint(previous: LocationPoint | null, next: LocationPoint) { if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) || next.accuracy > MAX_ACCURACY_METERS) return { valid: false, segment: 0 }; if (previous && previous.latitude === next.latitude && previous.longitude === next.longitude) return { valid: false, segment: 0 }; const segment = previous ? distanceInKm(previous, next) : 0; return { valid: segment <= MAX_JUMP_KM, segment }; }

export function useAttendance() {
  const { user, gpsPolicy, department } = useAuth(); const queryClient = useQueryClient();
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !isFirebaseConfigured;
  const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null); const [localActive, setLocalActive] = useState<AttendanceRecord | null>(null); const [lastLocation, setLastLocation] = useState<LocationPoint | null>(null); const [placeName, setPlaceName] = useState<string | null>(null); const [distanceKm, setDistanceKm] = useState(0); const [gpsStatus, setGpsStatus] = useState<GpsStatus>("GPS_OFF");
  const placeKeyRef = useRef<string | null>(null);
  const previousRef = useRef<LocationPoint | null>(null); const distanceRef = useRef(0); const lastWriteRef = useRef(0);
  const { data: records = [] } = useQuery({ queryKey: ["attendance", user?.id, today()], queryFn: async () => (isFirebaseConfigured ? await listRecords<AttendanceRecord>("attendance") : getDemoData("attendance") as AttendanceRecord[]).filter((record) => record.employeeId === user?.id && record.date === today()), enabled: Boolean(user?.id && (isFirebaseConfigured || demo)), refetchInterval: 30000 });
  const active = localActive ?? records.find((record) => record.status === "CHECKED_IN");

  useEffect(() => {
    if (!active || !lastLocation) { setPlaceName(null); placeKeyRef.current = null; return; }
    const key = `${lastLocation.latitude.toFixed(4)},${lastLocation.longitude.toFixed(4)}`;
    if (placeKeyRef.current === key) return;
    const controller = new AbortController();
    void fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lastLocation.latitude}&longitude=${lastLocation.longitude}&localityLanguage=en`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() as Promise<{ city?: string; locality?: string; principalSubdivision?: string; countryName?: string }> : null)
      .then((result) => { if (!result) return; const parts = [result.city ?? result.locality, result.principalSubdivision, result.countryName].filter(Boolean); placeKeyRef.current = key; setPlaceName(parts.length ? parts.join(", ") : `GPS location (${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)})`); })
      .catch(() => { if (!controller.signal.aborted) { placeKeyRef.current = key; setPlaceName(`GPS location (${lastLocation.latitude.toFixed(4)}, ${lastLocation.longitude.toFixed(4)})`); } });
    return () => controller.abort();
  }, [active, lastLocation]);

  useEffect(() => {
    if (!active) {
      previousRef.current = null;
      distanceRef.current = 0;
      setDistanceKm(0);
      setLastLocation(null);
      return;
    }
    const storedLocation = active.lastLocation ?? active.checkInLocation ?? active.startLocation ?? null;
    previousRef.current = storedLocation;
    const storedDistance = Number(active.totalDistanceKm ?? active.distanceCoveredKm ?? 0);
    distanceRef.current = Number.isFinite(storedDistance) ? storedDistance : 0;
    setDistanceKm(distanceRef.current);
    setLastLocation(storedLocation);
  }, [active]);

  useEffect(() => {
    if (!active || !user?.id || gpsPolicy !== "MANDATORY") { setGpsStatus("GPS_OFF"); return; }
    if (!navigator.geolocation) { setGpsStatus("GPS_ERROR"); return; }
    setGpsStatus("GPS_SEARCHING");
    const watchId = navigator.geolocation.watchPosition(async (position) => {
      const point = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, timestamp: new Date().toISOString() };
      const result = validPoint(previousRef.current, point); setLastLocation(point); setGpsStatus("GPS_ON");
      if (!result.valid || Date.now() - lastWriteRef.current < TRACK_INTERVAL_MS) return;
      previousRef.current = point; distanceRef.current += result.segment; setDistanceKm(Number(distanceRef.current.toFixed(2))); lastWriteRef.current = Date.now();
      if (isFirebaseConfigured) { try { await createRecord("locationHistory", { employeeId: user.id, attendanceId: active.id, department, latitude: point.latitude, longitude: point.longitude, accuracy: point.accuracy, timestamp: point.timestamp, sequence: Date.now(), distanceFromPreviousPoint: result.segment, totalDistance: distanceRef.current, source: "WORKING_HOURS" }); await updateRecord("attendance", active.id, { totalDistanceKm: Number(distanceRef.current.toFixed(2)), lastLocation: point, lastLocationAt: point.timestamp }); } catch { setGpsStatus("GPS_ERROR"); } } else if (demo) { createDemoRecord("locationHistory", { employeeId: user.id, attendanceId: active.id, department, latitude: point.latitude, longitude: point.longitude, accuracy: point.accuracy, timestamp: point.timestamp, sequence: Date.now(), distanceFromPreviousPoint: result.segment, totalDistance: distanceRef.current, source: "WORKING_HOURS" }); updateDemoRecord("attendance", active.id, { totalDistanceKm: Number(distanceRef.current.toFixed(2)), lastLocation: point, lastLocationAt: point.timestamp }); }
    }, () => setGpsStatus("GPS_ERROR"), { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 });
    return () => { navigator.geolocation.clearWatch(watchId); setGpsStatus("GPS_OFF"); };
  }, [active, department, gpsPolicy, user?.id]);

  const startDay = async () => { if (!user?.id) throw new Error("Sign in before starting your day."); if (gpsPolicy !== "MANDATORY") throw new Error("GPS is disabled for this department. Join an authorized camp to activate camp GPS."); setBusy(true); setMessage(null); try { const location = await getLocation(); const startTime = new Date().toISOString(); previousRef.current = location; lastWriteRef.current = Date.now(); distanceRef.current = 0; setDistanceKm(0); const values = { employeeId: user.id, department, gpsEnabled: true, gpsPolicy, date: today(), status: "CHECKED_IN", startTime, checkInTime: startTime, startLocation: location, checkInLocation: location, checkInAccuracy: location.accuracy, internetStatus: navigator.onLine ? "ONLINE" : "OFFLINE" }; if (isFirebaseConfigured) { const attendanceId = await createRecord("attendance", values); await createRecord("locationHistory", { employeeId: user.id, attendanceId, department, latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy, timestamp: location.timestamp, sequence: 0, distanceFromPreviousPoint: 0, totalDistance: 0, source: "CHECK_IN" }); } else if (demo) { const attendanceId = createDemoRecord("attendance", values); createDemoRecord("locationHistory", { employeeId: user.id, attendanceId, department, latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy, timestamp: location.timestamp, sequence: 0, distanceFromPreviousPoint: 0, totalDistance: 0, source: "CHECK_IN" }); setLocalActive({ id: attendanceId, ...values }); } else throw new Error("Firebase must be configured before attendance can be saved."); await queryClient.invalidateQueries({ queryKey: ["attendance", user.id, today()] }); await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }); setGpsStatus("GPS_ON"); setMessage("Field day active. GPS tracking is on."); } finally { setBusy(false); } };
  const endDay = async () => { if (!active) throw new Error("Start your day before ending it."); setBusy(true); setMessage(null); try { const location = await getLocation().catch((error) => { if (lastLocation) return lastLocation; throw error; }); const checkOutTime = new Date().toISOString(); const start = new Date(active.startTime ?? active.checkInTime ?? Date.now()); const workingMinutes = Math.max(0, Math.round((Date.now() - start.getTime()) / 60000)); const finalDistance = Number(distanceRef.current.toFixed(2)); const values = { status: "CHECKED_OUT", endTime: checkOutTime, checkOutTime, endLocation: location, checkOutLocation: location, lastLocation: location, lastLocationAt: location.timestamp, workingMinutes, totalWorkingHours: Number((workingMinutes / 60).toFixed(2)), distanceCoveredKm: finalDistance, totalDistanceKm: finalDistance }; const finalPoint = { employeeId: user?.id, attendanceId: active.id, department, latitude: location.latitude, longitude: location.longitude, accuracy: location.accuracy, timestamp: location.timestamp, sequence: Date.now(), distanceFromPreviousPoint: previousRef.current ? distanceInKm(previousRef.current, location) : 0, totalDistance: finalDistance, source: "CHECK_OUT" }; if (isFirebaseConfigured) { await updateRecord("attendance", active.id, values); await createRecord("locationHistory", finalPoint); } else if (demo) { updateDemoRecord("attendance", active.id, values); createDemoRecord("locationHistory", finalPoint); setLocalActive(null); } else throw new Error("Firebase must be configured before attendance can be saved."); setLastLocation(location); await queryClient.invalidateQueries({ queryKey: ["attendance", user?.id, today()] }); await queryClient.invalidateQueries({ queryKey: ["location-history", user?.id, active.id] }); await queryClient.invalidateQueries({ queryKey: ["dashboard-metrics"] }); setGpsStatus("GPS_OFF"); setMessage(`GPS captured. Session measured ${Math.floor(workingMinutes / 60)}h ${workingMinutes % 60}m and ${finalDistance} km.`); } finally { setBusy(false); } };
  return { active, busy, message, startDay, endDay, gpsStatus, lastLocation, placeName, distanceKm };
}
