"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Clock,
    Search,
    Printer,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

export function GeneralSupervisorView() {
    const { currentUser, workers, attendanceRecords, areas, approveAttendance, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

    const supervisorAreas = areas.filter(a =>
        currentUser?.role === 'ADMIN' ||
        currentUser?.areaId === 'ALL' ||
        currentUser?.areas?.some(ca => ca.id === a.id)
    );

    const filteredRecords = attendanceRecords.filter(r => {
        const worker = workers.find(w => w.id === r.workerId);
        if (!worker) return false;

        const isCorrectPeriod = r.month === month && r.year === year;
        const isPendingGS = r.status === 'PENDING_GS';
        const matchesArea = selectedAreaId === 'ALL' || worker.areaId === selectedAreaId;
        const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.id.includes(searchTerm);

        // Only show records in areas this GS is responsible for
        const isResponsibleArea =
            currentUser?.role === 'ADMIN' ||
            currentUser?.areaId === 'ALL' ||
            currentUser?.areas?.some(a => a.id === worker.areaId);

        return isCorrectPeriod && isPendingGS && matchesArea && matchesSearch && isResponsibleArea;
    });

    const handleApprove = async (recordId: string) => {
        setApprovingIds(prev => new Set(prev).add(recordId));
        try {
            await approveAttendance(recordId, 'PENDING_HR');
        } catch (err) {
            console.error(err);
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(recordId);
                return next;
            });
        }
    };

    const handleBulkApprove = async () => {
        const ids = filteredRecords.map(r => r.id);
        const confirmBulk = confirm(`هل أنت متأكد من اعتماد ${ids.length} سجلات حفل واحد؟`);
        if (!confirmBulk) return;

        for (const id of ids) {
            await handleApprove(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-lg text-white shadow-lg">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">لوحة المراقب العام</h2>
                        <p className="text-gray-500 text-sm">اعتماد بيانات المراقبين قبل تحويلها للقسم المتخصص</p>
                    </div>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <Button variant="outline" onClick={() => window.print()} className="gap-2 border-blue-200 text-blue-700">
                        <Printer className="h-4 w-4" />
                        نسخة ورقية
                    </Button>
                    <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="p-4 flex items-center gap-4">
                        <Clock className="h-8 w-8 text-amber-600" />
                        <div>
                            <p className="text-xs font-bold text-amber-600">بانتظار اعتمادك</p>
                            <p className="text-2xl font-black text-amber-900">{filteredRecords.length}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="ابحث عن عامل أو رقم..."
                        className="pr-10 bg-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select
                    className="min-w-[200px]"
                    value={selectedAreaId}
                    onChange={e => setSelectedAreaId(e.target.value)}
                >
                    <option value="ALL">جميع قطاعاتي</option>
                    {supervisorAreas.map(area => (
                        <option key={area.id} value={area.id}>{area.name}</option>
                    ))}
                </Select>
                {filteredRecords.length > 0 && (
                    <Button onClick={handleBulkApprove} className="bg-indigo-600 hover:bg-indigo-700 font-bold">
                        اعتماد الكل ({filteredRecords.length})
                    </Button>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-right border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <th className="p-4 border-b">العامل</th>
                            <th className="p-4 border-b">القطاع</th>
                            <th className="p-4 border-b text-center">أيام العمل</th>
                            <th className="p-4 border-b text-center">إضافي (عادي/عطلة/عيد)</th>
                            <th className="p-4 border-b text-center">الإجمالي</th>
                            <th className="p-4 border-b text-center">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-10 text-center text-gray-400 italic">
                                    لا توجد سجلات بانتظار الاعتماد لهذه الفترة
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map(record => {
                                const worker = workers.find(w => w.id === record.workerId);
                                const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                                return (
                                    <tr key={record.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900">{worker?.name}</div>
                                            <div className="text-[10px] text-gray-400 font-mono italic">ID: {worker?.id}</div>
                                        </td>
                                        <td className="p-4 text-gray-600">{areaName}</td>
                                        <td className="p-4 text-center font-bold">{record.normalDays}</td>
                                        <td className="p-4 text-center text-xs text-gray-500">
                                            {record.overtimeNormalDays} / {record.overtimeHolidayDays} / {record.overtimeEidDays}
                                        </td>
                                        <td className="p-4 text-center">
                                            <Badge variant="outline" className="text-indigo-600 border-indigo-200">
                                                {record.totalCalculatedDays} يوم
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            <Button
                                                size="sm"
                                                onClick={() => handleApprove(record.id)}
                                                disabled={approvingIds.has(record.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 px-4"
                                            >
                                                {approvingIds.has(record.id) ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    "إعتماد"
                                                )}
                                            </Button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Printable Area */}
            <div className="hidden print:block">
                <div className="text-center mb-6 border-b-2 pb-4">
                    <h1 className="text-2xl font-bold mb-1">تقرير اعتماد المراقب العام</h1>
                    <p className="text-gray-600">الشهر: {month}/{year} | المراقب العام: {currentUser?.name}</p>
                </div>
                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100 font-bold">
                            <th className="border border-gray-300 p-2 text-right">العامل</th>
                            <th className="border border-gray-300 p-2 text-right">القطاع</th>
                            <th className="border border-gray-300 p-2 text-center">أيام العمل</th>
                            <th className="border border-gray-300 p-2 text-center">إجمالي الأيام</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map(record => {
                            const worker = workers.find(w => w.id === record.workerId);
                            const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                            return (
                                <tr key={record.id}>
                                    <td className="border border-gray-300 p-2">{worker?.name}</td>
                                    <td className="border border-gray-300 p-2">{areaName}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record.normalDays}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{record.totalCalculatedDays}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                <div className="mt-8 grid grid-cols-2 gap-8 text-center no-print">
                    <div className="border-t border-black pt-2 font-bold">توقيع المراقب العام</div>
                    <div className="border-t border-black pt-2 font-bold">ختم الجهة المسؤولة</div>
                </div>
            </div>
        </div>
    );
}
