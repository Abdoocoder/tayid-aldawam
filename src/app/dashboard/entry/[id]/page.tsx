"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAttendance } from "@/context/AttendanceContext";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Calculator } from "lucide-react";

export default function EntryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { workers, getWorkerAttendance, saveAttendance } = useAttendance();

    const workerId = params.id as string;
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const worker = workers.find((w) => w.id === workerId);

    // Form State
    const [normalDays, setNormalDays] = useState(0);
    const [otNormal, setOtNormal] = useState(0);
    const [otHoliday, setOtHoliday] = useState(0);

    // Load existing data
    useEffect(() => {
        if (worker && month && year) {
            const record = getWorkerAttendance(worker.id, month, year);
            if (record) {
                setNormalDays(record.normalDays);
                setOtNormal(record.overtimeNormalDays);
                setOtHoliday(record.overtimeHolidayDays);
            } else {
                // Default: Assume full attendance? Or 0?
                // SRS says "Entry". Usually better to start 0 or maybe auto-fill normal days?
                // Let's start 0 for safety.
                setNormalDays(0);
                setOtNormal(0);
                setOtHoliday(0);
            }
        }
    }, [worker, month, year, getWorkerAttendance]); // Depend on getWorkerAttendance stable ref

    if (!worker || !month || !year) {
        return <div className="p-10 text-center">بيانات غير صحيحة</div>;
    }

    const calculatedTotal = normalDays + (otNormal * 0.5) + (otHoliday * 1.0);

    const handleSave = () => {
        saveAttendance({
            workerId: worker.id,
            month,
            year,
            normalDays,
            overtimeNormalDays: otNormal,
            overtimeHolidayDays: otHoliday
        });
        router.push("/dashboard"); // Return to list
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-10">
            <Header />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                    <ArrowRight className="ml-2 h-4 w-4" />
                    رجوع للقائمة
                </Button>

                <Card>
                    <CardHeader className="border-b border-gray-100 bg-gray-50/50">
                        <CardTitle>إدخال الحضور: {worker.name}</CardTitle>
                        <p className="text-sm text-gray-500">الفترة: {month} / {year}</p>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">

                        <div className="grid gap-4">
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">أيام العمل العادية</label>
                                    <Input
                                        type="number"
                                        min={0}
                                        max={31}
                                        value={normalDays}
                                        onChange={(e) => setNormalDays(Number(e.target.value))}
                                        className="font-mono text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">إضافي (أيام عادية)</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={31}
                                            value={otNormal}
                                            onChange={(e) => setOtNormal(Number(e.target.value))}
                                            className="font-mono text-lg pl-12"
                                        />
                                        <span className="absolute left-3 top-2.5 text-xs bg-gray-100 px-1 rounded text-gray-500">x 0.5</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">إضافي (عطل/جمع)</label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            min={0}
                                            max={10}
                                            value={otHoliday}
                                            onChange={(e) => setOtHoliday(Number(e.target.value))}
                                            className="font-mono text-lg pl-12"
                                        />
                                        <span className="absolute left-3 top-2.5 text-xs bg-gray-100 px-1 rounded text-gray-500">x 1.0</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg flex items-center justify-between border border-blue-100">
                            <div className="flex items-center gap-2 text-blue-800">
                                <Calculator className="h-5 w-5" />
                                <span className="font-semibold">المجموع المحتسب</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-700 font-mono">
                                {calculatedTotal} <span className="text-sm font-normal text-blue-600">يوم</span>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                        <Button variant="outline" onClick={() => router.back()}>إلغاء</Button>
                        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 min-w-[120px]">
                            <Save className="ml-2 h-4 w-4" />
                            حفظ البيانات
                        </Button>
                    </CardFooter>
                </Card>
            </main>
        </div>
    );
}
