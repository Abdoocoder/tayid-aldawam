import { Worker as FrontendWorker, AttendanceRecord as FrontendAttendanceRecord } from '@/types';
import { Worker as DbWorker, AttendanceRecord as DbAttendanceRecord } from '@/lib/supabase';

/**
 * Transform frontend Worker to database format
 * Converts camelCase to snake_case
 */
export function workerToDb(worker: FrontendWorker): Omit<DbWorker, 'created_at' | 'updated_at'> {
    return {
        id: worker.id,
        name: worker.name,
        area_id: worker.areaId,
        nationality: worker.nationality,
        base_salary: worker.baseSalary,
        day_value: worker.dayValue,
    };
}

/**
 * Transform database Worker to frontend format
 * Converts snake_case to camelCase
 */
export function workerFromDb(dbWorker: DbWorker): FrontendWorker {
    return {
        id: dbWorker.id,
        name: dbWorker.name,
        areaId: dbWorker.area_id,
        nationality: dbWorker.nationality || 'مصري',
        baseSalary: dbWorker.base_salary,
        dayValue: dbWorker.day_value,
    };
}

/**
 * Transform frontend AttendanceRecord to database format
 * Converts camelCase to snake_case
 */
export function attendanceToDb(
    record: FrontendAttendanceRecord
): Omit<DbAttendanceRecord, 'created_at' | 'updated_at' | 'total_calculated_days'> {
    return {
        id: record.id,
        worker_id: record.workerId,
        month: record.month,
        year: record.year,
        normal_days: record.normalDays,
        overtime_normal_days: record.overtimeNormalDays,
        overtime_holiday_days: record.overtimeHolidayDays,
        overtime_eid_days: record.overtimeEidDays,
        status: record.status || 'PENDING_GS',
        rejection_notes: record.rejectionNotes || undefined,
    };
}

/**
 * Transform database AttendanceRecord to frontend format
 * Converts snake_case to camelCase
 */
export function attendanceFromDb(dbRecord: DbAttendanceRecord): FrontendAttendanceRecord {
    return {
        id: dbRecord.id,
        workerId: dbRecord.worker_id,
        month: dbRecord.month,
        year: dbRecord.year,
        normalDays: dbRecord.normal_days,
        overtimeNormalDays: dbRecord.overtime_normal_days,
        overtimeHolidayDays: dbRecord.overtime_holiday_days,
        overtimeEidDays: dbRecord.overtime_eid_days || 0,
        totalCalculatedDays: dbRecord.total_calculated_days,
        status: dbRecord.status || 'PENDING_GS',
        rejectionNotes: dbRecord.rejection_notes,
        updatedAt: dbRecord.updated_at || new Date().toISOString(),
    };
}
