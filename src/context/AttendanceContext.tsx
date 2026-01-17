"use client";

import React, { createContext, useContext, useCallback, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, workersAPI, attendanceAPI, usersAPI, areasAPI, type AuditLog } from "@/lib/supabase";
import { workerFromDb, workerToDb, attendanceFromDb, attendanceToDb } from "@/lib/data-transformer";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { z } from "zod";
import {
    User,
    Worker,
    AttendanceRecord,
    UserRole,
    AttendanceStatus,
    Area
} from "@/types";

// --- Validation Schemas ---
export const WorkerSchema = z.object({
    name: z.string().min(3, "الاسم يجب أن يكون 3 حروف على الأقل"),
    nationality: z.enum(["JORDANIAN", "EGYPTIAN", "SYRIAN"]),
    areaId: z.string().min(1, "يرجى اختيار القطاع"),
    dayValue: z.number().min(1, "الأجر اليومي يجب أن يكون أكبر من صفر"),
    baseSalary: z.number().optional(),
});

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
    const queryClient = useQueryClient();

    // --- Selectors ---
    const effectiveAreaIds = useMemo(() => {
        if (!appUser) return undefined;
        if (appUser.areaId === 'ALL') return 'ALL';
        if (appUser.areas && appUser.areas.length > 0) return appUser.areas.map((a: Area) => a.id);
        if (appUser.areaId) return [appUser.areaId];
        return undefined;
    }, [appUser]);

    const currentPeriod = useMemo(() => {
        const now = new Date();
        return { month: now.getMonth() + 1, year: now.getFullYear() };
    }, []);

    // --- Queries ---

    const workersQuery = useQuery({
        queryKey: ['workers', effectiveAreaIds, appUser?.handledNationality],
        queryFn: async () => {
            let dbWorkers;
            if (effectiveAreaIds && effectiveAreaIds !== 'ALL') {
                dbWorkers = await workersAPI.getByAreaId(effectiveAreaIds);
            } else {
                dbWorkers = await workersAPI.getAll();
            }
            if (appUser?.handledNationality && appUser.handledNationality !== 'ALL') {
                dbWorkers = dbWorkers.filter(w => w.nationality === appUser.handledNationality);
            }
            return dbWorkers.map(workerFromDb);
        },
        enabled: !!appUser?.isActive,
    });

    const attendanceQuery = useQuery({
        queryKey: ['attendance', currentPeriod.month, currentPeriod.year, effectiveAreaIds, appUser?.handledNationality],
        queryFn: async () => {
            const dbRecords = await attendanceAPI.getByPeriod(
                currentPeriod.month,
                currentPeriod.year,
                effectiveAreaIds,
                appUser?.handledNationality
            );
            return dbRecords.map(attendanceFromDb);
        },
        enabled: !!appUser?.isActive,
    });

    const usersQuery = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const dbUsers = await usersAPI.getAll();
            return dbUsers.map(u => ({
                id: u.id,
                username: u.username,
                name: u.name,
                role: u.role as UserRole,
                areaId: u.area_id || undefined,
                areas: (u.user_areas?.map(ua => ua.areas) || []) as Area[],
                isActive: u.is_active,
                handledNationality: u.handled_nationality || 'ALL'
            }));
        },
        enabled: !!appUser?.isActive && (appUser?.role === 'ADMIN' || appUser?.role === 'HR'),
    });

    const areasQuery = useQuery({
        queryKey: ['areas'],
        queryFn: areasAPI.getAll,
        enabled: !!appUser?.isActive,
    });

    const auditLogsQuery = useQuery({
        queryKey: ['auditLogs'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('audit_logs')
                .select('*')
                .order('changed_at', { ascending: false })
                .limit(50);
            if (error) throw error;
            return data as AuditLog[];
        },
        enabled: !!appUser?.isActive && (appUser?.role === 'ADMIN' || appUser?.role === 'HR'),
    });

    // --- Mutations ---

    const saveAttendanceMutation = useMutation({
        mutationFn: async (input: Omit<AttendanceRecord, "id" | "updatedAt" | "totalCalculatedDays">) => {
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

            return attendanceAPI.upsert(dbRecord);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            showToast("تم الحفظ بنجاح", "تم حفظ بيانات الحضور بنجاح");
        },
        onError: (err) => {
            console.error('Failed to save attendance:', err);
            showToast("فشل الحفظ", "حدث خطأ أثناء محاولة حفظ البيانات", "error");
        }
    });

    const addWorkerMutation = useMutation({
        mutationFn: (worker: Worker) => workersAPI.create(workerToDb(worker)),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            showToast("تم بنجاح", "تم إضافة العامل بنجاح");
        }
    });

    const updateWorkerMutation = useMutation({
        mutationFn: ({ id, updates }: { id: string, updates: Partial<Worker> }) => {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.areaId) dbUpdates.area_id = updates.areaId;
            if (updates.baseSalary !== undefined) dbUpdates.base_salary = updates.baseSalary;
            if (updates.dayValue !== undefined) dbUpdates.day_value = updates.dayValue;
            return workersAPI.update(id, dbUpdates);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            showToast("تم التحديث", "تم تحديث بيانات العامل");
        }
    });

    const deleteWorkerMutation = useMutation({
        mutationFn: workersAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workers'] });
            showToast("تم الحذف", "تم حذف العامل بنجاح");
        }
    });

    const updateUserMutation = useMutation({
        mutationFn: async ({ id, updates, areaIds }: { id: string, updates: Partial<User>, areaIds?: string[] }) => {
            const dbUpdates: Record<string, unknown> = {};
            if (updates.name) dbUpdates.name = updates.name;
            if (updates.role) dbUpdates.role = updates.role;
            if (updates.areaId !== undefined) dbUpdates.area_id = updates.areaId;
            if (updates.username) dbUpdates.username = updates.username;
            if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
            if (updates.handledNationality !== undefined) dbUpdates.handled_nationality = updates.handledNationality;

            if (Object.keys(dbUpdates).length > 0) {
                const { error } = await supabase.from('users').update(dbUpdates).eq('id', id);
                if (error) throw error;
            }

            if (areaIds) {
                await usersAPI.setUserAreas(id, areaIds);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showToast("تم التحديث", "تم تحديث بيانات المستخدم");
        }
    });

    const deleteUserMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            showToast("تم الحذف", "تم حذف المستخدم بنجاح");
        }
    });

    const addAreaMutation = useMutation({
        mutationFn: areasAPI.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showToast("تمت الإضافة", "تم إضافة القطاع بنجاح");
        }
    });

    const updateAreaMutation = useMutation({
        mutationFn: ({ id, name }: { id: string, name: string }) => areasAPI.update(id, name),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showToast("تم التحديث", "تم تحديث اسم القطاع");
        }
    });

    const deleteAreaMutation = useMutation({
        mutationFn: areasAPI.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['areas'] });
            showToast("تم الحذف", "تم حذف القطاع بنجاح");
        }
    });

    const approveAttendanceMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: AttendanceStatus }) => {
            const { error } = await supabase
                .from('attendance_records')
                .update({ status })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            showToast("تم الاعتماد", "تم اعتماد كشف الحضور بنجاح");
        }
    });

    const rejectAttendanceMutation = useMutation({
        mutationFn: async ({ id, status, reason }: { id: string, status: AttendanceStatus, reason?: string }) => {
            const { error } = await supabase
                .from('attendance_records')
                .update({
                    status: status,
                    rejection_notes: reason || null
                })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            showToast("تم الرفض", "تم إرجاع الكشف للمراجعة");
        }
    });

    // --- Subscriptions & Real-time Notifications ---

    useEffect(() => {
        if (!appUser?.isActive) return;

        const attendanceSubscription = supabase
            .channel('attendance_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, (payload) => {
                queryClient.invalidateQueries({ queryKey: ['attendance'] });

                // Real-time Notification Logic
                if (payload.eventType === 'UPDATE') {
                    const newStatus = payload.new.status;
                    const oldStatus = payload.old.status;

                    if (newStatus !== oldStatus) {
                        const workerId = payload.new.worker_id;
                        const worker = workersQuery.data?.find(w => w.id === workerId);
                        const workerName = worker?.name || "عامل غير معروف";

                        const statusMap: Record<string, string> = {
                            'APPROVED': 'معتمد نهائياً ✅',
                            'PENDING_SUPERVISOR': 'بانتظار المراقب 👤',
                            'PENDING_GS': 'بانتظار المراقب العام 💼',
                            'PENDING_HEALTH': 'بانتظار مدير الصحة 🏥',
                            'PENDING_HR': 'بانتظار الشؤون الإدارية 📝',
                            'PENDING_AUDIT': 'بانتظار الرقابة الداخلية 🔍',
                            'PENDING_FINANCE': 'بانتظار الشؤون المالية 💰'
                        };

                        showToast(
                            'تحديث لحظي',
                            `تم تغيير حالة كشف (${workerName}) إلى: ${statusMap[newStatus] || newStatus}`,
                            'info'
                        );
                    }
                }
            })
            .subscribe();

        const workersSubscription = supabase
            .channel('workers_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'workers' }, () => {
                queryClient.invalidateQueries({ queryKey: ['workers'] });
            })
            .subscribe();

        const usersSubscription = supabase
            .channel('users_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
                queryClient.invalidateQueries({ queryKey: ['users'] });
            })
            .subscribe();

        return () => {
            attendanceSubscription.unsubscribe();
            workersSubscription.unsubscribe();
            usersSubscription.unsubscribe();
        };
    }, [appUser?.isActive, queryClient, showToast, workersQuery.data]);

    // --- Context Exports ---

    const getWorkerAttendance = useCallback((workerId: string, month: number, year: number) => {
        return attendanceQuery.data?.find(
            (r) => r.workerId === workerId && r.month === month && r.year === year
        );
    }, [attendanceQuery.data]);

    const refreshData = useCallback(async () => {
        await queryClient.refetchQueries();
    }, [queryClient]);

    const loadAttendance = useCallback(async (month: number, year: number) => {
        await queryClient.fetchQuery({
            queryKey: ['attendance', month, year, effectiveAreaIds, appUser?.handledNationality],
            queryFn: async () => {
                const dbRecords = await attendanceAPI.getByPeriod(month, year, effectiveAreaIds, appUser?.handledNationality);
                return dbRecords.map(attendanceFromDb);
            }
        });
    }, [queryClient, effectiveAreaIds, appUser?.handledNationality]);

    return (
        <AttendanceContext.Provider value={{
            currentUser: appUser,
            workers: workersQuery.data || [],
            attendanceRecords: attendanceQuery.data || [],
            isLoading: workersQuery.isLoading || attendanceQuery.isLoading,
            error: (workersQuery.error as Error)?.message || (attendanceQuery.error as Error)?.message || null,
            users: usersQuery.data || [],
            areas: areasQuery.data || [],
            auditLogs: auditLogsQuery.data || [],
            getWorkerAttendance,
            saveAttendance: async (input) => { await saveAttendanceMutation.mutateAsync(input); },
            addWorker: async (worker) => { await addWorkerMutation.mutateAsync(worker); },
            updateWorker: async (id, updates) => { await updateWorkerMutation.mutateAsync({ id, updates }); },
            deleteWorker: async (id) => { await deleteWorkerMutation.mutateAsync(id); },
            updateUser: (id, updates, areaIds) => updateUserMutation.mutateAsync({ id, updates, areaIds }),
            deleteUser: deleteUserMutation.mutateAsync,
            addArea: async (name) => { await addAreaMutation.mutateAsync(name); },
            updateArea: async (id, name) => { await updateAreaMutation.mutateAsync({ id, name }); },
            deleteArea: async (id) => { await deleteAreaMutation.mutateAsync(id); },
            refreshData,
            loadAttendance,
            approveAttendance: (id, status) => approveAttendanceMutation.mutateAsync({ id, status }),
            rejectAttendance: (id, status, reason) => rejectAttendanceMutation.mutateAsync({ id, status, reason })
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
