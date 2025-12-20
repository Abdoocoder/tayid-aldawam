"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { supabase, workersAPI, attendanceAPI, usersAPI } from "@/lib/supabase";
import { workerFromDb, workerToDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";
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
    addWorker: (worker: Omit<Worker, "id">) => Promise<void>;
    updateWorker: (workerId: string, updates: Partial<Worker>) => Promise<void>;
    deleteWorker: (workerId: string) => Promise<void>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
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

    // Load data from Supabase on mount and when appUser changes
    useEffect(() => {
        const fetchInitialData = async () => {
            console.log('AttendanceContext: Triggering loadData with role:', appUser?.role);
            await loadData();
        };

        fetchInitialData();

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

        const usersSubscription = supabase
            .channel('users_changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                },
                () => {
                    // Reload users when changes occur
                    if (appUser?.role === 'ADMIN' || appUser?.role === 'HR') {
                        loadUsers();
                    }
                }
            )
            .subscribe();

        // Cleanup subscriptions
        return () => {
            attendanceSubscription.unsubscribe();
            workersSubscription.unsubscribe();
            usersSubscription.unsubscribe();
        };
    }, [appUser?.id, appUser?.role]); // Re-run when user ID or role changes

    const loadData = async () => {
        setIsLoading(true);
        setError(null);

        try {
            console.log('AttendanceContext: Loading basic data (workers, attendance)...');
            const promises: Promise<any>[] = [
                loadWorkers(),
                loadAttendance(),
            ];

            if (appUser?.role === 'ADMIN' || appUser?.role === 'HR') {
                console.log('AttendanceContext: User is ADMIN or HR, loading users and logs...');
                promises.push(loadUsers());
                promises.push(loadAuditLogs());
            }

            await Promise.all(promises);
            console.log('AttendanceContext: All data loaded successfully');
        } catch (err) {
            console.error('AttendanceContext: Failed to load data:', err);
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
            console.log(`AttendanceContext: Loaded ${frontendWorkers.length} workers`);
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
            console.log('AttendanceContext: Fetching users from API...');
            const dbUsers = await usersAPI.getAll();
            console.log('AttendanceContext: Users API returned:', dbUsers.length, 'users');
            const formattedUsers: User[] = dbUsers.map(u => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role as UserRole,
                areaId: u.area_id || undefined
            }));
            setUsers(formattedUsers);
        } catch (err) {
            console.error('AttendanceContext: Failed to load users:', err);
        }
    };

    const loadAuditLogs = async () => {
        try {
            console.log('AttendanceContext: Fetching audit logs from Supabase...');
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('changed_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            console.log('AttendanceContext: Loaded', data?.length || 0, 'audit logs');
            setAuditLogs(data || []);
        } catch (err) {
            console.error('AttendanceContext: Failed to load audit logs:', err);
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

    const addWorker = async (worker: Omit<Worker, "id">) => {
        try {
            const id = Math.floor(1000 + Math.random() * 9000).toString(); // Generate simple numeric ID
            const dbWorker = workerToDb({ ...worker, id });
            await workersAPI.create(dbWorker);
            // State will be updated by real-time subscription
        } catch (err) {
            console.error('Failed to add worker:', err);
            throw err;
        }
    };

    const updateWorker = async (workerId: string, updates: Partial<Worker>) => {
        try {
            // Transform updates to snake_case if needed
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.areaId) dbUpdates.area_id = updates.areaId;
            if (updates.baseSalary !== undefined) dbUpdates.base_salary = updates.baseSalary;
            if (updates.dayValue !== undefined) dbUpdates.day_value = updates.dayValue;

            await workersAPI.update(workerId, dbUpdates);
            // State will be updated by real-time subscription
        } catch (err) {
            console.error('Failed to update worker:', err);
            throw err;
        }
    };

    const deleteWorker = async (workerId: string) => {
        try {
            await workersAPI.delete(workerId);
            // State will be updated by real-time subscription
        } catch (err) {
            console.error('Failed to delete worker:', err);
            throw err;
        }
    };

    const updateUser = async (userId: string, updates: Partial<User>) => {
        try {
            const dbUpdates: any = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId;
            if (updates.username) dbUpdates.username = updates.username;

            const { error } = await supabase
                .from('users')
                .update(dbUpdates)
                .eq('id', userId);

            if (error) throw error;
            // State will be updated by real-time subscription
        } catch (err) {
            console.error('Failed to update user:', err);
            throw err;
        }
    };

    const deleteUser = async (userId: string) => {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', userId);

            if (error) throw error;
        } catch (err) {
            console.error('Failed to delete user:', err);
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
            addWorker,
            updateWorker,
            deleteWorker,
            updateUser,
            deleteUser,
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
