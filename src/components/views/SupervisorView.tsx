"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { User, ClipboardList, CheckCircle, Loader2, AlertCircle, Users, Clock, Target, Search, MapPin, Printer } from "lucide-react";
import Link from "next/link"; // For navigation
import { Input } from "../ui/input"; // Added for search input
import { Select } from "../ui/select";

export function SupervisorView() {
    const { currentUser, workers, getWorkerAttendance, isLoading, error, areas } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");

    // Get all areas relevant to this supervisor
    const supervisorAreas = areas.filter(a =>
        currentUser?.areaId === 'ALL' ||
        a.id === currentUser?.areaId ||
        currentUser?.areas?.some(ca => ca.id === a.id)
    );

    // Filter workers by area(s) and search term
    const baseWorkers = workers.filter((w) => {
        if (currentUser?.areaId === 'ALL') return true;
        const isPrimaryArea = w.areaId === currentUser?.areaId;
        const isInAssignedAreas = currentUser?.areas?.some(a => a.id === w.areaId);
        return isPrimaryArea || isInAssignedAreas;
    });

    const filteredWorkers = baseWorkers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = selectedAreaId === "ALL" || w.areaId === selectedAreaId;
        return matchesSearch && matchesArea;
    });

    // Calculate stats
    const totalWorkers = baseWorkers.length;
    const completedEntries = baseWorkers.filter(w => !!getWorkerAttendance(w.id, month, year)).length;
    const pendingEntries = totalWorkers - completedEntries;
    const completionPercentage = totalWorkers > 0 ? Math.round((completedEntries / totalWorkers) * 100) : 0;

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3 bg-red-50 p-6 rounded-lg border border-red-200">
                    <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
                    <p className="text-red-700 font-semibold">حدث خطأ في تحميل البيانات</p>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
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
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-blue-500/20">
                                <ClipboardList className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">الحضور والغياب</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{currentUser?.name}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.print()}
                            className="hidden sm:flex gap-2 text-blue-600 hover:bg-blue-50 rounded-xl"
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

            {/* Quick Stats - Responsive Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both px-1">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/30 ring-1 ring-blue-100 hover:shadow-md transition-all rounded-2xl overflow-hidden">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                        <div className="bg-white p-2 rounded-xl text-blue-600 shadow-sm mb-1">
                            <Users className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">العمال</p>
                        <p className="text-xl font-black text-blue-900">{totalWorkers}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100/30 ring-1 ring-emerald-100 hover:shadow-md transition-all rounded-2xl overflow-hidden">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                        <div className="bg-white p-2 rounded-xl text-emerald-600 shadow-sm mb-1">
                            <CheckCircle className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] text-emerald-600 font-black uppercase tracking-tighter">مكتمل</p>
                        <p className="text-xl font-black text-emerald-900">{completedEntries}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/30 ring-1 ring-amber-100 hover:shadow-md transition-all rounded-2xl overflow-hidden">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                        <div className="bg-white p-2 rounded-xl text-amber-600 shadow-sm mb-1">
                            <Clock className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-tighter">متبقي</p>
                        <p className="text-xl font-black text-amber-900">{pendingEntries}</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100/30 ring-1 ring-indigo-100 hover:shadow-md transition-all rounded-2xl overflow-hidden">
                    <CardContent className="p-3 flex flex-col items-center text-center gap-1">
                        <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm mb-1">
                            <Target className="h-4 w-4" />
                        </div>
                        <p className="text-[10px] text-indigo-600 font-black uppercase tracking-tighter">الإنجاز</p>
                        <p className="text-xl font-black text-indigo-900">{completionPercentage}%</p>
                    </CardContent>
                </Card>
            </div>

            {/* Filters - Modern and Compact */}
            <div className="flex flex-col gap-3 px-1">
                <div className="relative group">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    <Input
                        placeholder="ابحث عن عامل..."
                        className="pr-10 h-11 bg-white/60 backdrop-blur-md border-slate-200 focus:border-blue-500 rounded-2xl shadow-sm"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {supervisorAreas.length > 1 && (
                    <Select
                        className="h-11 bg-white/60 backdrop-blur-md border-slate-200 rounded-2xl shadow-sm font-bold text-slate-700"
                        value={selectedAreaId}
                        onChange={e => setSelectedAreaId(e.target.value)}
                    >
                        <option value="ALL">جميع المناطق</option>
                        {supervisorAreas.map(area => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                    </Select>
                )}
            </div>

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500 delay-200">
                {filteredWorkers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-3xl border border-dashed border-gray-300 py-16 text-center">
                        <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                            <Search className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">لا توجد نتائج</h3>
                        <p className="text-gray-500 text-sm mb-4">لم نجد أي عامل يطابق معايير البحث الحالية</p>
                        {(searchTerm || selectedAreaId !== "ALL") && (
                            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={() => { setSearchTerm(""); setSelectedAreaId("ALL"); }}>
                                مسح فلاتر البحث
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredWorkers.map((worker) => {
                        const record = getWorkerAttendance(worker.id, month, year);
                        const isFilled = !!record;
                        const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";

                        return (
                            <Card key={worker.id} className={`group hover:shadow-2xl transition-all duration-300 relative overflow-hidden border-none rounded-3xl ${isFilled ? 'bg-gradient-to-br from-white to-emerald-50/30' : 'bg-white shadow-xl shadow-slate-200/50'}`}>
                                <CardContent className="p-0">
                                    <div className="p-5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-3 rounded-2xl transition-all duration-300 ${isFilled ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h4 className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{worker.name}</h4>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-slate-50 border-slate-200 text-slate-500">#{worker.id}</Badge>
                                                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                        <MapPin className="h-2.5 w-2.5" />
                                                        {areaName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {isFilled && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                                    </div>

                                    <div className="px-5 pb-5">
                                        <div className="flex items-center justify-between gap-3 bg-slate-50/50 p-2.5 rounded-2xl border border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الحالة</span>
                                                <span className={`text-[11px] font-black ${isFilled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                    {isFilled ? (
                                                        record.status === 'PENDING_GS' ? "بانتظار المشرف العام" :
                                                            record.status === 'PENDING_HR' ? "بانتظار الموارد" :
                                                                record.status === 'PENDING_FINANCE' ? "بانتظار الرواتب" :
                                                                    record.status === 'PENDING_SUPERVISOR' ? "يحتاج تصحيح" :
                                                                        "معتمد نهائياً"
                                                    ) : "بانتظار الإدخال"}
                                                </span>
                                            </div>
                                            <Link href={`/dashboard/entry/${worker.id}?month=${month}&year=${year}`}>
                                                <Button size="sm" className={`h-9 px-5 rounded-xl font-black shadow-lg transition-all active:scale-95 ${!isFilled ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white' : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100'}`}>
                                                    {isFilled ? (record.status === 'PENDING_SUPERVISOR' ? "تصحيح" : "تعديل") : "إدخال الحضور"}
                                                </Button>
                                            </Link>
                                        </div>

                                        {isFilled && (
                                            <div className="grid grid-cols-2 gap-2 mt-3">
                                                <div className="bg-white/60 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">أيام عادية</span>
                                                    <span className="text-sm font-black text-slate-900">{record.normalDays}</span>
                                                </div>
                                                <div className="bg-white/60 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
                                                    <span className="text-[8px] font-black text-slate-400 uppercase">الإجمالي</span>
                                                    <span className="text-sm font-black text-blue-600">{record.totalCalculatedDays}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
            {/* Printable Area - Hidden by default, visible only during print */}
            <div className="hidden print:block print:m-0 print:p-0">
                <div className="text-center mb-6 border-b-2 pb-4">
                    <h1 className="text-2xl font-bold mb-1">كشف حضور وانصراف شهري</h1>
                    <p className="text-gray-600">
                        الشهر: {month} / {year} | القطاع: {selectedAreaId === "ALL" ? "جميع المناطق التابعة" : areas.find(a => a.id === selectedAreaId)?.name}
                    </p>
                    <p className="text-sm mt-1">المراقب: {currentUser?.name}</p>
                </div>

                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right">رقم العامل</th>
                            <th className="border border-gray-300 p-2 text-right">اسم العامل</th>
                            <th className="border border-gray-300 p-2 text-right">المنطقة</th>
                            <th className="border border-gray-300 p-2 text-center">أيام عادية</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي عادي (x0.5)</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي عطل (x1.0)</th>
                            <th className="border border-gray-300 p-2 text-center">أيام أعياد (x1.0)</th>
                            <th className="border border-gray-300 p-2 text-center font-bold">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorkers.map(worker => {
                            const record = getWorkerAttendance(worker.id, month, year);
                            const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;
                            return (
                                <tr key={worker.id}>
                                    <td className="border border-gray-300 p-2">{worker.id}</td>
                                    <td className="border border-gray-300 p-2 font-bold">{worker.name}</td>
                                    <td className="border border-gray-300 p-2">{areaName}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? record.normalDays : "0"}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? record.overtimeNormalDays : "0"}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? record.overtimeHolidayDays : "0"}</td>
                                    <td className="border border-gray-300 p-2 text-center">{record ? (record.overtimeEidDays || 0) : "0"}</td>
                                    <td className="border border-gray-300 p-2 text-center font-bold">{record ? record.totalCalculatedDays : "0"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-8 grid grid-cols-2 gap-8 text-center no-print">
                    <div className="border-t border-black pt-2">توقيع المراقب</div>
                    <div className="border-t border-black pt-2">اعتماد الإدارة</div>
                </div>

                <div className="mt-12 text-[10px] text-gray-400 text-center">
                    تم استخراج هذا التقرير بتاريخ {new Date().toLocaleDateString('ar-JO')}
                </div>
            </div>

        </div>
    );
}
