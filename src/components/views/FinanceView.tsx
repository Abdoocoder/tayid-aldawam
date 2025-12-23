"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Banknote, Loader2, AlertCircle, Download, Search, MapPin, DollarSign, Printer } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FinanceView() {
    const { workers, getWorkerAttendance, isLoading, error, areas, attendanceRecords } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("ALL");

    // Filter workers based on search and area
    const filteredWorkers = workers.filter(w => {
        const record = getWorkerAttendance(w.id, month, year);
        const isApproved = record?.status === 'APPROVED';

        const areaName = areas.find(a => a.id === w.areaId)?.name || "";
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            areaName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = areaFilter === "ALL" || w.areaId === areaFilter;

        return isApproved && matchesSearch && matchesArea;
    });

    // Calculate totals based on filtered results or all? 
    // Usually Finance wants the total for the current view/selection, or global?
    // Let's keep it global for the total payroll of the month.
    const totalAmount = workers.reduce((acc, worker) => {
        const record = getWorkerAttendance(worker.id, month, year);
        if (record) {
            return acc + (record.totalCalculatedDays * worker.dayValue);
        }
        return acc;
    }, 0);

    const handleExportCSV = () => {
        const headers = ["الرقم", "الاسم", "القطاع", "الأيام المحتسبة", "قيمة اليوم", "الصافي"];
        const rows = workers.map(worker => {
            const record = getWorkerAttendance(worker.id, month, year);
            const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";
            return [
                worker.id,
                worker.name,
                areaName,
                record ? record.totalCalculatedDays : 0,
                worker.dayValue,
                record ? (record.totalCalculatedDays * worker.dayValue).toFixed(2) : 0
            ];
        });

        const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `payroll_${month}_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-green-600 mx-auto" />
                    <p className="text-gray-500">جاري حساب الرواتب...</p>
                </div>
            </div>
        );
    }

    // Show error state
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
            {/* Premium Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-green-600 p-3 rounded-xl text-white shadow-lg shadow-green-100">
                        <Banknote className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">القسم المالي</h2>
                        <p className="text-gray-500 text-sm">إدارة واحتساب رواتب العمال والمدفوعات</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm bg-green-50/50 overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-green-900">
                        <DollarSign className="h-24 w-24" />
                    </div>
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                        <div className="bg-green-600 p-3 rounded-2xl text-white">
                            <Banknote className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">إجمالي المرتبات</p>
                            <p className="text-2xl font-black text-green-900">{totalAmount.toFixed(2)} <span className="text-sm font-medium">د.أ</span></p>
                        </div>
                    </CardContent>
                </Card>
                {/* Additional stats could be added here later (e.g., workers paid, etc) */}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="بحث عن طريق الاسم أو القطاع..."
                        className="pr-10 bg-white border-gray-200 focus:ring-green-500 rounded-xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="w-full md:w-64 p-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 outline-none"
                    value={areaFilter}
                    onChange={e => setAreaFilter(e.target.value)}
                >
                    <option value="ALL">جميع القطاعات</option>
                    {areas.map(a => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                </select>
            </div>

            <Card className="border-none shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <CardTitle className="text-lg font-bold text-green-800">قائمة الرواتب المعتمدة فقط</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">يتم عرض العمال الذين تم اعتماد حضورهم نهائياً من قبل الموارد البشرية لشهر {month} سنة {year}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                        >
                            <Printer className="h-4 w-4" />
                            نسخة ورقية
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 rounded-lg">
                            <Download className="h-4 w-4" />
                            تصدير CSV
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4 border-b">الرقم</th>
                                <th className="p-4 border-b">الاسم</th>
                                <th className="p-4 border-b">القطاع</th>
                                <th className="p-4 border-b text-center">الأيام المحتسبة</th>
                                <th className="p-4 border-b text-center">قيمة اليوم</th>
                                <th className="p-4 border-b text-center bg-green-50/50 text-green-900">الصافي المستحق</th>
                                <th className="p-4 border-b text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredWorkers.map((worker) => {
                                const record = getWorkerAttendance(worker.id, month, year);
                                const total = record ? record.totalCalculatedDays * worker.dayValue : 0;
                                const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";

                                return (
                                    <tr key={worker.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 text-xs text-gray-400 font-mono">#{worker.id}</td>
                                        <td className="p-4">
                                            <div className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{worker.name}</div>
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="text-[10px] font-medium border-gray-100 text-gray-500">
                                                <MapPin className="h-3 w-3 ml-1 text-gray-300" />
                                                {areaName}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-center font-mono font-bold text-gray-600">{record ? record.totalCalculatedDays : "-"}</td>
                                        <td className="p-4 text-center text-sm text-gray-500">{worker.dayValue} د.أ</td>
                                        <td className="p-4 text-center bg-green-50/30">
                                            <span className="text-lg font-black text-green-700">
                                                {record ? total.toFixed(2) : "-"}
                                            </span>
                                            {record && <span className="text-[10px] text-green-600 mr-1 italic">د.أ</span>}
                                        </td>
                                        <td className="p-4 text-center">
                                            {record ? (
                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-3">
                                                    جاهز للصرف
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-400 hover:bg-gray-100 border-none px-3">
                                                    معلق
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
            {/* Printable Area - Hidden by default */}
            <div className="hidden print:block print:m-0 print:p-0">
                <div className="text-center mb-6 border-b-2 pb-4">
                    <h1 className="text-2xl font-bold mb-1">مسير رواتب العمال</h1>
                    <p className="text-gray-600">
                        الشهر: {month} / {year} | القطاع: {areaFilter === "ALL" ? "جميع القطاعات" : areas.find(a => a.id === areaFilter)?.name}
                    </p>
                    <p className="text-sm mt-1 text-green-700 font-bold italic">القسم المالي</p>
                </div>

                <div className="mb-4 text-left font-bold text-lg bg-gray-50 p-2 inline-block border rounded">
                    إجمالي المبلغ المستحق: {totalAmount.toFixed(2)} د.أ
                </div>

                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right">الرقم</th>
                            <th className="border border-gray-300 p-2 text-right">الاسم</th>
                            <th className="border border-gray-300 p-2 text-right">المنطقة</th>
                            <th className="border border-gray-300 p-2 text-center">الأيام المحتسبة</th>
                            <th className="border border-gray-300 p-2 text-center">سعر اليوم</th>
                            <th className="border border-gray-300 p-2 text-center font-bold">الصافي (د.أ)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorkers.map(worker => {
                            const record = getWorkerAttendance(worker.id, month, year);
                            const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;
                            const total = record ? record.totalCalculatedDays * worker.dayValue : 0;
                            return (
                                <tr key={worker.id}>
                                    <td className="border border-gray-300 p-2">{worker.id}</td>
                                    <td className="border border-gray-300 p-2 font-bold">{worker.name}</td>
                                    <td className="border border-gray-300 p-2">{areaName}</td>
                                    <td className="border border-gray-300 p-2 text-center font-mono">{record ? record.totalCalculatedDays : "0"}</td>
                                    <td className="border border-gray-300 p-2 text-center font-mono">{worker.dayValue}</td>
                                    <td className="border border-gray-300 p-2 text-center font-black">{total.toFixed(2)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-8 grid grid-cols-2 gap-8 text-center no-print">
                    <div className="border-t border-black pt-2 font-bold">المحاسب المسؤول</div>
                    <div className="border-t border-black pt-2 font-bold">مدير القسم المالي</div>
                </div>

                <div className="mt-12 text-[10px] text-gray-400 text-center">
                    تم استخراج هذا الكشف بتاريخ {new Date().toLocaleDateString('ar-LY')} من المنظومة المالية
                </div>
            </div>
        </div>
    );
}
