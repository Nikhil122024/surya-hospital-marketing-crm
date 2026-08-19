import { employees, doctors, hospitals, visits, leads, camps, mous, expenses } from "@/lib/mock-data";
export const employeeService = { async getEmployees() { return employees; } };
export const doctorService = { async getDoctors() { return doctors; } };
export const hospitalService = { async getHospitals() { return hospitals; } };
export const visitService = { async getVisits() { return visits; } };
export const leadService = { async getLeads() { return leads; } };
export const campService = { async getCamps() { return camps; } };
export const mouService = { async getMOUs() { return mous; } };
export const expenseService = { async getExpenses() { return expenses; } };