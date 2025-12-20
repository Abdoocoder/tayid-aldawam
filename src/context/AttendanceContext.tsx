"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, workersAPI, attendanceAPI, usersAPI } from "@/lib/supabase";
import { workerFromDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";
import { useAuth } from "@/context/AuthContext";

// --- Types ---

export type UserRole = "SUPERVISOR" | "HR" | "FINANCE" | "ADMIN";

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    areaId?: string;
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

// --- Context ---

interface AttendanceContextType {
    currentUser: User | null;
    workers: Worker[];
    attendanceRecords: AttendanceRecord[];
    isLoading: boolean;
    error: string | null;
    users: User[];
    auditLogs: any[];
    getWorkerAttendance: (workerId: string, month: number, year: number) => AttendanceRecord | undefined;
    saveAttendance: (record: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => Promise<void>;
    refreshData: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const { appUser } = useAuth();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
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
            await Promise.all([
                loadWorkers(),
                loadAttendance(),
                appUser?.role === 'ADMIN' ? loadUsers() : Promise.resolve(),
                appUser?.role === 'ADMIN' ? loadAuditLogs() : Promise.resolve(),
            ]);
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

    const loadUsers = async () => {
        try {
            const dbUsers = await usersAPI.getAll();
            const formattedUsers: User[] = dbUsers.map(u => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role as UserRole,
                areaId: u.area_id || undefined
            }));
            setUsers(formattedUsers);
        } catch (err) {
            console.error('Failed to load users:', err);
        }
    };

    const loadAuditLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('changed_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            setAuditLogs(data || []);
        } catch (err) {
            console.error('Failed to load audit logs:', err);
        }
    };

    const refreshData = async () => {
        await loadData();
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
            currentUser: appUser,
            workers,
            attendanceRecords,
            isLoading,
            error,
            users,
            auditLogs,
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
