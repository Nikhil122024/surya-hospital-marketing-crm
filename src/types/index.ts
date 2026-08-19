export type Role = "SUPER_ADMIN" | "ADMIN" | "MARKETING_MANAGER" | "MARKETING_EXECUTIVE" | "EMPLOYEE";
export type Department = "MARKETING" | "HR" | "FINANCE" | "ACCOUNTS" | "OPERATIONS" | "ADMINISTRATION" | "OTHER";
export type GpsPolicy = "MANDATORY" | "OPTIONAL" | "DISABLED";
export type Status = "Active" | "Pending" | "Approved" | "Rejected" | "Expiring Soon" | "Expired" | "Renewed";

export interface User { id: string; uid?: string; employeeId?: string; name: string; role: Role; department: Department | string; designation?: string; managerId?: string; phone?: string; joiningDate?: string; approved?: boolean; status?: "PENDING" | "ACTIVE" | "REJECTED" | "INACTIVE" | "DISABLED" | "SUSPENDED"; gpsPolicy?: GpsPolicy; campAccess?: boolean; photoURL?: string; avatar?: string; email: string; }
export interface GPSLocation { latitude: number; longitude: number; label: string; }
export interface Employee extends Omit<User, "status"> { designation: string; phone: string; joiningDate: string; target: number; status: "Active" | "Inactive"; area: string; }
export interface Doctor { id: string; name: string; specialization: string; department: string; hospital: string; location: string; phone: string; status: "Active" | "Inactive"; priority: "High" | "Medium" | "Low"; }
export interface Hospital { id: string; name: string; location: string; departments: number; contact: string; phone: string; status: "Active" | "Inactive"; lastVisit: string; }
export interface Visit { id: string; doctor: string; hospital: string; executive: string; date: string; department: string; type: "First Visit" | "Follow-up" | "Camp"; status: "Completed" | "Scheduled"; purpose: string; }
export interface Lead { id: string; patient: string; phone: string; department: string; doctor: string; source: string; appointment: string; executive: string; status: "New" | "Contacted" | "Appointment Scheduled" | "OPD Converted" | "IPD Converted" | "Lost"; revenue: number; }
export interface Camp { id: string; name: string; location: string; date: string; registrations: number; leads: number; opd: number; ipd: number; revenue: number; status: "Upcoming" | "Completed"; }
export interface MOU { id: string; organization: string; contact: string; agreementDate: string; expiryDate: string; status: Status; }
export interface Expense { id: string; date: string; employee: string; category: string; description: string; amount: number; status: "Pending" | "Approved" | "Rejected"; }
export interface Notification { id: string; title: string; description: string; time: string; type: string; read: boolean; }
export interface DashboardStats { label: string; value: string; change: string; trend: "up" | "down"; icon: string; }
