"use client";

import React, { useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAttendance } from "@/context/AttendanceContext";
import { Worker } from "@/types";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Save, Calculator, User, Calendar, Minus, Plus, HardHat, Lock, AlertCircle } from "lucide-react";

export default function EntryPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { workers, getWorkerAttendance, saveAttendance, currentUser } = useAttendance();

    const workerId = params.id as string;
    const month = Number(searchParams.get("month"));
    const year = Number(searchParams.get("year"));

    const worker = workers.find((w: Worker) => w.id === workerId);

    // Form State
    const [formData, setFormData] = useState({
        normalDays: 0,
        otNormal: 0,
        otHoliday: 0,
        otEid: 0
    });

    // Memoized setters for formData fields (moved to top level)
    const setNormalDays = useCallback((value: number) => {
        setFormData(prev => ({ ...prev, normalDays: value }));
    }, [setFormData]);

    const setOtNormal = useCallback((value: number) => {
        setFormData(prev => ({ ...prev, otNormal: value }));
    }, [setFormData]);

    const setOtHoliday = useCallback((value: number) => {
        setFormData(prev => ({ ...prev, otHoliday: value }));
    }, [setFormData]);

    const setOtEid = useCallback((value: number) => {
        setFormData(prev => ({ ...prev, otEid: value }));
    }, [setFormData]);

    // Sync state with existing data (Render-time synchronization)
    const [lastSyncedKey, setLastSyncedKey] = useState<string | null>(null);
    const currentRecord = worker ? getWorkerAttendance(worker.id, month, year) : undefined;
    const syncKey = currentRecord
        ? `${currentRecord.id}-${currentRecord.updatedAt}`
        : `empty-${workerId}-${month}-${year}`;

    if (syncKey !== lastSyncedKey) {
        setLastSyncedKey(syncKey);
        if (currentRecord) {
            setFormData({
                normalDays: currentRecord.normalDays,
                otNormal: currentRecord.overtimeNormalDays,
                otHoliday: currentRecord.overtimeHolidayDays,
                otEid: currentRecord.overtimeEidDays || 0
            });
        } else {
            setFormData({ normalDays: 0, otNormal: 0, otHoliday: 0, otEid: 0 });
        }
    }

    if (!worker || !month || !year) {
        return <div className="p-10 text-center">بيانات غير صحيحة</div>;
    }

    const { normalDays, otNormal, otHoliday, otEid } = formData;
    const calculatedTotal = normalDays + (otNormal * 0.5) + (otHoliday * 1.0) + (otEid * 1.0);

    // Determine if editing is allowed based on role and status
    const canEdit = (() => {
        if (!currentRecord) return true; // New record, can edit
        const { status } = currentRecord;

        // General rule: No one but Admin can edit APPROVED records
        if (status === 'APPROVED' && currentUser?.role !== 'ADMIN') return false;

        if (currentUser?.role === 'SUPERVISOR') {
            return status === 'PENDING_SUPERVISOR'; // Only if rejected back to them
        }
        if (currentUser?.role === 'GENERAL_SUPERVISOR') {
            return status === 'PENDING_GS';
        }
        if (currentUser?.role === 'HEALTH_DIRECTOR') {
            return status === 'PENDING_HEALTH';
        }
        if (currentUser?.role === 'HR') {
            return status === 'PENDING_HR';
        }
        if (currentUser?.role === 'INTERNAL_AUDIT') {
            return status === 'PENDING_AUDIT';
        }
        if (currentUser?.role === 'FINANCE') {
            return status === 'PENDING_FINANCE';
        }
        if (currentUser?.role === 'PAYROLL') {
            return status === 'PENDING_PAYROLL';
        }
        if (currentUser?.role === 'ADMIN') {
            return true; // Admin can always edit (Technical Admin)
        }
        return false;
    })();

    const getStatusMessage = () => {
        if (!currentRecord) return null;
        const { status } = currentRecord;

        if (currentUser?.role === 'SUPERVISOR' && status !== 'PENDING_SUPERVISOR') {
            return 'تم رفع السجل للمراجعة. لا يمكن التعديل إلا في حال إعادته إليك.';
        }
        if (status === 'APPROVED') {
            return 'تم اعتماد هذا السجل نهائياً. لا يمكن التعديل بعد اعتماد قسم الرواتب.';
        }
        if (!canEdit) {
            return 'السجل في مرحلة تدقيقية أخرى. التعديل غير متاح حالياً لصلاحياتك.';
        }
        return null;
    };

    const statusMessage = getStatusMessage();

    const handleSave = () => {
        saveAttendance({
            workerId: worker.id,
            month,
            year,
            normalDays,
            overtimeNormalDays: otNormal,
            overtimeHolidayDays: otHoliday,
            overtimeEidDays: otEid,
            status: 'PENDING_GS',
            rejectionNotes: undefined // Clear the notes on resubmission
        });
        router.push("/dashboard");
    };

    // Calculate days in current month for the limit
    const daysInMonth = new Date(year, month, 0).getDate();

    // Moved hooks up

    const handleIncrement = (setter: (value: number) => void, val: number, max: number) => {
        if (val < max) setter(val + 1);
    };

    const handleDecrement = (setter: (value: number) => void, val: number) => {
        if (val > 0) setter(val - 1);
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 pb-20 font-sans" dir="rtl">
            <Header />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Back Button */}
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-white dark:hover:bg-slate-900 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all gap-2 px-0"
                    onClick={() => router.back()}
                >
                    <ArrowRight className="h-4 w-4" />
                    العودة للوحة الإشراف
                </Button>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    {/* Main Form Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="border-none shadow-xl shadow-blue-900/5 dark:shadow-none overflow-hidden rounded-3xl bg-white dark:bg-slate-900/40 backdrop-blur-md">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
                                <div className="flex items-center gap-4">
                                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                                        <User className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black">{worker.name}</CardTitle>
                                        <div className="flex items-center gap-2 mt-1 text-blue-100 text-sm font-medium">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>سجل حضور شهر {month} / {year}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-10">
                                {/* Edit Prevention Notice */}
                                {!canEdit && statusMessage && (
                                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-start gap-4">
                                        <div className="bg-red-100 p-3 rounded-xl text-red-600">
                                            <Lock className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-red-900 text-lg mb-1">السجل معتمد - التعديل غير مسموح</h3>
                                            <p className="text-sm text-red-700">{statusMessage}</p>
                                        </div>
                                    </div>
                                )}
                                {/* Rejection Notes from Management */}
                                {canEdit && currentRecord?.status === 'PENDING_SUPERVISOR' && currentRecord.rejectionNotes && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-2xl p-6 flex items-start gap-4 animate-in fade-in slide-in-from-top-4">
                                        <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-xl text-amber-600 dark:text-amber-400">
                                            <AlertCircle className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-amber-900 dark:text-amber-200 text-lg mb-1 italic underline underline-offset-4">سبب الإعادة للتصحيح:</h3>
                                            <p className="text-gray-800 dark:text-slate-200 font-bold leading-relaxed bg-white/50 dark:bg-slate-800/50 p-3 rounded-xl border border-amber-100 dark:border-amber-800/50 mt-2">
                                                {currentRecord.rejectionNotes}
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {/* Entry Grid */}
                                <div className="space-y-8">
                                    {/* Normal Days Input */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50 dark:bg-slate-800/30 rounded-2xl border border-gray-100 dark:border-white/5 group hover:border-blue-100 dark:hover:border-blue-900/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-xl text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">أيام العمل العادية</h3>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">عدد أيام الحضور الفعلي في الموقع</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDecrement(setNormalDays, normalDays)} disabled={!canEdit}>
                                                <Minus className="h-5 w-5" />
                                            </Button>
                                            <Input
                                                id="normal-days"
                                                name="normalDays"
                                                aria-label="أيام العمل العادية"
                                                type="number"
                                                min={0}
                                                max={daysInMonth}
                                                value={normalDays}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setNormalDays(Math.min(val, daysInMonth));
                                                }}
                                                disabled={!canEdit}
                                                className="w-16 h-10 text-center text-xl font-black border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleIncrement(setNormalDays, normalDays, daysInMonth)} disabled={!canEdit}>
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* OT Normal Input */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-orange-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-orange-100 p-3 rounded-xl text-orange-600 group-hover:scale-110 transition-transform">
                                                <HardHat className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">إضافي (أيام عادية)</h3>
                                                <p className="text-sm text-gray-500">ساعات إضافية محتسبة بنصف يوم (x0.5)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDecrement(setOtNormal, otNormal)} disabled={!canEdit}>
                                                <Minus className="h-5 w-5" />
                                            </Button>
                                            <Input
                                                id="ot-normal"
                                                name="otNormal"
                                                aria-label="إضافي (أيام عادية)"
                                                type="number"
                                                min={0}
                                                max={31}
                                                value={otNormal}
                                                onChange={(e) => setOtNormal(parseInt(e.target.value) || 0)}
                                                disabled={!canEdit}
                                                className="w-16 h-10 text-center text-xl font-black border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleIncrement(setOtNormal, otNormal, 31)} disabled={!canEdit}>
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* OT Holiday Input */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-purple-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-purple-100 p-3 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                                                <Calculator className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">إضافي (عطل وجمع)</h3>
                                                <p className="text-sm text-gray-500">ساعات إضافية محتسبة بيوم كامل (x1.0)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDecrement(setOtHoliday, otHoliday)} disabled={!canEdit}>
                                                <Minus className="h-5 w-5" />
                                            </Button>
                                            <Input
                                                id="ot-holiday"
                                                name="otHoliday"
                                                aria-label="إضافي (عطل وجمع)"
                                                type="number"
                                                min={0}
                                                max={31}
                                                value={otHoliday}
                                                onChange={(e) => setOtHoliday(parseInt(e.target.value) || 0)}
                                                disabled={!canEdit}
                                                className="w-16 h-10 text-center text-xl font-black border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleIncrement(setOtHoliday, otHoliday, 31)} disabled={!canEdit}>
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* OT Eid Input */}
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-green-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-green-100 p-3 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                                                <Calendar className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">أيام الأعياد</h3>
                                                <p className="text-sm text-gray-500">أيام العطل الرسمية والأعياد (x1.0)</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl" onClick={() => handleDecrement(setOtEid, otEid)} disabled={!canEdit}>
                                                <Minus className="h-5 w-5" />
                                            </Button>
                                            <Input
                                                id="ot-eid"
                                                name="otEid"
                                                aria-label="أيام الأعياد"
                                                type="number"
                                                min={0}
                                                max={10}
                                                value={otEid}
                                                onChange={(e) => setOtEid(parseInt(e.target.value) || 0)}
                                                disabled={!canEdit}
                                                className="w-16 h-10 text-center text-xl font-black border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl" onClick={() => handleIncrement(setOtEid, otEid, 10)} disabled={!canEdit}>
                                                <Plus className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="bg-gray-50 p-8 flex flex-col sm:flex-row gap-4 justify-between border-t border-gray-100">
                                <Button
                                    variant="outline"
                                    onClick={() => router.back()}
                                    className="w-full sm:w-auto px-8 rounded-2xl h-12 text-gray-500 font-bold border-gray-200"
                                >
                                    إلغاء
                                </Button>
                                <Button
                                    onClick={handleSave}
                                    disabled={!canEdit}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 px-12 rounded-2xl h-12 text-white font-black shadow-lg shadow-blue-200 gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="h-5 w-5" />
                                    {canEdit ? 'حفظ السجل' : 'لا يمكن التعديل'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* Summary Sidebar */}
                    <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24">
                        <Card className="border-none shadow-xl shadow-blue-900/5 rounded-3xl overflow-hidden">
                            <CardHeader className="bg-white border-b border-gray-50 p-6">
                                <CardTitle className="text-lg font-black text-gray-900 flex items-center gap-2">
                                    <Calculator className="h-5 w-5 text-blue-600" />
                                    ملخص العملية الحسابية
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                        <span className="text-gray-500">أيام عادية</span>
                                        <span className="font-bold text-gray-900">{normalDays}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                        <span className="text-gray-500">إضافي عادي (x0.5)</span>
                                        <span className="font-bold text-orange-600">+{otNormal * 0.5}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-gray-50">
                                        <span className="text-gray-500">إضافي عطل (x1.0)</span>
                                        <span className="font-bold text-purple-600">+{otHoliday}</span>
                                    </div>
                                    <div className="flex justify-between text-sm py-2">
                                        <span className="text-gray-500">أيام أعياد (x1.0)</span>
                                        <span className="font-bold text-green-600">+{otEid}</span>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-blue-600 dark:bg-blue-700 rounded-3xl text-white text-center shadow-lg shadow-blue-100 dark:shadow-none">
                                    <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mb-1">الإجمالي المستحق</p>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-4xl font-black">{calculatedTotal}</span>
                                        <span className="text-sm font-medium opacity-80 italic">يوم</span>
                                    </div>
                                </div>

                                <div className="mt-6 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    * يتم حساب المجموع بناءً على القواعد التنظيمية المعتمدة في النظام للعمل الإضافي والعطلات الرسمية.
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
