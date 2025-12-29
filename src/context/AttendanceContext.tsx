"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, workersAPI, attendanceAPI, usersAPI, areasAPI, type Area, type AuditLog } from "@/lib/supabase";
export type { Area, AuditLog };
import { workerFromDb, workerToDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";
import { useAuth } from "@/context/AuthContext";

// --- Types ---

export type UserRole = "SUPERVISOR" | "GENERAL_SUPERVISOR" | "HEALTH_DIRECTOR" | "HR" | "INTERNAL_AUDIT" | "FINANCE" | "PAYROLL" | "ADMIN" | "MAYOR";

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
    status: 'PENDING_SUPERVISOR' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'PENDING_PAYROLL' | 'APPROVED';
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
    loadAttendance: (month: number, year: number, areaId?: string | string[]) => Promise<void>;
    approveAttendance: (recordId: string, nextStatus: 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'PENDING_PAYROLL' | 'APPROVED') => Promise<void>;
    rejectAttendance: (recordId: string, newStatus: 'PENDING_SUPERVISOR' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE') => Promise<void>;
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

    const loadWorkers = useCallback(async (areaId?: string | string[]) => {
        try {
            const dbWorkers = areaId && areaId !== 'ALL'
                ? await workersAPI.getByAreaId(areaId)
                : await workersAPI.getAll();
            const frontendWorkers = dbWorkers.map(workerFromDb);
            setWorkers(frontendWorkers);
        } catch (err) {
            console.error('Failed to load workers:', err);
            throw err;
        }
    }, []);

    const loadAttendance = useCallback(async (month: number, year: number, areaId?: string | string[]) => {
        try {
            const dbRecords = await attendanceAPI.getByPeriod(month, year, areaId);
            const frontendRecords = dbRecords.map(attendanceFromDb);
            setAttendanceRecords(prev => {
                // Merge records: Update existing, add new ones
                const recordMap = new Map(prev.map(r => [r.id, r]));
                frontendRecords.forEach(r => recordMap.set(r.id, r));
                return Array.from(recordMap.values());
            });
        } catch (err) {
            console.error('Failed to load attendance:', err);
            throw err;
        }
    }, []);

    const loadUsers = useCallback(async () => {
        try {
            const dbUsers = await usersAPI.getAll();
            const formattedUsers: User[] = dbUsers.map(u => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role as UserRole,
                areaId: u.area_id || undefined,
                areas: u.user_areas?.map(ua => ua.areas) || [],
                isActive: u.is_active
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
        try {
            if (!appUser?.isActive) {
                setIsLoading(false);
                return;
            }

            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();

            // Collect all assigned areas
            let areaIds: string | string[] | undefined;

            if (appUser.areaId === 'ALL') {
                areaIds = 'ALL';
            } else if (appUser.areas && appUser.areas.length > 0) {
                areaIds = appUser.areas.map(a => a.id);
            } else if (appUser.areaId) {
                areaIds = [appUser.areaId];
            } else {
                areaIds = undefined;
            }

            const promises: Promise<unknown>[] = [
                loadWorkers(areaIds),
                loadAttendance(currentMonth, currentYear, areaIds),
                loadAreas(),
            ];

            if (appUser?.role === 'ADMIN' || appUser?.role === 'HR') {
                promises.push(loadUsers());
                promises.push(loadAuditLogs());
            }

            await Promise.all(promises);
        } catch (err) {
            console.error('AttendanceContext: Failed to load data:', err);
            setError(err instanceof Error ? err.message : 'فشل تحميل البيانات');
        } finally {
            setIsLoading(false);
        }
    }, [appUser?.role, appUser?.isActive, appUser?.areaId, appUser?.areas, loadWorkers, loadAttendance, loadAreas, loadUsers, loadAuditLogs]);

    const refreshData = useCallback(async () => {
        await loadData();
    }, [loadData]);

    // --- Subscriptions ---

    useEffect(() => {
        if (!appUser || !appUser.isActive) return;

        loadData();

        const now = new Date();
        const m = now.getMonth() + 1;
        const y = now.getFullYear();

        // Collect all assigned areas for real-time refresh
        let areaIds: string | string[] | undefined;

        if (appUser.areaId === 'ALL') {
            areaIds = 'ALL';
        } else if (appUser.areas && appUser.areas.length > 0) {
            areaIds = appUser.areas.map(a => a.id);
        } else if (appUser.areaId) {
            areaIds = [appUser.areaId];
        } else {
            areaIds = undefined;
        }

        const attendanceSubscription = supabase
            .channel('attendance_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
                loadAttendance(m, y, areaIds);
            })
            .subscribe();

        const workersSubscription = supabase
            .channel('workers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
                loadWorkers(areaIds);
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

            // Smart Logic: If current user is GS, promote status immediately to skip self-approval
            let initialStatus = input.status || 'PENDING_GS';
            if (appUser?.role === 'GENERAL_SUPERVISOR' && initialStatus === 'PENDING_GS') {
                initialStatus = 'PENDING_HEALTH';
            }

            const dbRecord = attendanceToDb({
                ...input,
                status: initialStatus,
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
    }, [appUser?.role]);

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
            await loadUsers();
        } catch (err) {
            console.error('Failed to delete user:', err);
            throw err;
        }
    }, [loadUsers]);

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

    const approveAttendance = useCallback(async (recordId: string, nextStatus: 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'PENDING_PAYROLL' | 'APPROVED') => {
        try {
            const { error } = await supabase
                .from('attendance_records')
                .update({ status: nextStatus })
                .eq('id', recordId);
            if (error) throw error;

            const now = new Date();
            let areaIds: string | string[] | undefined;

            if (appUser?.areaId === 'ALL') {
                areaIds = 'ALL';
            } else if (appUser?.areas && appUser.areas.length > 0) {
                areaIds = appUser.areas.map(a => a.id);
            } else if (appUser?.areaId) {
                areaIds = [appUser.areaId];
            } else {
                areaIds = undefined;
            }

            await loadAttendance(now.getMonth() + 1, now.getFullYear(), areaIds);
        } catch (err) {
            console.error('Failed to approve attendance:', err);
            throw err;
        }
    }, [loadAttendance, appUser?.areaId, appUser?.areas]);

    const rejectAttendance = useCallback(async (recordId: string, newStatus: 'PENDING_SUPERVISOR' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE') => {
        try {
            const { error } = await supabase
                .from('attendance_records')
                .update({ status: newStatus })
                .eq('id', recordId);

            if (error) throw error;

            const now = new Date();
            let areaIds: string | string[] | undefined;

            if (appUser?.areaId === 'ALL') {
                areaIds = 'ALL';
            } else if (appUser?.areas && appUser.areas.length > 0) {
                areaIds = appUser.areas.map(a => a.id);
            } else if (appUser?.areaId) {
                areaIds = [appUser.areaId];
            } else {
                areaIds = undefined;
            }

            await loadAttendance(now.getMonth() + 1, now.getFullYear(), areaIds);
        } catch (err) {
            console.error('Failed to reject attendance:', err);
            throw err;
        }
    }, [loadAttendance, appUser?.areaId, appUser?.areas]);

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
            loadAttendance,
            approveAttendance,
            rejectAttendance
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
