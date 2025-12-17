"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Banknote, Loader2, AlertCircle } from "lucide-react";

export function FinanceView() {
    const { workers, getWorkerAttendance, isLoading, error } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Calculate totals
    const totalAmount = workers.reduce((acc, worker) => {
        const record = getWorkerAttendance(worker.id, month, year);
        if (record) {
            return acc + (record.totalCalculatedDays * worker.dayValue);
        }
        return acc;
    }, 0);

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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Banknote className="h-6 w-6 text-green-600" />
                        القسم المالي
                    </h2>
                    <p className="text-gray-500 text-sm">احتساب رواتب العمال</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-green-100 px-4 py-2 rounded-lg text-green-800 font-bold border border-green-200">
                        الإجمالي: {totalAmount.toFixed(2)} دينار
                    </div>
                    <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>مسير الرواتب - {month} / {year}</CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-gray-50 text-gray-700 font-medium">
                            <tr>
                                <th className="p-3 border-b">الرقم</th>
                                <th className="p-3 border-b">الاسم</th>
                                <th className="p-3 border-b text-center">الأيام المحتسبة</th>
                                <th className="p-3 border-b text-center">قيمة اليوم</th>
                                <th className="p-3 border-b text-center bg-green-50 text-green-900">الصافي المستحق</th>
                                <th className="p-3 border-b text-center">الحالة</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {workers.map((worker) => {
                                const record = getWorkerAttendance(worker.id, month, year);
                                const total = record ? record.totalCalculatedDays * worker.dayValue : 0;

                                return (
                                    <tr key={worker.id} className="hover:bg-gray-50/50">
                                        <td className="p-3">{worker.id}</td>
                                        <td className="p-3 font-medium">{worker.name}</td>
                                        <td className="p-3 text-center">{record ? record.totalCalculatedDays : "-"}</td>
                                        <td className="p-3 text-center">{worker.dayValue} د.أ</td>
                                        <td className="p-3 text-center font-bold text-green-700 bg-green-50/30">
                                            {record ? total.toFixed(2) : "-"}
                                        </td>
                                        <td className="p-3 text-center">
                                            {record ? <Badge variant="success">جاهز للصرف</Badge> : <Badge variant="secondary">معلق</Badge>}
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
