import { camps, doctors, employees, expenses, hospitals, leads, mous, notifications, visits } from "@/lib/mock-data";
import type { FirestoreRecord } from "@/lib/firebase/repository";
import { isFirebaseConfigured } from "@/lib/firebase/client";

const prefix = "surya-demo-";
const seedVersion = "v3";
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const today = localDate(new Date());
const yesterday = localDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
const marketingEmployeeIds = ["EMP001", "EMP003", "EMP004", "EMP005"];

const demoEmployees: FirestoreRecord[] = employees.map((item) => ({
  id: item.id,
  uid: item.id,
  employeeId: item.id,
  name: item.name,
  email: item.email,
  department: item.id === "EMP004" ? "SALES" : item.department === "Corporate Marketing" ? "MARKETING" : "SALES",
  designation: item.designation,
  phone: item.phone,
  role: item.role,
  status: "ACTIVE",
  approved: true,
  gpsPolicy: marketingEmployeeIds.includes(item.id) ? "MANDATORY" : "DISABLED",
  target: item.target,
}));

const seededVisits: FirestoreRecord[] = Array.from({ length: 10 }, (_, index) => ({
  id: `VIS${index + 1}`,
  employeeId: index % 3 === 0 ? "EMP003" : "EMP001",
  createdBy: index % 3 === 0 ? "EMP003" : "EMP001",
  doctor: doctors[index % doctors.length].name,
  hospital: hospitals[index % hospitals.length].name,
  date: index < 6 ? today : yesterday,
  visitType: index % 2 ? "FOLLOW_UP" : "FIRST_VISIT",
  purpose: "Referral partnership and patient care update",
  notes: "Discussed referral coordination and upcoming outreach activity.",
  outcome: index % 3 === 0 ? "Follow-up scheduled" : "Positive discussion",
  status: index < 8 ? "COMPLETED" : "PLANNED",
}));

const seededLeads: FirestoreRecord[] = Array.from({ length: 12 }, (_, index) => ({
  id: `LED${index + 1}`,
  employeeId: index % 3 === 0 ? "EMP003" : "EMP001",
  createdBy: index % 3 === 0 ? "EMP003" : "EMP001",
  patient: leads[index % leads.length].patient,
  phone: `+91 98${index}12 45${index}80`,
  hospital: hospitals[index % hospitals.length].name,
  source: ["Doctor Referral", "Camp", "Website", "Hospital Desk"][index % 4],
  opdIpd: index % 2 ? "OPD" : "IPD",
  date: index < 8 ? today : yesterday,
  status: ["NEW", "CONTACTED", "FOLLOW_UP", "OPD_CONVERTED", "IPD_CONVERTED"][index % 5],
  revenue: index % 5 > 2 ? 12500 + index * 1800 : 0,
  notes: "Referral lead captured during field activity.",
}));

const seededTasks: FirestoreRecord[] = Array.from({ length: 8 }, (_, index) => ({
  id: `TASK${index + 1}`,
  title: ["Visit Metro Care Hospital", "Follow up with Dr. Rao", "Review camp leads", "Update partner directory", "Submit daily report", "Call referral desk", "Schedule society visit", "Reconcile field expenses"][index],
  description: "Complete this assigned field operation.",
  assignedTo: index % 3 === 0 ? "EMP003" : "EMP001",
  assignedBy: "ADMIN001",
  department: "MARKETING",
  priority: index < 2 ? "HIGH" : "NORMAL",
  status: index < 2 ? "COMPLETED" : index === 2 ? "IN_PROGRESS" : "TODO",
  dueDate: today,
  gpsRequired: index < 4,
}));

const seeded: Record<string, FirestoreRecord[]> = {
  users: demoEmployees,
  hospitals: hospitals.map((item) => ({ id: item.id, name: item.name, address: item.location, departments: item.departments, contactPerson: item.contact, phone: item.phone, status: item.status.toUpperCase() })),
  doctors: doctors.map((item) => ({ id: item.id, name: item.name, specialty: item.specialization, hospital: item.hospital, department: item.department, phone: item.phone, status: item.status.toUpperCase() })),
  doctorVisits: seededVisits,
  leads: seededLeads,
  camps: camps.map((item, index) => ({ id: item.id, name: item.name, location: item.location, date: index === 1 ? yesterday : today, registrations: item.registrations, leads: item.leads, status: item.status.toUpperCase(), campParticipants: [] })),
  expenses: expenses.map((item, index) => ({ id: item.id, employeeId: index % 2 ? "EMP003" : "EMP001", date: index < 2 ? today : yesterday, category: item.category, description: item.description, amount: item.amount, status: item.status.toUpperCase(), approvalStatus: item.status.toUpperCase(), ...(item.status === "Approved" ? { approvedBy: "ADMIN001", approvedAt: `${today}T10:00:00.000Z` } : {}) })),
  mou: mous.map((item) => ({ id: item.id, organization: item.organization, contactPerson: item.contact, agreementDate: item.agreementDate, expiryDate: item.expiryDate, status: item.status.toUpperCase().replaceAll(" ", "_") })),
  notifications: notifications.map((item) => ({ id: item.id, title: item.title, description: item.description, type: item.type, read: item.read })),
  tasks: seededTasks,
  targets: [{ id: "TARGET-EMP001", employeeId: "EMP001", month: 8, visitsTarget: 10, leadsTarget: 8, revenueTarget: 50000 }, { id: "TARGET-EMP003", employeeId: "EMP003", month: 8, visitsTarget: 12, leadsTarget: 10, revenueTarget: 60000 }, { id: "TARGET-EMP004", employeeId: "EMP004", month: 8, visitsTarget: 10, leadsTarget: 6, revenueTarget: 35000 }],
  attendance: [{ id: "ATT-HISTORY-001", employeeId: "EMP003", department: "MARKETING", date: yesterday, status: "CHECKED_OUT", startTime: `${yesterday}T08:15:00.000Z`, checkInTime: `${yesterday}T08:15:00.000Z`, checkOutTime: `${yesterday}T15:00:00.000Z`, workingMinutes: 405, totalWorkingHours: 6.75, totalDistanceKm: 18.4, distanceCoveredKm: 18.4, gpsEnabled: true, gpsPolicy: "MANDATORY", startLocation: { latitude: 28.6139, longitude: 77.209, accuracy: 12, timestamp: `${yesterday}T08:15:00.000Z` }, endLocation: { latitude: 28.5355, longitude: 77.391, accuracy: 10, timestamp: `${yesterday}T15:00:00.000Z` } }],
  locationHistory: [{ id: "LOC-HISTORY-001", employeeId: "EMP003", attendanceId: "ATT-HISTORY-001", latitude: 28.6139, longitude: 77.209, accuracy: 12, timestamp: `${yesterday}T08:15:00.000Z`, sequence: 0, distanceFromPreviousPoint: 0, totalDistance: 0, source: "CHECK_IN" }, { id: "LOC-HISTORY-002", employeeId: "EMP003", attendanceId: "ATT-HISTORY-001", latitude: 28.5355, longitude: 77.391, accuracy: 10, timestamp: `${yesterday}T15:00:00.000Z`, sequence: 1, distanceFromPreviousPoint: 18.4, totalDistance: 18.4, source: "CHECK_OUT" }],
  fieldVisits: [],
  employeeRequests: [{ id: "REQ-001", name: "Sanjay Gupta", email: "sanjay@surya.com", department: "MARKETING", status: "PENDING", requestedAt: `${today}T09:00:00.000Z` }],
};

function storageKey(collection: string) { return `${prefix}${collection}`; }
export function isDemoEnabled() { return process.env.NEXT_PUBLIC_DEMO_MODE === "true" && !isFirebaseConfigured && typeof window !== "undefined"; }
function canUseStorage() { return isDemoEnabled(); }
function cloneRecords(records: FirestoreRecord[]) { return records.map((record) => ({ ...record })); }

export function getDemoData(collection: string): FirestoreRecord[] {
  if (!canUseStorage()) return [];
  const versionKey = storageKey("seed-version");
  if (window.localStorage.getItem(versionKey) !== seedVersion) {
    Object.keys(seeded).forEach((seededCollection) => window.localStorage.removeItem(storageKey(seededCollection)));
    window.localStorage.setItem(versionKey, seedVersion);
  }
  const stored = window.localStorage.getItem(storageKey(collection));
  if (stored) { try { return JSON.parse(stored) as FirestoreRecord[]; } catch { window.localStorage.removeItem(storageKey(collection)); } }
  const initial = cloneRecords(seeded[collection] ?? []);
  window.localStorage.setItem(storageKey(collection), JSON.stringify(initial));
  return initial;
}

export function setDemoData(collection: string, records: FirestoreRecord[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(storageKey(collection), JSON.stringify(records));
}

export function createDemoRecord(collection: string, values: Record<string, unknown>) {
  const record = { id: `demo-${collection}-${crypto.randomUUID()}`, ...values, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as FirestoreRecord;
  setDemoData(collection, [record, ...getDemoData(collection)]);
  return record.id;
}

export function updateDemoRecord(collection: string, id: string, values: Record<string, unknown>) {
  setDemoData(collection, getDemoData(collection).map((record) => record.id === id ? { ...record, ...values, updatedAt: new Date().toISOString() } : record));
}

export function deleteDemoRecord(collection: string, id: string) {
  setDemoData(collection, getDemoData(collection).filter((record) => record.id !== id));
}

export function resetDemoData() {
  if (!canUseStorage()) return;
  Object.keys(seeded).forEach((collection) => window.localStorage.removeItem(storageKey(collection)));
  window.localStorage.removeItem(storageKey("seed-version"));
}
