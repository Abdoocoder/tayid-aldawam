"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, workersAPI, attendanceAPI } from "@/lib/supabase";
import { workerFromDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";

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

const MOCK_USERS: User[] = [
    { id: "sup1", name: "مراقب - ليلي - مالك العبابسة", role: "SUPERVISOR", areaId: "ليلي - مالك العبابسة" },
    { id: "sup_gen", name: "مراقب عام", role: "SUPERVISOR", areaId: "ALL" },
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
    isLoading: boolean;
    error: string | null;
    getWorkerAttendance: (workerId: string, month: number, year: number) => AttendanceRecord | undefined;
    saveAttendance: (record: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => Promise<void>;
    refreshData: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load data from Supabase on mount
    useEffect(() => {
        loadData();

        // Subscribe to real-time changes
        const attendanceSubscription = supabase
            .channel('attendance_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'attendance_records',
                },
                () => {
                    // Reload attendance records when changes occur
                    loadAttendance();
                }
            )
            .subscribe();

        const workersSubscription = supabase
            .channel('workers_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'workers',
                },
                () => {
                    // Reload workers when changes occur
                    loadWorkers();
                }
            )
            .subscribe();

        // Cleanup subscriptions
        return () => {
            attendanceSubscription.unsubscribe();
            workersSubscription.unsubscribe();
        };
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            await Promise.all([loadWorkers(), loadAttendance()]);
        } catch (err) {
            console.error('Failed to load data:', err);
            setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        } finally {
            setIsLoading(false);
        }
    };

    const loadWorkers = async () => {
        try {
            const dbWorkers = await workersAPI.getAll();
            const frontendWorkers = dbWorkers.map(workerFromDb);
            setWorkers(frontendWorkers);
        } catch (err) {
            console.error('Failed to load workers:', err);
            throw err;
        }
    };

    const loadAttendance = async () => {
        try {
            const dbRecords = await attendanceAPI.getAll();
            const frontendRecords = dbRecords.map(attendanceFromDb);
            setAttendanceRecords(frontendRecords);
        } catch (err) {
            console.error('Failed to load attendance:', err);
            throw err;
        }
    };

    const refreshData = async () => {
        await loadData();
    };

    const login = (role: UserRole) => {
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

    const saveAttendance = async (input: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => {
        try {
            setError(null);

            // Transform to database format
            const dbRecord = attendanceToDb({
                ...input,
                id: `${input.workerId}-${input.month}-${input.year}`,
                totalCalculatedDays: 0, // Will be calculated by database trigger
                updatedAt: new Date().toISOString(),
            });

            // Save to Supabase
            const savedRecord = await attendanceAPI.upsert(dbRecord);

            // Transform back to frontend format
            const frontendRecord = attendanceFromDb(savedRecord);

            // Update local state optimistically
            setAttendanceRecords((prev) => {
                const filtered = prev.filter((r) => r.id !== frontendRecord.id);
                return [...filtered, frontendRecord];
            });

        } catch (err) {
            console.error('Failed to save attendance:', err);
            setError(err instanceof Error ? err.message : 'فشل حفظ البيانات');
            throw err;
        }
    };

    return (
        <AttendanceContext.Provider value={{
            currentUser,
            login,
            logout,
            workers,
            attendanceRecords,
            isLoading,
            error,
            getWorkerAttendance,
            saveAttendance,
            refreshData,
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
