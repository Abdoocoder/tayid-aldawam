import { createClient as createBrowserClient } from './supabase-browser';


// Create Supabase client
// Use the shared browser client to prevent multiple GoTrueClient instances
export const supabase = createBrowserClient();

// Database Types
export interface Area {
    id: string;
    name: string;
    created_at?: string;
    updated_at?: string;
}

export interface Worker {
    id: string;
    name: string;
    area_id: string; // This will now be a UUID referencing Areas table
    base_salary: number;
    day_value: number;
    created_at?: string;
    updated_at?: string;
    area?: Area; // Optional joined area
}

export interface AttendanceRecord {
    id: string;
    worker_id: string;
    month: number;
    year: number;
    normal_days: number;
    overtime_normal_days: number;
    overtime_holiday_days: number;
    overtime_eid_days: number;
    total_calculated_days: number;
    status: 'PENDING_SUPERVISOR' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'PENDING_PAYROLL' | 'APPROVED';
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: string;
    username: string;
    name: string;
    role: 'SUPERVISOR' | 'GENERAL_SUPERVISOR' | 'HEALTH_DIRECTOR' | 'HR' | 'INTERNAL_AUDIT' | 'FINANCE' | 'PAYROLL' | 'ADMIN' | 'MAYOR';
    area_id?: string | null; // Keep for compatibility/single selection
    areas?: Area[]; // For multi-area support
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
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

// Helper function to check connection
export async function testConnection(): Promise<boolean> {
    try {
        const { error } = await supabase.from('workers').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase connection error:', error);
            return false;
        }
        return true;
    } catch (err) {
        console.error('Supabase connection failed:', err);
        return false;
    }
}

// Workers API
export const workersAPI = {
    async getAll(): Promise<Worker[]> {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .order('area_id', { ascending: true })
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getByAreaId(areaId: string | string[]): Promise<Worker[]> {
        let query = supabase.from('workers').select('*');
        if (areaId !== 'ALL') {
            if (Array.isArray(areaId)) {
                query = query.in('area_id', areaId);
            } else {
                query = query.eq('area_id', areaId);
            }
        }
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;
        return data || [];
    },

    async getById(id: string): Promise<Worker | null> {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async create(worker: Omit<Worker, 'created_at' | 'updated_at'>): Promise<Worker> {
        const { data, error } = await supabase
            .from('workers')
            .insert([worker])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, updates: Partial<Worker>): Promise<Worker> {
        const { data, error } = await supabase
            .from('workers')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('workers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};

// Attendance Records API
export const attendanceAPI = {
    async getAll(): Promise<AttendanceRecord[]> {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .order('year', { ascending: false })
            .order('month', { ascending: false });

        if (error) throw error;
        return data || [];
    },

    async getByPeriod(month: number, year: number, areaId?: string | string[]): Promise<AttendanceRecord[]> {
        let query = supabase
            .from('attendance_records')
            .select('*')
            .eq('month', month)
            .eq('year', year);

        if (areaId && areaId !== 'ALL') {
            // Filter by workers in the specified area(s)
            let workerQuery = supabase.from('workers').select('id');
            if (Array.isArray(areaId)) {
                workerQuery = workerQuery.in('area_id', areaId);
            } else {
                workerQuery = workerQuery.eq('area_id', areaId);
            }

            const { data: workerIds } = await workerQuery;
            if (workerIds && workerIds.length > 0) {
                query = query.in('worker_id', workerIds.map(w => w.id));
            } else {
                return []; // No workers in this area
            }
        }

        const { data, error } = await query
            .order('worker_id', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getByWorkerAndPeriod(
        workerId: string,
        month: number,
        year: number
    ): Promise<AttendanceRecord | null> {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('worker_id', workerId)
            .eq('month', month)
            .eq('year', year)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async upsert(record: Omit<AttendanceRecord, 'created_at' | 'updated_at' | 'total_calculated_days'>): Promise<AttendanceRecord> {
        const { data, error } = await supabase
            .from('attendance_records')
            .upsert([record], { onConflict: 'id' })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },
};

// Users API
export const usersAPI = {
    async getAll(): Promise<(User & { user_areas: { areas: Area }[] })[]> {
        const { data, error } = await supabase
            .from('users')
            .select(`
                *,
                user_areas (
                    areas (*)
                )
            `)
            .order('role', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async getByUsername(username: string): Promise<User | null> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .eq('is_active', true)
            .single();

        if (error) throw error;
        return data;
    },

    async getByRole(role: 'SUPERVISOR' | 'GENERAL_SUPERVISOR' | 'HR' | 'FINANCE' | 'ADMIN'): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', role)
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
    },

    async getUserAreas(userId: string): Promise<Area[]> {
        const { data, error } = await supabase
            .from('user_areas')
            .select('areas (*)')
            .eq('user_id', userId);

        if (error) throw error;
        return (data as unknown as { areas: Area }[] | null)?.map(item => item.areas) || [];
    },

    async setUserAreas(userId: string, areaIds: string[]): Promise<void> {
        // First delete existing
        await supabase.from('user_areas').delete().eq('user_id', userId);
        // Then insert new
        if (areaIds.length > 0) {
            const { error } = await supabase
                .from('user_areas')
                .insert(areaIds.map(areaId => ({ user_id: userId, area_id: areaId })));
            if (error) throw error;
        }
    }
};

// Areas API
export const areasAPI = {
    async getAll(): Promise<Area[]> {
        const { data, error } = await supabase
            .from('areas')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    async create(name: string): Promise<Area> {
        const { data, error } = await supabase
            .from('areas')
            .insert([{ name }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async update(id: string, name: string): Promise<Area> {
        const { data, error } = await supabase
            .from('areas')
            .update({ name })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async delete(id: string): Promise<void> {
        const { error } = await supabase
            .from('areas')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }
};

// Real-time subscriptions
export const subscribeToAttendanceChanges = (
    callback: (payload: Record<string, unknown>) => void
) => {
    return supabase
        .channel('attendance_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'attendance_records',
            },
            callback
        )
        .subscribe();
};

export const subscribeToWorkersChanges = (
    callback: (payload: Record<string, unknown>) => void
) => {
    return supabase
        .channel('workers_changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'workers',
            },
            callback
        )
        .subscribe();
};
