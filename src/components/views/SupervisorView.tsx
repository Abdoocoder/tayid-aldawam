"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
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
        <div className="space-y-6">
            {/* Header & Month Picker */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-4 md:p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600 p-3 rounded-lg text-white shadow-lg shadow-blue-100">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">لوحة المراقب</h2>
                        <p className="text-gray-500 text-sm flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {currentUser?.name}
                        </p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50 w-full sm:w-auto order-2 sm:order-1"
                    >
                        <Printer className="h-4 w-4" />
                        نسخة ورقية
                    </Button>
                    <div className="order-1 sm:order-2 w-full sm:w-auto">
                        <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-blue-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-bold">إجمالي العمال</p>
                            <p className="text-2xl font-black text-blue-900">{totalWorkers}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-green-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-green-100 p-2 rounded-full text-green-600">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-green-600 font-bold">تم الإدخال</p>
                            <p className="text-2xl font-black text-green-900">{completedEntries}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-orange-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-orange-100 p-2 rounded-full text-orange-600">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-orange-600 font-bold">بانتظار الإدخال</p>
                            <p className="text-2xl font-black text-orange-900">{pendingEntries}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-purple-50/50">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                            <Target className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-bold">نسبة الإنجاز</p>
                            <div className="flex items-end gap-2">
                                <p className="text-2xl font-black text-purple-900">{completionPercentage}%</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="ابحث عن عامل بالإسم أو الرقم..."
                        className="pr-10 bg-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                {supervisorAreas.length > 1 && (
                    <Select
                        className="min-w-[200px]"
                        value={selectedAreaId}
                        onChange={e => setSelectedAreaId(e.target.value)}
                    >
                        <option value="ALL">جميع المناطق التابعة لي</option>
                        {supervisorAreas.map(area => (
                            <option key={area.id} value={area.id}>{area.name}</option>
                        ))}
                    </Select>
                )}
            </div>

            {/* Workers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredWorkers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-xl border border-dashed border-gray-300 py-16 text-center">
                        <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="h-8 w-8 text-gray-300" />
                        </div>
                        <h3 className="text-gray-900 font-bold mb-1">لا توجد نتائج</h3>
                        <p className="text-gray-500 text-sm">لم نجد أي عامل يطابق معايير البحث الحالية</p>
                        {(searchTerm || selectedAreaId !== "ALL") && (
                            <Button variant="link" className="text-blue-600 mt-2" onClick={() => { setSearchTerm(""); setSelectedAreaId("ALL"); }}>
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
                            <Card key={worker.id} className={`group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden border-2 ${isFilled ? 'border-green-500/20 bg-gradient-to-br from-white to-green-50/30' : 'border-transparent bg-white shadow-sm'}`}>
                                <div className={`absolute top-0 right-0 w-16 h-16 -mr-8 -mt-8 rotate-45 transition-colors ${isFilled ? 'bg-green-500' : 'bg-gray-100'}`} />

                                {isFilled && (
                                    <div className="absolute top-1.5 right-1.5 z-10">
                                        <CheckCircle className="text-white h-3 w-3 md:h-4 md:w-4" />
                                    </div>
                                )}

                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-xl transition-colors ${isFilled ? 'bg-green-100 text-green-700' : 'bg-blue-50 text-blue-600'}`}>
                                                <User className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{worker.name}</CardTitle>
                                                <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium">
                                                    <span className="bg-gray-100 px-1.5 rounded">ID: {worker.id}</span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-0.5">
                                                        <MapPin className="h-2 w-2" />
                                                        {areaName}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>

                                <CardContent className="space-y-4">
                                    <div className="flex flex-col gap-1 w-full bg-gray-50/50 p-2 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <Badge variant={isFilled ? "success" : "secondary"} className="h-6">
                                                {isFilled ? (
                                                    record.status === 'PENDING_GS' ? "بانتظار المراقب العام" :
                                                        record.status === 'PENDING_HR' ? "بانتظار الموارد البشرية" :
                                                            record.status === 'PENDING_FINANCE' ? "بانتظار قسم الرواتب" :
                                                                record.status === 'PENDING_SUPERVISOR' ? "معاد للتصحيح" :
                                                                    "معتمد نهائياً"
                                                ) : "بانتظار الإدخال"}
                                            </Badge>
                                            <Link href={`/dashboard/entry/${worker.id}?month=${month}&year=${year}`}>
                                                <Button size="sm" variant={isFilled ? "ghost" : "default"} className={`h-8 px-4 rounded-lg font-bold shadow-sm ${!isFilled ? 'bg-blue-600 hover:bg-blue-700' : 'text-blue-600 hover:bg-blue-50 border-blue-100 border'}`}>
                                                    {isFilled ? (record.status === 'PENDING_SUPERVISOR' ? "تصحيح" : "تعديل") : "إدخال الحضور"}
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>

                                    {isFilled && (
                                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                                            <div className="bg-white border rounded-lg p-2 flex flex-col items-center">
                                                <span className="text-gray-400 font-medium mb-0.5 text-[9px]">أيام العمل</span>
                                                <span className="text-gray-900 font-black text-sm">{record.normalDays}</span>
                                            </div>
                                            <div className="bg-white border rounded-lg p-2 flex flex-col items-center">
                                                <span className="text-gray-400 font-medium mb-0.5 text-[9px]">الإجمالي المعتمد</span>
                                                <span className="text-blue-600 font-black text-sm">{record.totalCalculatedDays}</span>
                                            </div>
                                        </div>
                                    )}
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
                            <th className="border border-gray-300 p-2 text-center">أيام العمل</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي عادي</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي عطلة</th>
                            <th className="border border-gray-300 p-2 text-center">أيام أعياد</th>
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
                    تم استخراج هذا التقرير بتاريخ {new Date().toLocaleDateString('ar-LY')}
                </div>
            </div>

        </div>
    );
}
