"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { FileText, Loader2, AlertCircle } from "lucide-react";

export function HRView() {
    const { workers, getWorkerAttendance, isLoading, error } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
                    <p className="text-gray-500">جاري تحميل التقارير...</p>
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        لوحة الموارد البشرية
                    </h2>
                    <p className="text-gray-500 text-sm">عرض تقارير الحضور الشهرية</p>
                </div>
                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>سجل الحضور - {month} / {year}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-700 font-medium">
                            <tr>
                                <th className="p-3 border-b">الرقم</th>
                                <th className="p-3 border-b">الاسم</th>
                                <th className="p-3 border-b">المنطقة</th>
                                <th className="p-3 border-b text-center">أيام العمل</th>
                                <th className="p-3 border-b text-center">إضافي (عادي)</th>
                                <th className="p-3 border-b text-center">إضافي (عطل)</th>
                                <th className="p-3 border-b text-center bg-gray-100">المجموع المحتسب</th>
                                <th className="p-3 border-b text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {workers.map((worker) => {
                                const record = getWorkerAttendance(worker.id, month, year);
                                return (
                                    <tr key={worker.id} className="hover:bg-gray-50/50">
                                        <td className="p-3">{worker.id}</td>
                                        <td className="p-3 font-medium">{worker.name}</td>
                                        <td className="p-3 text-gray-500">{worker.areaId}</td>
                                        <td className="p-3 text-center">{record ? record.normalDays : "-"}</td>
                                        <td className="p-3 text-center">{record ? record.overtimeNormalDays : "-"}</td>
                                        <td className="p-3 text-center">{record ? record.overtimeHolidayDays : "-"}</td>
                                        <td className="p-3 text-center font-bold bg-gray-50">{record ? record.totalCalculatedDays : "-"}</td>
                                        <td className="p-3 text-center">
                                            {record ? <Badge variant="success">معتمد</Badge> : <Badge variant="secondary">غير مدخل</Badge>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
