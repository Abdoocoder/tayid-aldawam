"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { User, ClipboardList, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link"; // For navigation

export function SupervisorView() {
    const { currentUser, workers, getWorkerAttendance, isLoading, error } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Filter workers by area
    const myWorkers = workers.filter((w) => w.areaId === currentUser?.areaId);

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
                    <h2 className="text-xl font-bold text-gray-900">قائمة العمال - {currentUser?.name}</h2>
                    <p className="text-gray-500 text-sm">إدارة الحضور الشهري</p>
                </div>
                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myWorkers.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-gray-400">
                        لا يوجد عمال في هذه المنطقة
                    </div>
                ) : (
                    myWorkers.map((worker) => {
                        const record = getWorkerAttendance(worker.id, month, year);
                        const isFilled = !!record;

                        return (
                            <Card key={worker.id} className={`hover:shadow-md transition-shadow relative overflow-hidden ${isFilled ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}`}>
                                {isFilled && (
                                    <div className="absolute top-2 left-2">
                                        <CheckCircle className="text-green-600 h-5 w-5" />
                                    </div>
                                )}
                                <CardHeader className="pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-blue-100 p-2 rounded-full">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{worker.name}</CardTitle>
                                            <div className="text-xs text-gray-500">رقم: {worker.id}</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center mt-2">
                                        <Badge variant={isFilled ? "success" : "secondary"}>
                                            {isFilled ? "تم الإدخال" : "بانتظار الإدخال"}
                                        </Badge>

                                        <Link href={`/dashboard/entry/${worker.id}?month=${month}&year=${year}`}>
                                            <Button size="sm" variant={isFilled ? "outline" : "default"}>
                                                {isFilled ? "تعديل" : "إدخال"}
                                            </Button>
                                        </Link>
                                    </div>
                                    {isFilled && (
                                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 grid grid-cols-2 gap-2">
                                            <span>أيام العمل: <b>{record.normalDays}</b></span>
                                            <span>المحسوب: <b>{record.totalCalculatedDays}</b></span>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
