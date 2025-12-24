"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, workersAPI, attendanceAPI, usersAPI, areasAPI, type Area, type AuditLog } from "@/lib/supabase";
export type { Area, AuditLog };
import { workerFromDb, workerToDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";
import { useAuth } from "@/context/AuthContext";

// --- Types ---

export type UserRole = "SUPERVISOR" | "GENERAL_SUPERVISOR" | "HR" | "FINANCE" | "ADMIN";

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    areaId?: string; // Legacy/Single Area
    areas?: Area[]; // Multi-Area Support
    isActive: boolean;
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
    overtimeEidDays: number; // 1.0 value
    totalCalculatedDays: number;
    status: 'PENDING_GS' | 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED';
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
    areas: Area[];
    auditLogs: AuditLog[];
    getWorkerAttendance: (workerId: string, month: number, year: number) => AttendanceRecord | undefined;
    saveAttendance: (record: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => Promise<void>;
    addWorker: (worker: Worker) => Promise<void>;
    updateWorker: (workerId: string, updates: Partial<Worker>) => Promise<void>;
    deleteWorker: (workerId: string) => Promise<void>;
    updateUser: (userId: string, updates: Partial<User>, areaIds?: string[]) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addArea: (name: string) => Promise<void>;
    updateArea: (id: string, name: string) => Promise<void>;
    deleteArea: (id: string) => Promise<void>;
    refreshData: () => Promise<void>;
    approveAttendance: (recordId: string, nextStatus: 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED') => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const { appUser } = useAuth();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Loading Functions ---

    const loadWorkers = useCallback(async () => {
        try {
            const dbWorkers = await workersAPI.getAll();
            const frontendWorkers = dbWorkers.map(workerFromDb);
            setWorkers(frontendWorkers);
            console.log(`AttendanceContext: Loaded ${frontendWorkers.length} workers`);
        } catch (err) {
            console.error('Failed to load workers:', err);
            throw err;
        }
    }, []);

    const loadAttendance = useCallback(async () => {
        try {
            const dbRecords = await attendanceAPI.getAll();
            const frontendRecords = dbRecords.map(attendanceFromDb);
            setAttendanceRecords(frontendRecords);
            console.log(`AttendanceContext: Loaded ${frontendRecords.length} attendance records`);
        } catch (err) {
            console.error('Failed to load attendance:', err);
            throw err;
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const dbUsers = await usersAPI.getAll();
            const formattedUsers: User[] = await Promise.all(dbUsers.map(async u => {
                const userAreas = await usersAPI.getUserAreas(u.id);
                return {
                    id: u.id,
                    username: u.username,
                    name: u.name,
                    role: u.role as UserRole,
                    areaId: u.area_id || undefined,
                    areas: userAreas,
                    isActive: u.is_active
                };
            }));
            setUsers(formattedUsers);
        } catch (err) {
            console.error('AttendanceContext: Failed to load users:', err);
        }
    }, []);

    const loadAreas = useCallback(async () => {
        try {
            const dbAreas = await areasAPI.getAll();
            setAreas(dbAreas);
            console.log(`AttendanceContext: Loaded ${dbAreas.length} areas`);
        } catch (err) {
            console.error('Failed to load areas:', err);
        }
    }, []);

    const loadAuditLogs = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('changed_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            setAuditLogs(data || []);
        } catch (err) {
            console.error('AttendanceContext: Failed to load audit logs:', err);
        }
    }, []);

    const loadData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        console.log(`AttendanceContext: Triggering loadData with role: ${appUser?.role}`);
        try {
            const promises: Promise<unknown>[] = [
                loadWorkers(),
                loadAttendance(),
                loadAreas(),
            ];

            if (appUser?.role === 'ADMIN' || appUser?.role === 'HR') {
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
    }, [appUser?.role, loadWorkers, loadAttendance, loadAreas, loadUsers, loadAuditLogs]);

    const refreshData = useCallback(async () => {
        await loadData();
    }, [loadData]);

    // --- Subscriptions ---

    useEffect(() => {
        if (!appUser) return;

        loadData();

        const attendanceSubscription = supabase
            .channel('attendance_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
                loadAttendance();
            })
            .subscribe();

        const workersSubscription = supabase
            .channel('workers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
                loadWorkers();
            })
            .subscribe();

        const usersSubscription = supabase
            .channel('users_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                if (appUser.role === 'ADMIN' || appUser.role === 'HR') {
                    loadUsers();
                }
            })
            .subscribe();

        return () => {
            attendanceSubscription.unsubscribe();
            workersSubscription.unsubscribe();
            usersSubscription.unsubscribe();
        };
    }, [appUser, loadData, loadAttendance, loadWorkers, loadUsers]);

    // --- Actions ---

    const getWorkerAttendance = useCallback((workerId: string, month: number, year: number) => {
        return attendanceRecords.find(
            (r) => r.workerId === workerId && r.month === month && r.year === year
        );
    }, [attendanceRecords]);

    const saveAttendance = useCallback(async (input: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => {
        try {
            setError(null);
            const dbRecord = attendanceToDb({
                ...input,
                id: `${input.workerId}-${input.month}-${input.year}`,
                totalCalculatedDays: 0,
                updatedAt: new Date().toISOString(),
            });

            const savedRecord = await attendanceAPI.upsert(dbRecord);
            const frontendRecord = attendanceFromDb(savedRecord);

            setAttendanceRecords((prev) => {
                const filtered = prev.filter((r) => r.id !== frontendRecord.id);
                return [...filtered, frontendRecord];
            });
        } catch (err) {
            console.error('Failed to save attendance:', err);
            setError(err instanceof Error ? err.message : 'فشل حفظ البيانات');
            throw err;
        }
    }, []);

    const addWorker = useCallback(async (worker: Worker) => {
        try {
            const dbWorker = workerToDb(worker);
            await workersAPI.create(dbWorker);
        } catch (err) {
            console.error('Failed to add worker:', err);
            throw err;
        }
    }, []);

    const updateWorker = useCallback(async (workerId: string, updates: Partial<Worker>) => {
        try {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.areaId) dbUpdates.area_id = updates.areaId;
            if (updates.baseSalary !== undefined) dbUpdates.base_salary = updates.baseSalary;
            if (updates.dayValue !== undefined) dbUpdates.day_value = updates.dayValue;

            await workersAPI.update(workerId, dbUpdates);
        } catch (err) {
            console.error('Failed to update worker:', err);
            throw err;
        }
    }, []);

    const deleteWorker = useCallback(async (workerId: string) => {
        try {
            await workersAPI.delete(workerId);
        } catch (err) {
            console.error('Failed to delete worker:', err);
            throw err;
        }
    }, []);

    const updateUser = useCallback(async (userId: string, updates: Partial<User>, areaIds?: string[]) => {
        try {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId;
            if (updates.username) dbUpdates.username = updates.username;
            if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase.from('users').update(dbUpdates).eq('id', userId);
                if (error) throw error;
            }

            if (areaIds) {
                await usersAPI.setUserAreas(userId, areaIds);
            }
            await loadUsers();
        } catch (err) {
            console.error('Failed to update user:', err);
            throw err;
        }
    }, [loadUsers]);

    const deleteUser = useCallback(async (userId: string) => {
        try {
            const { error } = await supabase.from('users').delete().eq('id', userId);
            if (error) throw error;
        } catch (err) {
            console.error('Failed to delete user:', err);
            throw err;
        }
    }, []);

    const addArea = useCallback(async (name: string) => {
        try {
            await areasAPI.create(name);
            await loadAreas();
        } catch (err) {
            console.error('Failed to add area:', err);
            throw err;
        }
    }, [loadAreas]);

    const updateArea = useCallback(async (id: string, name: string) => {
        try {
            await areasAPI.update(id, name);
            await loadAreas();
        } catch (err) {
            console.error('Failed to update area:', err);
            throw err;
        }
    }, [loadAreas]);

    const deleteArea = useCallback(async (id: string) => {
        try {
            await areasAPI.delete(id);
            await loadAreas();
        } catch (err) {
            console.error('Failed to delete area:', err);
            throw err;
        }
    }, [loadAreas]);

    const approveAttendance = useCallback(async (recordId: string, nextStatus: 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED') => {
        try {
            const { error } = await supabase
                .from('attendance_records')
                .update({ status: nextStatus })
                .eq('id', recordId);
            if (error) throw error;
            await loadAttendance();
        } catch (err) {
            console.error('Failed to approve attendance:', err);
            throw err;
        }
    }, [loadAttendance]);

    return (
        <AttendanceContext.Provider value={{
            currentUser: appUser,
            workers,
            attendanceRecords,
            isLoading,
            error,
            users,
            areas,
            auditLogs,
            getWorkerAttendance,
            saveAttendance,
            addWorker,
            updateWorker,
            deleteWorker,
            updateUser,
            deleteUser,
            addArea,
            updateArea,
            deleteArea,
            refreshData,
            approveAttendance
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
