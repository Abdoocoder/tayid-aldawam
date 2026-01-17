import * as XLSX from 'xlsx';
import { Worker, Area, AttendanceRecord, AuditLog } from '@/types';

/**
 * Exports data to an Excel file.
 * @param data Array of objects to export.
 * @param filename Name of the file (without extension).
 * @param sheetName Name of the sheet.
 */
export const exportToExcel = (data: Record<string, unknown>[], filename: string, sheetName: string = 'Data') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
};

/**
 * Helper to get readable nationality label from enum or Arabic string.
 */
export const getNationalityLabel = (nationality: string) => {
    switch (nationality) {
        case 'JORDANIAN':
        case 'أردني':
            return 'أردني';
        case 'EGYPTIAN':
        case 'مصري':
            return 'مصري';
        case 'SYRIAN':
        case 'سوري':
            return 'سوري';
        default:
            return nationality || 'غير محدد';
    }
};

/**
 * Professional formatting for worker data before Excel export.
 */
export const formatWorkersForExport = (workers: Worker[], areas: Area[]) => {
    return workers.map(w => ({
        'رقم العامل': w.id,
        'الاسم': w.name,
        'الجنسية': getNationalityLabel(w.nationality),
        'القطاع': areas.find(a => a.id === w.areaId)?.name || 'غير محدد',
        'الراتب الأساسي': w.baseSalary,
        'قيمة اليوم': w.dayValue,
    }));
};

/**
 * Professional formatting for attendance data before Excel export.
 */
export const formatAttendanceForExport = (records: AttendanceRecord[], workers: Worker[], areas: Area[]) => {
    return records.map(r => {
        const worker = workers.find(w => w.id === r.workerId);
        const area = areas.find(a => a.id === worker?.areaId);
        return {
            'رقم العامل': r.workerId,
            'الاسم': worker?.name || 'غير موجود',
            'القطاع': area?.name || 'غير محدد',
            'الشهر': r.month,
            'السنة': r.year,
            'أيام الدوام': r.totalCalculatedDays,
            'الحالة': r.status,
            'تاريخ التحديث': new Date(r.updatedAt).toLocaleDateString('ar-JO'),
        };
    });
};

/**
 * Professional formatting for audit logs before Excel export.
 */
export const formatAuditLogsForExport = (logs: AuditLog[]) => {
    return logs.map(l => ({
        'التوقيت': new Date(l.changed_at).toLocaleString('ar-JO'),
        'المستخدم': l.changed_by || 'نظام تلقائي',
        'العملية': l.action,
        'الجدول': l.table_name,
        'البيانات الجديدة': JSON.stringify(l.new_data),
    }));
};
