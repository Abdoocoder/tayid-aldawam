"use client";

import React from "react";
import { Search, MapPin, Printer, Download, CheckCircle, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
    approveAttendance: (recordId: string, nextStatus: 'PENDING_FINANCE') => Promise<void>;
    onReject?: (recordId: string) => Promise<void>;
    onMonthChange: (m: number, y: number) => void;
    onSearchChange: (value: string) => void;
    onAreaFilterChange: (value: string) => void;
    onStatusFilterChange: (value: 'ALL' | 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED') => void;
    onExportCSV: () => void;
    onBulkApprove?: () => void;
}

export function AttendanceReports({
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

    const filteredWorkers = workers.filter(w => {
        const record = getWorkerAttendance(w.id, month, year);
        const areaName = areas.find(a => a.id === w.areaId)?.name || "";
        const matchesSearch =
            w.name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
            w.id.includes(reportSearchTerm) ||
            areaName.toLowerCase().includes(reportSearchTerm.toLowerCase());
        const matchesArea = reportAreaFilter === 'ALL' || w.areaId === reportAreaFilter;

        const isFilled = !!record;
        const recordStatus = record?.status || 'PENDING_GS';
        const matchesStatus = reportStatusFilter === 'ALL' || recordStatus === reportStatusFilter;

        return matchesSearch && matchesArea && (isFilled ? matchesStatus : reportStatusFilter === 'ALL');
    });

    const pendingHRCount = filteredWorkers.reduce((count, w) => {
        const record = getWorkerAttendance(w.id, month, year);
        return (record && record.status === 'PENDING_HR') ? count + 1 : count;
    }, 0);

    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="بحث باسم العامل..."
                            className="pr-10 bg-gray-50/50 border-gray-200"
                            value={reportSearchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                    <Select
                        className="bg-gray-50/50 border-gray-200 min-w-[180px]"
                        value={reportAreaFilter}
                        onChange={e => onAreaFilterChange(e.target.value)}
                    >
                        <option value="ALL">جميع المناطق</option>
                        {areas.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </Select>
                    <Select
                        className="bg-gray-50/50 border-gray-200 min-w-[150px]"
                        value={reportStatusFilter}
                        onChange={e => onStatusFilterChange(e.target.value as 'ALL' | 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED')}
                    >
                        <option value="ALL">كل الحالات</option>
                        <option value="PENDING_HR">بانتظار اعتماد الموارد البشرية</option>
                        <option value="PENDING_FINANCE">بانتظار اعتماد قسم الرواتب</option>
                        <option value="APPROVED">معتمد نهائياً</option>
                    </Select>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <MonthYearPicker month={month} year={year} onChange={onMonthChange} />
                </div>
            </div>

            <Card className="border-none shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <CardTitle className="text-lg font-bold">سجل الحضور الشهري</CardTitle>
                        <CardDescription>
                            كشف حضور عمال {reportAreaFilter === 'ALL' ? 'كافة القطاعات' : areas.find(a => a.id === reportAreaFilter)?.name} لشهر {month}/{year}
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {pendingHRCount > 0 && onBulkApprove && (
                            <Button
                                onClick={onBulkApprove}
                                className="gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold"
                                size="sm"
                            >
                                <CheckCircle className="h-4 w-4" />
                                اعتماد الكل ({pendingHRCount})
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <Printer className="h-4 w-4" />
                            نسخة ورقية
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onExportCSV}
                            className="gap-2 border-purple-100 text-purple-600 hover:bg-purple-50"
                        >
                            <Download className="h-4 w-4" />
                            تصدير CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="overflow-x-auto p-0">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4 border-b text-right">الاسم / الرقم</th>
                                <th className="p-4 border-b text-right">المنطقة</th>
                                <th className="p-4 border-b text-center">أيام العمل</th>
                                <th className="p-4 border-b text-center">إضافي (عادي)</th>
                                <th className="p-4 border-b text-center">إضافي (عطل)</th>
                                <th className="p-4 border-b text-center">أيام الأعياد</th>
                                <th className="p-4 border-b text-center bg-purple-50/30 text-purple-700">المجموع</th>
                                <th className="p-4 border-b text-center">الحالة</th>
                                <th className="p-4 border-b text-center">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredWorkers.map((worker) => {
                                const record = getWorkerAttendance(worker.id, month, year);
                                const isFilled = !!record;
                                const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";

                                return (
                                    <tr key={worker.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{worker.name}</div>
                                            <div className="text-[10px] text-gray-400">ID: {worker.id}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-gray-600">
                                                <MapPin className="h-3 w-3 text-gray-300" />
                                                {areaName}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center font-mono font-medium">{record ? record.normalDays : "—"}</td>
                                        <td className="p-4 text-center font-mono font-medium text-amber-600">{record ? record.overtimeNormalDays : "—"}</td>
                                        <td className="p-4 text-center font-mono font-medium text-red-600">{record ? record.overtimeHolidayDays : "—"}</td>
                                        <td className="p-4 text-center font-mono font-medium text-green-600">{record ? (record.overtimeEidDays || 0) : "—"}</td>
                                        <td className="p-4 text-center bg-purple-50/10">
                                            <Badge variant={isFilled ? "success" : "secondary"} className="font-black font-mono">
                                                {record ? record.totalCalculatedDays : "0"}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                {isFilled ? (
                                                    <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${record.status === 'APPROVED' ? 'text-green-600 bg-green-50 border-green-100' :
                                                        record.status === 'PENDING_FINANCE' ? 'text-blue-600 bg-blue-50 border-blue-100' :
                                                            record.status === 'PENDING_HR' ? 'text-purple-600 bg-purple-50 border-purple-100' :
                                                                'text-amber-600 bg-amber-50 border-amber-100'
                                                        }`}>
                                                        {record.status === 'APPROVED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                        {record.status === 'APPROVED' ? 'معتمد' :
                                                            record.status === 'PENDING_FINANCE' ? 'بانتظار الرواتب' :
                                                                record.status === 'PENDING_HR' ? 'جاهز للاعتماد' : 'قيد المراجعة'}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                        <Clock className="h-3 w-3" />
                                                        لم يُدخل
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {isFilled && record.status === 'PENDING_HR' && (
                                                <Button
                                                    size="sm"
                                                    className="h-7 bg-purple-600 hover:bg-purple-700 text-[10px] font-bold"
                                                    onClick={() => approveAttendance(record.id, 'PENDING_FINANCE')}
                                                >
                                                    إعتماد
                                                </Button>
                                            )}
                                            {isFilled && record.status === 'PENDING_HR' && onReject && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    className="h-7 w-20 text-[10px] font-bold mr-2"
                                                    onClick={() => onReject(record.id)}
                                                >
                                                    رفض
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredWorkers.length === 0 && (
                        <div className="py-20 text-center text-gray-400 italic">
                            لا توجد سجلات مطابقة لهذه الفلاتر
                        </div>
                    )}
                </CardContent>
            </Card>
            {/* Printable Area - Hidden by default */}
            <div className="hidden print:block print:m-0 print:p-0">
                <div className="text-center mb-6 border-b-2 pb-4">
                    <h1 className="text-2xl font-bold mb-1">تقرير الحضور الشهري العام</h1>
                    <p className="text-gray-600">
                        الشهر: {month} / {year} | القطاع: {reportAreaFilter === "ALL" ? "جميع المناطق" : areas.find(a => a.id === reportAreaFilter)?.name}
                    </p>
                    <p className="text-sm mt-1 text-purple-600 font-bold">إدارة الموارد البشرية</p>
                </div>

                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right">رقم العامل</th>
                            <th className="border border-gray-300 p-2 text-right">الاسم الكامل</th>
                            <th className="border border-gray-300 p-2 text-right">المنطقة</th>
                            <th className="border border-gray-300 p-2 text-center">عادي</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي 0.5</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي 1.0</th>
                            <th className="border border-gray-300 p-2 text-center">أعياد 1.0</th>
                            <th className="border border-gray-300 p-2 text-center font-bold">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorkers.map((worker) => {
                            const record = getWorkerAttendance(worker.id, month, year);
                            const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;

                            return (
                                <tr key={worker.id}>
                                    <td className="border border-gray-300 p-2">{worker.id}</td>
                                    <td className="border border-gray-300 p-2 font-bold">{worker.name}</td>
                                    <td className="border border-gray-300 p-2">{areaName}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? record.normalDays : 0}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? record.overtimeNormalDays : 0}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? record.overtimeHolidayDays : 0}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? (record.overtimeEidDays || 0) : 0}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{record ? record.totalCalculatedDays : 0}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-12 grid grid-cols-3 gap-8 text-center text-sm">
                    <div>
                        <p className="font-bold mb-8 italic">توقيع المسؤول المباشر</p>
                        <div className="border-t border-gray-400 w-32 mx-auto"></div>
                    </div>
                    <div>
                        <p className="font-bold mb-8 italic">توقيع مدير الموارد البشرية</p>
                        <div className="border-t border-gray-400 w-32 mx-auto"></div>
                    </div>
                    <div>
                        <p className="font-bold mb-8 italic">توقيع المدير العام</p>
                        <div className="border-t border-gray-400 w-32 mx-auto"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
