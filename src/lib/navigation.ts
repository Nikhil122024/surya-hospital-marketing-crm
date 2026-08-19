import { Activity, BarChart3, Bell, Building2, CalendarCheck, ClipboardList, FileText, Hospital, LayoutDashboard, ListTodo, MapPin, Settings, ShieldCheck, Stethoscope, Target, WalletCards, Users, type LucideIcon } from "lucide-react";
import type { Department, Role } from "@/types";
export interface NavItem { label: string; href: string; icon: LucideIcon; roles: Role[]; departments?: Department[]; }
export const navigation: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE","EMPLOYEE"] },
  { label: "Attendance", href: "/attendance", icon: CalendarCheck, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE","EMPLOYEE"], departments: ["MARKETING"] },
  { label: "Tasks", href: "/tasks", icon: ListTodo, roles: ["MARKETING_MANAGER","MARKETING_EXECUTIVE","EMPLOYEE"], departments: ["MARKETING","HR","FINANCE","ACCOUNTS","OPERATIONS","OTHER"] },
  { label: "Doctor Visits", href: "/visits", icon: Stethoscope, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE","EMPLOYEE"], departments: ["MARKETING"] },
  { label: "Field Visits", href: "/field-visits", icon: MapPin, roles: ["MARKETING_MANAGER","MARKETING_EXECUTIVE","EMPLOYEE"], departments: ["MARKETING"] },
  { label: "Hospitals", href: "/hospitals", icon: Hospital, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING"] },
  { label: "Doctors", href: "/doctors", icon: Activity, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING"] },
  { label: "Leads", href: "/leads", icon: Users, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING"] },
  { label: "Camps", href: "/camps", icon: MapPin, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING"] },
  { label: "Employees", href: "/employees", icon: Users, roles: ["SUPER_ADMIN","MARKETING_MANAGER"], departments: ["MARKETING"] },
  { label: "Targets", href: "/targets", icon: Target, roles: ["SUPER_ADMIN","MARKETING_MANAGER"], departments: ["MARKETING"] },
  { label: "Expenses", href: "/expenses", icon: WalletCards, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING","FINANCE","ACCOUNTS"] },
  { label: "MOU Tracker", href: "/mou", icon: Building2, roles: ["SUPER_ADMIN","MARKETING_MANAGER"], departments: ["MARKETING"] },
  { label: "Daily Reports", href: "/daily-reports", icon: ClipboardList, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING"] },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["SUPER_ADMIN","MARKETING_MANAGER"], departments: ["MARKETING","HR","FINANCE","ACCOUNTS","OPERATIONS","OTHER"] },
  { label: "Employee Scorecard", href: "/scorecard", icon: ShieldCheck, roles: ["SUPER_ADMIN","MARKETING_MANAGER"], departments: ["MARKETING"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING","HR","FINANCE","ACCOUNTS","OPERATIONS","OTHER"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING","HR","FINANCE","ACCOUNTS","OPERATIONS","OTHER"] },
  { label: "Profile", href: "/profile", icon: Users, roles: ["SUPER_ADMIN","MARKETING_MANAGER","MARKETING_EXECUTIVE"], departments: ["MARKETING","HR","FINANCE","ACCOUNTS","OPERATIONS","OTHER"] },
];
export function hasPermission(role: Role, allowed: Role[]) { return allowed.includes(role); }
export function getNavigationByRole(role: Role, department?: Department | string, campAccess = false) { return navigation.filter((item) => hasPermission(role, item.roles) && (item.label === "Camps" ? campAccess || department === "MARKETING" : (!item.departments || !department || item.departments.includes(department as Department)))); }
