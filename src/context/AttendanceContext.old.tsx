"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

import initialData from "../data/initialData.json";

// --- Types ---

export type UserRole = "SUPERVISOR" | "HR" | "FINANCE";

export interface User {
    id: string;
    name: string;
    role: UserRole;
    areaId?: string; // Only for Supervisor
}

export interface Worker {
    id: string;
    name: string;
    areaId: string;
    baseSalary: number;
    dayValue: number; // Dinars
}

export interface AttendanceRecord {
    id: string;
    workerId: string;
    month: number;
    year: number;
    normalDays: number;
    overtimeNormalDays: number; // 0.5 value
    overtimeHolidayDays: number; // 1.0 value
    totalCalculatedDays: number;
    updatedAt: string;
}

// --- Mock Users ---

// Extract unique areas from real data to make meaningful supervisors?
// For now, let's keep static users but maybe add a wildcard supervisor.
const MOCK_USERS: User[] = [
    { id: "sup1", name: "مراقب - ليلي - مالك العبابسة", role: "SUPERVISOR", areaId: "ليلي - مالك العبابسة" },
    { id: "sup_gen", name: "مراقب عام", role: "SUPERVISOR", areaId: "ALL" }, // Special handling for ALL?
    { id: "sup_other", name: "مراقب - مراسل - المحافظة", role: "SUPERVISOR", areaId: "مراسل - المحافظة" },
    { id: "hr1", name: "مدير الموارد البشرية", role: "HR" },
    { id: "fin1", name: "المسؤول المالي", role: "FINANCE" },
];

// --- Context ---

interface AttendanceContextType {
    currentUser: User | null;
    login: (role: UserRole) => void;
    logout: () => void;
    workers: Worker[];
    attendanceRecords: AttendanceRecord[];
    getWorkerAttendance: (workerId: string, month: number, year: number) => AttendanceRecord | undefined;
    saveAttendance: (record: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [workers] = useState<Worker[]>(initialData.workers);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialData.attendance);

    // Hydrate from local storage? For MVP, just memory is fine, or maybe session storage.
    // Let's use simple memory for start to avoid complexity, SRS says "Preliminary DB".
    // But strictly memory wipes on refresh. I'll add simple useEffect for localStorage persistence if easy.

    useEffect(() => {
        // Attempt load from local storage to override initial if modified
        const stored = localStorage.getItem("attendance_db");
        if (stored) {
            // If local storage exists, merge? Or just replace?
            // Since we just imported FRESH data, maybe we shouldn't overwrite immediately if the user wants the file data.
            // But for a persistent app, LocalStorage usually wins.
            // Strategy: Use LocalStorage if present. User can header "Clear Data" to reset?
            // For this prototype, let's assume if LocalStorage has *different* count, maybe warn?
            // Simple: Set records from LS.
            const parsed = JSON.parse(stored);
            if (parsed.length > 0) {
                // Check if we want to merge. Simple replace for now.
                setAttendanceRecords(parsed);
            }
        }
    }, []);

    const saveToStorage = (records: AttendanceRecord[]) => {
        localStorage.setItem("attendance_db", JSON.stringify(records));
    };

    const login = (role: UserRole) => {
        // Auto-select the first user of that role for demo
        const user = MOCK_USERS.find((u) => u.role === role);
        if (user) setCurrentUser(user);
    };

    const logout = () => {
        setCurrentUser(null);
    };

    const getWorkerAttendance = (workerId: string, month: number, year: number) => {
        return attendanceRecords.find(
            (r) => r.workerId === workerId && r.month === month && r.year === year
        );
    };

    const saveAttendance = (input: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => {
        const totalCalculated =
            input.normalDays +
            (input.overtimeNormalDays * 0.5) +
            (input.overtimeHolidayDays * 1.0);

        const newRecord: AttendanceRecord = {
            ...input,
            id: `${input.workerId}-${input.month}-${input.year}`,
            totalCalculatedDays: totalCalculated,
            updatedAt: new Date().toISOString(),
        };

        setAttendanceRecords((prev) => {
            // Upsert
            const filtered = prev.filter((r) => r.id !== newRecord.id);
            const next = [...filtered, newRecord];
            saveToStorage(next);
            return next;
        });
    };

    return (
        <AttendanceContext.Provider value={{
            currentUser,
            login,
            logout,
            workers,
            attendanceRecords,
            getWorkerAttendance,
            saveAttendance
        }}>
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const context = useContext(AttendanceContext);
    if (!context) {
        throw new Error("useAttendance must be used within an AttendanceProvider");
    }
    return context;
}
