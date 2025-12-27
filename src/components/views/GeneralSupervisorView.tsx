"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Button } from "../ui/button";
import { MobileNav } from "../ui/mobile-nav";
import {
    Search,
    Printer,
    ShieldCheck,
    Loader2,
    CheckCircle,
    Menu
} from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import Image from "next/image";

export function GeneralSupervisorView() {
    const { currentUser, workers, attendanceRecords, areas, approveAttendance, rejectAttendance, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'اعتمادات المراقبين', icon: ShieldCheck },
        { id: 'print', label: 'طباعة كشف', icon: Printer },
    ];
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

    // Stable print metadata - generated on mount to fix purity lint errors
    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `GS-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

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
        const confirmBulk = confirm(`هل أنت متأكد من اعتماد ${ids.length} سجلات دفعة واحدة؟`);
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
        <>
            <MobileNav
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab="overview"
                onTabChange={(id) => id === 'print' ? window.print() : null}
                user={{ name: currentUser?.name || "المراقب العام", role: "مراقب عام البلدية" }}
            />

            <div className="space-y-6 pb-24 print:hidden">
                {/* Header & Month Picker - Sticky and Glassmorphic */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/30">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="text-right">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">المراقب العام</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider text-right">{currentUser?.name}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="hidden md:flex gap-2 text-indigo-600 hover:bg-indigo-50 px-3 rounded-xl border border-transparent font-black"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="text-xs">طباعة الشعار</span>
                            </Button>

                            <div className="hidden md:block">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>

                            {/* Mobile Menu Trigger */}
                            <button
                                onClick={() => setIsMobileNavOpen(true)}
                                className="md:hidden p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm active:scale-95 transition-all"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile Date Picker Bar */}
                    <div className="md:hidden mt-3 px-1">
                        <div className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner w-full">
                            <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid - Mobile Optimized */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 px-1 fill-mode-both animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
                    <div className="relative col-span-2 md:col-span-1 border-none shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100/30 ring-1 ring-indigo-100 rounded-2xl overflow-hidden group p-5 flex items-center gap-5 transition-all duration-300 hover:shadow-md">
                        {/* Background Watermark Icon */}
                        <CheckCircle className="absolute -bottom-2 -right-2 h-20 w-20 opacity-[0.08] text-indigo-600 rotate-12 group-hover:scale-110 transition-transform duration-500" />

                        <div className="relative z-10 bg-white/80 backdrop-blur-sm p-4 rounded-xl text-indigo-600 shadow-sm border border-indigo-50 group-hover:scale-110 transition-transform">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1">بانتظار اعتمادك</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black text-indigo-900 leading-none">{filteredRecords.length}</p>
                                <p className="text-xs text-indigo-400 font-bold uppercase">كشف متبقي</p>
                            </div>
                        </div>
                    </div>
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
                <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mx-1 animate-in fade-in duration-1000 fill-mode-both">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-5">العامل</th>
                                    <th className="p-5">المنطقة</th>
                                    <th className="p-5 text-center">أيام الدوام</th>
                                    <th className="p-5 text-center">الإضافي (ع/هـ/ع)</th>
                                    <th className="p-5 text-center font-black">الإجمالي</th>
                                    <th className="p-5 text-center">الاعتماد</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-4 opacity-30 select-none">
                                                <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                                    <Search className="h-10 w-10 text-slate-400" />
                                                </div>
                                                <p className="font-black text-xl italic tracking-tight text-slate-900 uppercase">لا توجد سجلات</p>
                                                <p className="text-sm font-bold text-slate-500">تم اعتماد جميع الكشوفات المعلقة لهذا الشهر.</p>
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
                                                    <div className="flex flex-col text-right">
                                                        <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{worker?.name}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono tracking-tighter">ID: {worker?.id}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="inline-flex items-center px-3 py-1 bg-white/60 text-slate-600 rounded-full text-[10px] font-black border border-slate-100 uppercase tracking-tighter">
                                                        {areaName}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center font-black text-slate-700">{record.normalDays}</td>
                                                <td className="p-5 text-center">
                                                    <div className="flex justify-center items-center gap-1.5">
                                                        <span className="text-[11px] font-black text-indigo-600 bg-white/80 px-2 py-0.5 rounded-lg border border-indigo-50 ring-1 ring-indigo-50/50">
                                                            {record.overtimeNormalDays} / {record.overtimeHolidayDays} / {record.overtimeEidDays}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-flex items-center justify-center min-w-[3rem] h-10 px-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-700 font-black text-lg shadow-inner border border-indigo-100/30">
                                                        {record.totalCalculatedDays}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(record.id)}
                                                            disabled={approvingIds.has(record.id)}
                                                            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                                        >
                                                            {approvingIds.has(record.id) ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                "اعتماد"
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleReject(record.id)}
                                                            disabled={rejectingIds.has(record.id) || approvingIds.has(record.id)}
                                                            className="h-9 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
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

            </div>

            {/* Printable Area - Standardized Official Layout */}
            <div className="hidden print:block font-sans">
                <div className="text-center mb-10 border-b-[6px] border-emerald-700 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">اعتماد كشوفات المراقب العام</h1>
                            <p className="text-gray-600">الشهر: {month} / {year} | المراقب العام: {currentUser?.name}</p>
                            <p className="text-sm mt-1 text-emerald-600 font-bold uppercase">الإدارة العامة للرقابة</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">تقرير تدقيق ومراجعة المراقب العام</h1>
                    <div className="flex justify-center gap-12 mt-4 text-slate-600 font-black">
                        <p>الشهر: <span className="text-emerald-700">{month}</span></p>
                        <p>السنة: <span className="text-emerald-700">{year}</span></p>
                        <p>المراقب العام: <span className="text-emerald-700">{currentUser?.name}</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-3 text-right">م</th>
                            <th className="border-2 border-slate-900 p-3 text-right">اسم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أيام عادية</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">إضافي عادي (0.5)</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">إضافي عطل (1.0)</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">أيام أعياد (1.0)</th>
                            <th className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50">إجمالي الأيام</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record, index) => {
                            const worker = workers.find(w => w.id === record.workerId);
                            const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                            return (
                                <tr key={record.id} className="border-b-2 border-slate-400">
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                    <td className="border-2 border-slate-900 p-3 font-black">{worker?.name}</td>
                                    <td className="border-2 border-slate-900 p-3">{areaName}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record.normalDays}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record.overtimeNormalDays}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record.overtimeHolidayDays}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record.overtimeEidDays || 0}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50">{record.totalCalculatedDays}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">توقيع المراقب العام</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">تدقيق الدائرة الصحية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد عطوفة العمدة</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم رئاسة البلدية</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest">
                        نظام تأييد الدوام الذكي - التاريخ: {printMetadata.date} - الرقم المرجعي: {printMetadata.ref}
                    </p>
                </div>
            </div>
        </>
    );
}
