"use client";

import React, { useState } from "react";
import { Search, Printer, Download, CheckCircle, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { MonthYearPicker } from "../../ui/month-year-picker";
import { Worker, Area, AttendanceRecord } from "@/context/AttendanceContext";

interface AttendanceReportsProps {
    workers: Worker[];
    areas: Area[];
    month: number;
    year: number;
    reportSearchTerm: string;
    reportAreaFilter: string;
    reportStatusFilter: string;
    getWorkerAttendance: (workerId: string, month: number, year: number) => AttendanceRecord | undefined;
    approveAttendance: (recordId: string, nextStatus: 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'APPROVED') => Promise<void>;
    onReject?: (recordId: string) => Promise<void>;
    onMonthChange: (m: number, y: number) => void;
    onSearchChange: (value: string) => void;
    onAreaFilterChange: (value: string) => void;
    onStatusFilterChange: (value: 'ALL' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'APPROVED') => void;
    onExportCSV: () => void;
    onBulkApprove?: () => void;
}

export const AttendanceReports = React.memo(function AttendanceReports({
    workers,
    areas,
    month,
    year,
    reportSearchTerm,
    reportAreaFilter,
    reportStatusFilter,
    getWorkerAttendance,
    approveAttendance,
    onReject,
    onMonthChange,
    onSearchChange,
    onAreaFilterChange,
    onStatusFilterChange,
    onExportCSV,
    onBulkApprove
}: AttendanceReportsProps) {
    // ... existing implementation remains pure ...
    // (Actual file content follows)

    const filteredWorkers = workers.filter(w => {
        const record = getWorkerAttendance(w.id, month, year);
        const areaName = areas.find(a => a.id === w.areaId)?.name || "";
        const matchesSearch =
            w.name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
            w.id.includes(reportSearchTerm) ||
            areaName.toLowerCase().includes(reportSearchTerm.toLowerCase());
        const matchesArea = reportAreaFilter === 'ALL' || w.areaId === reportAreaFilter;

        const recordStatus = record?.status || 'PENDING_GS';
        const matchesStatus = reportStatusFilter === 'ALL' || recordStatus === reportStatusFilter;

        return matchesSearch && matchesArea && matchesStatus;
    });

    // Stable print metadata - generated on mount to fix purity lint errors
    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `HR-AUDIT-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

    const pendingHRCount = filteredWorkers.reduce((count, w) => {
        const record = getWorkerAttendance(w.id, month, year);
        return (record && record.status === 'PENDING_HR') ? count + 1 : count;
    }, 0);

    return (
        <>
            <div className="space-y-6 print:hidden">
                {/* Filter Bar - Floating Glassmorph */}
                <div className="flex flex-col md:flex-row gap-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                        <Input
                            placeholder="بحث باسم العامل أو القطاع..."
                            className="pr-12 h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-purple-500 rounded-2xl shadow-sm text-base"
                            value={reportSearchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Select
                            className="h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-purple-500 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[140px]"
                            value={reportAreaFilter}
                            onChange={e => onAreaFilterChange(e.target.value)}
                        >
                            <option value="ALL">جميع المناطق</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </Select>

                        <Select
                            className="h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-purple-500 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[160px]"
                            value={reportStatusFilter}
                            onChange={e => onStatusFilterChange(e.target.value as 'ALL' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_AUDIT' | 'PENDING_FINANCE' | 'APPROVED')}
                        >
                            <option value="ALL">كل الحالات</option>
                            <option value="PENDING_GS">بانتظار المراقب العام</option>
                            <option value="PENDING_HEALTH">بانتظار الصحة</option>
                            <option value="PENDING_HR">بانتظار الموارد</option>
                            <option value="PENDING_AUDIT">بانتظار الرقابة</option>
                            <option value="PENDING_FINANCE">بانتظار الرواتب</option>
                            <option value="APPROVED">معتمد نهائياً</option>
                        </Select>

                        <div className="md:w-auto flex-none">
                            <MonthYearPicker month={month} year={year} onChange={onMonthChange} />
                        </div>
                    </div>
                </div>

                {/* Actions Bar - Compact and Modern */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-1">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/40 shadow-sm flex items-center gap-3">
                            <FileText className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-black text-slate-600">
                                {filteredWorkers.length} سجل متاح
                            </span>
                        </div>
                        {pendingHRCount > 0 && onBulkApprove && (
                            <Button
                                onClick={onBulkApprove}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-purple-200 h-10 px-5 gap-2 transition-all active:scale-95"
                            >
                                <CheckCircle className="h-4 w-4" />
                                اعتماد الكل ({pendingHRCount})
                            </Button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.print()}
                            className="h-10 px-4 text-blue-600 hover:bg-blue-50 rounded-xl font-bold gap-2"
                        >
                            <Printer className="h-4 w-4" />
                            طباعة للتدقيق
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onExportCSV}
                            className="h-10 px-4 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold gap-2"
                        >
                            <Download className="h-4 w-4" />
                            تصدير Excel (CSV)
                        </Button>
                    </div>
                </div>
                {/* Records Table - Premium Design */}
                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mx-1 animate-in fade-in duration-1000">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-5">العامل</th>
                                    <th className="p-5">القطاع</th>
                                    <th className="p-5 text-center">أيام عادية</th>
                                    <th className="p-5 text-center">إضافي (ع/عط/ع)</th>
                                    <th className="p-5 text-center">الإجمالي</th>
                                    <th className="p-5 text-center">الحالة</th>
                                    <th className="p-5 text-center">الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredWorkers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4 opacity-30 select-none">
                                                <Search className="h-16 w-16 mx-auto" />
                                                <p className="font-black text-xl italic tracking-tight">لا توجد بيانات</p>
                                                <p className="text-sm">لم يتم العثور على سجلات تطابق البحث المختار.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredWorkers.map((worker) => {
                                        const record = getWorkerAttendance(worker.id, month, year);
                                        const isFilled = !!record;
                                        const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";

                                        return (
                                            <tr key={worker.id} className="hover:bg-purple-50/30 transition-all duration-300 group">
                                                <td className="p-5">
                                                    <div className="font-black text-slate-800 group-hover:text-purple-600 transition-colors uppercase tracking-tight">{worker.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">REF: {worker.id}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="inline-flex items-center px-3 py-1 bg-slate-100/50 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200/50">
                                                        {areaName}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center font-black text-slate-700 text-lg">{record ? record.normalDays : "—"}</td>
                                                <td className="p-5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[11px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100/50">
                                                            {record ? `${record.overtimeNormalDays} | ${record.overtimeHolidayDays} | ${record.overtimeEidDays || 0}` : "—"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 text-purple-700 font-black text-xl shadow-inner border border-purple-100/30">
                                                        {record ? record.totalCalculatedDays : "0"}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex justify-center">
                                                        {isFilled ? (
                                                            <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border-2 ${record.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' :
                                                                record.status === 'PENDING_FINANCE' ? 'text-blue-700 bg-blue-50 border-blue-100' :
                                                                    record.status === 'PENDING_AUDIT' ? 'text-indigo-700 bg-indigo-50 border-indigo-100' :
                                                                        record.status === 'PENDING_HR' ? 'text-purple-700 bg-purple-50 border-purple-100' :
                                                                            'text-amber-700 bg-amber-50 border-amber-100'
                                                                }`}>
                                                                {record.status === 'APPROVED' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                                                {record.status === 'APPROVED' ? 'معتمد نهائياً' :
                                                                    record.status === 'PENDING_FINANCE' ? 'بانتظار المالية' :
                                                                        record.status === 'PENDING_AUDIT' ? 'بانتظار الرقابة' :
                                                                            record.status === 'PENDING_HR' ? 'مراجعة الموارد' :
                                                                                record.status === 'PENDING_HEALTH' ? 'مراجعة الصحة' : 'مراحل الاعتماد'}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] font-black bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                                                                <Clock className="h-3.5 w-3.5 opacity-30" />
                                                                غير مدخل
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {isFilled && record.status === 'PENDING_HR' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => approveAttendance(record.id, 'PENDING_AUDIT')}
                                                                className="h-10 px-5 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95"
                                                            >
                                                                إعتماد
                                                            </Button>
                                                        )}
                                                        {isFilled && record.status === 'PENDING_HR' && onReject && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => onReject(record.id)}
                                                                className="h-10 px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
                                                            >
                                                                رفض
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* Printable Area - Standardized Official Layout */}
            <div className="hidden print:block font-sans">
                <div className="text-center mb-10 border-b-[6px] border-purple-700 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">كشف مراجعة الحضور والإعانات</h1>
                            <p className="text-gray-600">
                                الشهر: {month} / {year} | القطاع: {reportAreaFilter === "ALL" ? "جميع المناطق" : areas.find(a => a.id === reportAreaFilter)?.name}
                            </p>
                            <p className="text-sm mt-1 text-purple-600 font-bold uppercase">إدارة الموارد البشرية</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">تقرير تدقيق الموارد البشرية العام</h1>
                    <div className="flex justify-center gap-12 mt-4 text-slate-600 font-black">
                        <p>الشهر: <span className="text-purple-700">{month}</span></p>
                        <p>السنة: <span className="text-purple-700">{year}</span></p>
                        <p>دائرة التدقيق: <span className="text-purple-700">الموارد البشرية</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-50 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-3 text-right">م</th>
                            <th className="border-2 border-slate-900 p-3 text-right">رقم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الاسم الكامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أيام عادية</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">إضافي عادي (0.5)</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">إضافي عطل (1.0)</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">أيام أعياد (1.0)</th>
                            <th className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorkers.map((worker, index) => {
                            const record = getWorkerAttendance(worker.id, month, year);
                            const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;

                            return (
                                <tr key={worker.id} className="border-b-2 border-slate-400">
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                    <td className="border-2 border-slate-900 p-3 font-mono">{worker.id}</td>
                                    <td className="border-2 border-slate-900 p-3 font-black">{worker.name}</td>
                                    <td className="border-2 border-slate-900 p-3">{areaName}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? record.normalDays : 0}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? record.overtimeNormalDays : 0}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? record.overtimeHolidayDays : 0}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? (record.overtimeEidDays || 0) : 0}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50">{record ? record.totalCalculatedDays : 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">مدير الموارد البشرية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد المراقب العام</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد رئاسة البلدية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم الرئاسة</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        Smart Attendance Support System - Ref: {printMetadata.ref} - Date: {printMetadata.date}
                    </p>
                </div>
            </div>
        </>
    );
});
