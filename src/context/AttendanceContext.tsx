import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, workersAPI, attendanceAPI, usersAPI, areasAPI, type AuditLog } from "@/lib/supabase";
import { workerFromDb, workerToDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
    User,
    Worker,
    AttendanceRecord,
    UserRole,
    AttendanceStatus,
    Area
} from "@/types";

export type { Area, AuditLog };

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
    approveAttendance: (recordId: string, nextStatus: AttendanceStatus) => Promise<void>;
    rejectAttendance: (recordId: string, newStatus: AttendanceStatus, reason?: string) => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
    const { appUser } = useAuth();
    const { showToast } = useToast();
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Helpers ---

    const handleError = useCallback((msg: string, err: unknown) => {
        console.error(msg, err);
        setError(err instanceof Error ? err.message : msg);
    }, []);

    const getEffectiveAreaIds = useCallback(() => {
        if (!appUser) return undefined;
        if (appUser.areaId === 'ALL') return 'ALL';
        if (appUser.areas && appUser.areas.length > 0) return appUser.areas.map((a: Area) => a.id);
        if (appUser.areaId) return [appUser.areaId];
        return undefined;
    }, [appUser]);

    // --- Loading Functions ---

    const loadWorkers = useCallback(async (areaId?: string | string[], nationality?: string) => {
        try {
            let dbWorkers;
            if (areaId && areaId !== 'ALL') {
                dbWorkers = await workersAPI.getByAreaId(areaId);
            } else {
                dbWorkers = await workersAPI.getAll();
            }

            // Filter by nationality if scoped
            if (nationality && nationality !== 'ALL') {
                dbWorkers = dbWorkers.filter(w => w.nationality === nationality);
            }

            const frontendWorkers = dbWorkers.map(workerFromDb);
            setWorkers(frontendWorkers);
        } catch (err) {
            handleError('Failed to load workers', err);
        }
    }, [handleError]);

    const loadAttendance = useCallback(async (month: number, year: number, areaId?: string | string[], nationality?: string) => {
        try {
            const dbRecords = await attendanceAPI.getByPeriod(month, year, areaId, nationality);
            const frontendRecords = dbRecords.map(attendanceFromDb);
            setAttendanceRecords(prev => {
                // Merge records: Update existing, add new ones
                const recordMap = new Map(prev.map(r => [r.id, r]));
                frontendRecords.forEach(r => recordMap.set(r.id, r));
                return Array.from(recordMap.values());
            });
        } catch (err) {
            handleError('Failed to load attendance', err);
        }
    }, [handleError]);

    const loadUsers = useCallback(async () => {
        try {
            const dbUsers = await usersAPI.getAll();
            const formattedUsers: User[] = dbUsers.map(u => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role as UserRole,
                areaId: u.area_id || undefined,
                areas: (u.user_areas?.map(ua => ua.areas) || []) as Area[],
                isActive: u.is_active,
                handledNationality: u.handled_nationality || 'ALL'
            }));
            setUsers(formattedUsers);
        } catch (err) {
            handleError('Failed to load users', err);
        }
    }, [handleError]);

    const loadAreas = useCallback(async () => {
        try {
            const dbAreas = await areasAPI.getAll();
            setAreas(dbAreas as Area[]);
        } catch (err) {
            handleError('Failed to load areas', err);
        }
    }, [handleError]);

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
            handleError('Failed to load audit logs', err);
        }
    }, [handleError]);

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

            const areaIds = getEffectiveAreaIds();

            const promises: Promise<unknown>[] = [
                loadWorkers(areaIds, appUser.handledNationality),
                loadAttendance(currentMonth, currentYear, areaIds, appUser.handledNationality),
                loadAreas(),
            ];

            if (appUser?.role === 'ADMIN' || appUser?.role === 'HR') {
                promises.push(loadUsers());
                promises.push(loadAuditLogs());
            }

            await Promise.all(promises);
        } catch (err) {
            handleError('Failed to load initial data', err);
        } finally {
            setIsLoading(false);
        }
    }, [appUser?.role, appUser?.isActive, appUser?.handledNationality, getEffectiveAreaIds, loadWorkers, loadAttendance, loadAreas, loadUsers, loadAuditLogs, handleError]);

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

        const areaIds = getEffectiveAreaIds();

        const attendanceSubscription = supabase
            .channel('attendance_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, () => {
                loadAttendance(m, y, areaIds, appUser.handledNationality);
            })
            .subscribe();

        const workersSubscription = supabase
            .channel('workers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
                loadWorkers(areaIds, appUser.handledNationality);
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
    }, [appUser, loadData, loadAttendance, loadWorkers, loadUsers, getEffectiveAreaIds]);

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

            showToast("تم الحفظ بنجاح", "تم حفظ بيانات الحضور بنجاح");
        } catch (err) {
            handleError('Failed to save attendance', err);
            showToast("فشل الحفظ", "حدث خطأ أثناء محاولة حفظ البيانات", "error");
            throw err;
        }
    }, [appUser?.role, showToast, handleError]);

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
            if (updates.handledNationality !== undefined) dbUpdates.handled_nationality = updates.handledNationality;

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

    const approveAttendance = useCallback(async (recordId: string, nextStatus: AttendanceStatus) => {
        try {
            const { error } = await supabase
                .from('attendance_records')
                .update({ status: nextStatus })
                .eq('id', recordId);
            if (error) throw error;

            const now = new Date();
            const areaIds = getEffectiveAreaIds();

            await loadAttendance(now.getMonth() + 1, now.getFullYear(), areaIds);
            showToast("تم الاعتماد", "تم اعتماد كشف الحضور بنجاح");
        } catch (err) {
            handleError('Failed to approve attendance', err);
            showToast("فشل الاعتماد", "حدث خطأ أثناء محاولة اعتماد البيانات", "error");
            throw err;
        }
    }, [loadAttendance, getEffectiveAreaIds, handleError, showToast]);

    const rejectAttendance = useCallback(async (recordId: string, newStatus: AttendanceStatus, reason?: string) => {
        try {
            const { error } = await supabase
                .from('attendance_records')
                .update({
                    status: newStatus,
                    rejection_notes: reason || null
                })
                .eq('id', recordId);

            if (error) throw error;

            const now = new Date();
            const areaIds = getEffectiveAreaIds();

            await loadAttendance(now.getMonth() + 1, now.getFullYear(), areaIds);
            showToast("تم الرفض", "تم إرجاع الكشف للمراجعة");
        } catch (err) {
            handleError('Failed to reject attendance', err);
            showToast("فشل معالجة الطلب", "حدث خطأ أثناء محاولة رفض البيانات", "error");
            throw err;
        }
    }, [loadAttendance, getEffectiveAreaIds, handleError, showToast]);

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
