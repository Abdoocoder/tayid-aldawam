"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
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
    const { currentUser, workers, attendanceRecords, areas, approveAttendance, rejectAttendance, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

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

    // Debug logs
    console.log(`GeneralSupervisorView: month=${month}, year=${year}, totalRecords=${attendanceRecords.length}, filtered=${filteredRecords.length}`);
    if (filteredRecords.length === 0 && attendanceRecords.length > 0) {
        const sample = attendanceRecords[0];
        console.log(`Sample record: month=${sample.month}, year=${sample.year}, status=${sample.status}`);
    }

    const handleApprove = async (recordId: string) => {
        setApprovingIds(prev => new Set(prev).add(recordId));
        try {
            await approveAttendance(recordId, 'PENDING_HEALTH');
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

    const handleReject = async (recordId: string) => {
        if (!confirm("هل أنت متأكد من رفض هذا السجل وإعادته للمراقب؟")) return;
        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
            await rejectAttendance(recordId, 'PENDING_SUPERVISOR');
        } catch (err) {
            console.error(err);
        } finally {
            setRejectingIds(prev => {
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
        <div className="space-y-6 pb-24">
            {/* Header & Month Picker - Sticky and Glassmorphic */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="max-w-7xl mx-auto flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">المراقب العام</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{currentUser?.name}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.print()}
                            className="hidden sm:flex gap-2 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                        >
                            <Printer className="h-4 w-4" />
                            <span className="text-xs font-bold">طباعة الكشف</span>
                        </Button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                            <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="sm:hidden p-2 rounded-xl border-slate-200"
                        >
                            <Printer className="h-4 w-4 text-slate-600" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100/30 ring-1 ring-indigo-100 rounded-[1.5rem] overflow-hidden">
                    <CardContent className="p-5 flex items-center gap-5">
                        <div className="bg-white p-4 rounded-2xl text-indigo-600 shadow-sm ring-1 ring-indigo-50">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-1">بانتظار اعتمادك</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-indigo-900 leading-none">{filteredRecords.length}</p>
                                <p className="text-xs text-indigo-400 font-bold">سجل متبقي</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Actions - Mobile Optimized */}
            <div className="flex flex-col gap-4 px-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input
                            placeholder="بحث عن عامل أو رقم..."
                            className="pr-12 h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-indigo-500 rounded-2xl shadow-sm shadow-indigo-900/5 text-base"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select
                        className="h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-indigo-500 rounded-2xl shadow-sm shadow-indigo-900/5 font-bold text-slate-700 min-w-[200px]"
                        value={selectedAreaId}
                        onChange={e => setSelectedAreaId(e.target.value)}
                    >
                        <option value="ALL">جميع قطاعاتي</option>
                        {supervisorAreas.map(area => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                    </Select>
                </div>

                {filteredRecords.length > 0 && (
                    <Button
                        onClick={handleBulkApprove}
                        className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <ShieldCheck className="h-5 w-5" />
                        اعتماد الكل ({filteredRecords.length})
                    </Button>
                )}
            </div>

            {/* Records Table - Premium Design */}
            <div className="bg-white/40 backdrop-blur-md rounded-[2rem] shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mx-1 animate-in fade-in duration-1000">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="p-5">بيانات العامل</th>
                                <th className="p-5">القطاع</th>
                                <th className="p-5 text-center">أيام عادية</th>
                                <th className="p-5 text-center">الإضافي</th>
                                <th className="p-5 text-center">الإجمالي</th>
                                <th className="p-5 text-center">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="max-w-xs mx-auto space-y-4 opacity-30 select-none">
                                            <Search className="h-16 w-16 mx-auto" />
                                            <p className="font-black text-xl italic tracking-tight">لا توجد سجلات حالية</p>
                                            <p className="text-sm">جميع الكشوف التابعة لك معتمدة أو لم يتم إدخالها بعد.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map(record => {
                                    const worker = workers.find(w => w.id === record.workerId);
                                    const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                                    return (
                                        <tr key={record.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                            <td className="p-5">
                                                <div className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{worker?.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">REF: {worker?.id}</div>
                                            </td>
                                            <td className="p-5">
                                                <div className="inline-flex items-center px-3 py-1 bg-slate-100/50 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200/50">
                                                    {areaName}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center font-black text-slate-700 text-lg">{record.normalDays}</td>
                                            <td className="p-5 text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">عادي / عطلة / عيد</span>
                                                    <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100/50">
                                                        {record.overtimeNormalDays} | {record.overtimeHolidayDays} | {record.overtimeEidDays}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-700 font-black text-xl shadow-inner border border-indigo-100/30">
                                                    {record.totalCalculatedDays}
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(record.id)}
                                                        disabled={approvingIds.has(record.id)}
                                                        className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                                    >
                                                        {approvingIds.has(record.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "إعتماد"
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleReject(record.id)}
                                                        disabled={rejectingIds.has(record.id) || approvingIds.has(record.id)}
                                                        className="h-10 px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
                                                    >
                                                        {rejectingIds.has(record.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "رفض"
                                                        )}
                                                    </Button>
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
                            <th className="border border-gray-300 p-2 text-center">أيام عادية</th>
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
