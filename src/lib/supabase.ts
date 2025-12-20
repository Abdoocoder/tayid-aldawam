import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
        'Missing Supabase environment variables. Please check your .env.local file.\n' +
        'Required:\n' +
        '  - NEXT_PUBLIC_SUPABASE_URL\n' +
        '  - NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: false, // We're not using Supabase Auth yet
    },
    db: {
        schema: 'public',
    },
    global: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
});

// Database Types
export interface Worker {
    id: string;
    name: string;
    area_id: string;
    base_salary: number;
    day_value: number;
    created_at?: string;
    updated_at?: string;
}

export interface AttendanceRecord {
    id: string;
    worker_id: string;
    month: number;
    year: number;
    normal_days: number;
    overtime_normal_days: number;
    overtime_holiday_days: number;
    total_calculated_days: number;
    created_at?: string;
    updated_at?: string;
}

export interface User {
    id: string;
    username: string;
    name: string;
    role: 'SUPERVISOR' | 'HR' | 'FINANCE' | 'ADMIN';
    area_id?: string | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface AuditLog {
    id: string;
    table_name: string;
    record_id: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    old_data?: any;
    new_data?: any;
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

    async getByAreaId(areaId: string): Promise<Worker[]> {
        const { data, error } = await supabase
            .from('workers')
            .select('*')
            .eq('area_id', areaId)
            .order('name', { ascending: true });

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

    async getByPeriod(month: number, year: number): Promise<AttendanceRecord[]> {
        const { data, error } = await supabase
            .from('attendance_records')
            .select('*')
            .eq('month', month)
            .eq('year', year);

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
    async getAll(): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('is_active', true)
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

    async getByRole(role: 'SUPERVISOR' | 'HR' | 'FINANCE' | 'ADMIN'): Promise<User[]> {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role', role)
            .eq('is_active', true);

        if (error) throw error;
        return data || [];
    },
};

// Real-time subscriptions
export const subscribeToAttendanceChanges = (
    callback: (payload: any) => void
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
    callback: (payload: any) => void
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
