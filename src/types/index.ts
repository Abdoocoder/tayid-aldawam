import { Area as DbArea } from "@/lib/supabase";

export type UserRole =
    | "SUPERVISOR"
    | "GENERAL_SUPERVISOR"
    | "HEALTH_DIRECTOR"
    | "HR"
    | "INTERNAL_AUDIT"
    | "FINANCE"
    | "PAYROLL"
    | "ADMIN"
    | "MAYOR";

export type AttendanceStatus =
    | 'PENDING_SUPERVISOR'
    | 'PENDING_GS'
    | 'PENDING_HEALTH'
    | 'PENDING_HR'
    | 'PENDING_AUDIT'
    | 'PENDING_FINANCE'
    | 'PENDING_PAYROLL'
    | 'APPROVED';

export type Area = DbArea;

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    areaId?: string; // Legacy/Single Area
    areas?: Area[]; // Multi-Area Support
    isActive: boolean;
    handledNationality?: string; // ALL, أردني, مصري
}

export interface Worker {
    id: string;
    name: string;
    areaId: string;
    nationality: string;
    baseSalary: number;
    dayValue: number; // Dinars
}

export interface AttendanceRecord {
    id: string;
    workerId: string;
    month: number;
    year: number;
    normalDays: number;
    overtimeNormalDays: number;
    overtimeHolidayDays: number;
    overtimeEidDays: number;
    totalCalculatedDays: number;
    status: AttendanceStatus;
    rejectionNotes?: string;
    updatedAt: string;
}

export interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data?: Record<string, unknown> | null;
    new_data?: Record<string, unknown> | null;
    changed_by?: string;
    changed_at: string;
}
