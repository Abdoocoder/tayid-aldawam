"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Badge } from "../ui/badge";
import {
    CreditCard,
    Search,
    DollarSign,
    Printer,
    Users,
    CheckCircle,
    Loader2,
    Menu,
    LayoutGrid
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "../ui/mobile-nav";
import { resolveAreaNames } from "@/lib/utils";

export function PayrollView() {
    const { currentUser, workers, getWorkerAttendance, isLoading, error, areas, approveAttendance, rejectAttendance } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<'PENDING_PAYROLL' | 'APPROVED'>('PENDING_PAYROLL');
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
    const [selectedNationality, setSelectedNationality] = useState(currentUser?.handledNationality || "ALL");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Filter workers based on search and area
    const payrollRecords = workers.map(w => {
        const record = getWorkerAttendance(w.id, month, year);
        const isApproved = record?.status === 'APPROVED';
        const areaName = resolveAreaNames(w.areaId, areas);

        // Calculate cost breakdown
        const normalCost = record ? record.normalDays * w.dayValue : 0;
        const overtimeNormalCost = record ? record.overtimeNormalDays * 0.5 * w.dayValue : 0;
        const overtimeHolidayCost = record ? record.overtimeHolidayDays * w.dayValue : 0;
        const overtimeEidCost = record ? (record.overtimeEidDays || 0) * w.dayValue : 0;
        const totalAmount = normalCost + overtimeNormalCost + overtimeHolidayCost + overtimeEidCost;

        return {
            worker: w,
            record,
            isApproved,
            areaName,
            totalAmount,
            normalCost,
            overtimeNormalCost,
            overtimeHolidayCost,
            overtimeEidCost
        };
    }).filter(p => {
        const matchesSearch = p.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.worker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.areaName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = p.record?.status === statusFilter;
        const matchesNationality = selectedNationality === "ALL" || p.worker.nationality === selectedNationality;
        return matchesStatus && matchesSearch && matchesNationality;
    });

    const handleApprove = async (recordId: string) => {
        setApprovingIds(prev => new Set(prev).add(recordId));
        try {
            await approveAttendance(recordId, 'APPROVED');
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
        const reason = prompt("يرجى كتابة سبب إعادة السجل للمدير المالي:");
        if (!reason) return;

        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
            await rejectAttendance(recordId, 'PENDING_FINANCE', reason);
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

    // Stats
    const stats = useMemo(() => {
        let total = 0;
        let totalDays = 0;
        let workersCount = 0;

        workers.forEach(w => {
            const r = getWorkerAttendance(w.id, month, year);
            // Count stats for APPROVED records only to show finalized amount
            if (r && r.status === 'APPROVED') {
                total += (r.totalCalculatedDays * w.dayValue);
                totalDays += r.totalCalculatedDays;
                workersCount++;
            }
        });

        return {
            totalAmount: total,
            totalDays: totalDays,
            workersCount: workersCount,
            avgSalary: workersCount > 0 ? total / workersCount : 0
        };
    }, [workers, getWorkerAttendance, month, year]);

    const navItems = [
        { id: 'PENDING_PAYROLL', label: 'صرف الرواتب', icon: CreditCard },
        { id: 'APPROVED', label: 'تم الصرف', icon: CheckCircle },
    ];

    if (isLoading) {
        return <div className="p-10 text-center">جاري تحميل قسم الرواتب...</div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-600">حدث خطأ: {error}</div>;
    }

    return (
        <>
            <MobileNav
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab="overview"
                onTabChange={(id) => id === 'report' ? window.print() : null}
                user={{ name: currentUser?.name || "مسؤول الرواتب", role: "قسم الرواتب" }}
            />

            <div className="space-y-6 pb-24 print:hidden">
                {/* Header */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-emerald-600 to-teal-600 p-2.5 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                                <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">قسم الرواتب</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">صرف المستحقات النهائية</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden md:block bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>
                            <button onClick={() => setIsMobileNavOpen(true)} className="md:hidden p-2.5 bg-white border border-slate-200 rounded-2xl">
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'إجمالي المصرت', value: stats.totalAmount.toLocaleString(), unit: 'د.أ', icon: DollarSign, gradient: 'from-emerald-600 to-teal-700' },
                        { label: 'تم الصرف لـ', value: stats.workersCount, unit: 'عامل', icon: Users, gradient: 'from-blue-600 to-indigo-700' },
                    ].map((kpi, i) => (
                        <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-[2rem] p-5 text-white shadow-lg`}>
                            <div className="relative z-10">
                                <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-0.5">{kpi.label}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black tracking-tighter">{kpi.value}</span>
                                    <span className="text-[9px] font-bold text-white/60 uppercase">{kpi.unit}</span>
                                </div>
                            </div>
                            <kpi.icon className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 -rotate-12" />
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            id="payroll-search"
                            name="payrollSearch"
                            aria-label="بحث في السجلات"
                            placeholder="بحث..."
                            className="pr-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        id="payroll-status-filter"
                        name="payrollStatusFilter"
                        aria-label="تصفية حسب حالة الصرف"
                        className="h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm px-4 font-bold text-slate-700"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as 'PENDING_PAYROLL' | 'APPROVED')}
                    >
                        <option value="PENDING_PAYROLL">⏱️ بانتظار الصرف</option>
                        <option value="APPROVED">✅ تم الصرف</option>
                    </select>

                    <select
                        id="payroll-nationality-filter"
                        name="payrollNationalityFilter"
                        aria-label="تصفية حسب الجنسية للرواتب"
                        className="h-12 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl shadow-sm px-4 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                        value={selectedNationality}
                        onChange={e => setSelectedNationality(e.target.value)}
                    >
                        <option value="ALL">جميع الجنسيات</option>
                        <option value="أردني">أردني</option>
                        <option value="مصري">مصري</option>
                    </select>
                    <Button variant="ghost" onClick={() => window.print()} className="h-12 px-6 text-purple-600 hover:bg-purple-50/80 rounded-2xl font-black gap-2 border border-purple-200 shadow-sm transition-all active:scale-95 hover:shadow-md">
                        <Printer className="h-4 w-4" /> <span className="hidden sm:inline">طباعة</span>
                    </Button>
                </div>

                {/* View Toggle */}
                <div className="flex bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/50">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            <span>جدول تفصيلي</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>بطاقات</span>
                        </div>
                    </button>
                </div>

                {/* Content Area */}
                {viewMode === 'table' ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                                        <th className="p-4 sticky right-0 bg-slate-50/95 backdrop-blur-md z-20 shadow-sm">الموظف</th>
                                        <th className="p-4 text-center">المنطقة</th>
                                        <th className="p-4 text-center bg-blue-50/50 text-blue-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>أيام العمل العادية</span>
                                                <span className="text-[9px] opacity-60 font-normal">عدد أيام الحضور الفعلي</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center bg-indigo-50/50 text-indigo-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>إضافي (أيام عادية)</span>
                                                <span className="text-[9px] opacity-60 font-normal">ساعات إضافية (x0.5)</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center bg-amber-50/50 text-amber-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>إضافي (عطل وجمع)</span>
                                                <span className="text-[9px] opacity-60 font-normal">ساعات إضافية (x1.0)</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center bg-rose-50/50 text-rose-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>أيام الأعياد</span>
                                                <span className="text-[9px] opacity-60 font-normal">عطل رسمية (x1.0)</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center font-extrabold text-emerald-900 bg-emerald-50/50">صافي المستحق</th>
                                        <th className="p-4 text-center">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payrollRecords.length === 0 ? (
                                        <tr><td colSpan={9} className="p-10 text-center text-slate-400 font-bold">لا يوجد سجلات</td></tr>
                                    ) : (
                                        payrollRecords.map(p => (
                                            <tr key={p.worker.id} className="hover:bg-slate-50/80 transition-all duration-300 group text-[11px] font-bold">
                                                <td className="p-4 sticky right-0 bg-inherit z-10 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                            {p.worker.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 text-xs">{p.worker.name}</div>
                                                            <div className="text-[9px] text-slate-400 font-mono">ID: {p.worker.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-slate-500">{p.areaName}</td>

                                                {/* Detailed Columns */}
                                                <td className="p-4 text-center bg-blue-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.normalDays || 0}</span>
                                                        <span className="text-[9px] text-blue-600 font-mono">{p.normalCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-indigo-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.overtimeNormalDays || 0}</span>
                                                        <span className="text-[9px] text-indigo-600 font-mono">{p.overtimeNormalCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-amber-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.overtimeHolidayDays || 0}</span>
                                                        <span className="text-[9px] text-amber-600 font-mono">{p.overtimeHolidayCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-rose-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.overtimeEidDays || 0}</span>
                                                        <span className="text-[9px] text-rose-600 font-mono">{p.overtimeEidCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center bg-emerald-50/30">
                                                    <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white border border-emerald-100 shadow-sm">
                                                        <span className="text-sm font-black text-emerald-700">{p.totalAmount.toLocaleString()}</span>
                                                        <span className="text-[8px] text-emerald-500 uppercase">دينار</span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {statusFilter === 'PENDING_PAYROLL' && p.record && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove(p.record!.id)}
                                                                    disabled={approvingIds.has(p.record.id)}
                                                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200 text-xs"
                                                                >
                                                                    {approvingIds.has(p.record.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : "صرف"}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleReject(p.record!.id)}
                                                                    disabled={rejectingIds.has(p.record.id)}
                                                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50 rounded-xl"
                                                                >
                                                                    {rejectingIds.has(p.record.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : "إعادة"}
                                                                </Button>
                                                            </>
                                                        )}
                                                        {statusFilter === 'APPROVED' && (
                                                            <Badge className="bg-emerald-100 text-emerald-800">تم الصرف</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {payrollRecords.map((p) => (
                            <div key={p.worker.id} className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-white shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black shadow-inner">
                                            {p.worker.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900">{p.worker.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{p.areaName}</p>
                                        </div>
                                    </div>
                                    <Badge className={`font-black text-[9px] px-2 py-0.5 ${statusFilter === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {statusFilter === 'APPROVED' ? 'تم الصرف' : 'معلق'}
                                    </Badge>
                                </div>

                                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <div className="flex justify-between items-start text-slate-700 pb-3 border-b border-slate-200/50">
                                        <div>
                                            <p className="font-bold text-sm">أيام العمل العادية</p>
                                            <p className="text-[10px] text-slate-400">عدد أيام الحضور الفعلي في الموقع</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.normalDays || 0}</span>
                                            <span className="text-[10px] text-blue-600 font-mono font-bold">{p.normalCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-slate-700 pb-3 border-b border-slate-200/50">
                                        <div>
                                            <p className="font-bold text-sm">إضافي (أيام عادية)</p>
                                            <p className="text-[10px] text-slate-400">ساعات إضافية محتسبة بنصف يوم (x0.5)</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.overtimeNormalDays || 0}</span>
                                            <span className="text-[10px] text-indigo-600 font-mono font-bold">{p.overtimeNormalCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-slate-700 pb-3 border-b border-slate-200/50">
                                        <div>
                                            <p className="font-bold text-sm">إضافي (عطل وجمع)</p>
                                            <p className="text-[10px] text-slate-400">ساعات إضافية محتسبة بيوم كامل (x1.0)</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.overtimeHolidayDays || 0}</span>
                                            <span className="text-[10px] text-amber-600 font-mono font-bold">{p.overtimeHolidayCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-slate-700">
                                        <div>
                                            <p className="font-bold text-sm">أيام الأعياد</p>
                                            <p className="text-[10px] text-slate-400">أيام العطل الرسمية والأعياد (x1.0)</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.overtimeEidDays || 0}</span>
                                            <span className="text-[10px] text-rose-600 font-mono font-bold">{p.overtimeEidCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">صافي المستحق</span>
                                        <span className="text-xl font-black text-slate-900">{p.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">د.أ</span></span>
                                    </div>

                                    <div className="flex gap-2">
                                        {statusFilter === 'PENDING_PAYROLL' && p.record && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(p.record!.id)}
                                                    disabled={approvingIds.has(p.record.id)}
                                                    className="h-9 w-9 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200/50"
                                                >
                                                    {approvingIds.has(p.record.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleReject(p.record!.id)}
                                                    disabled={rejectingIds.has(p.record.id)}
                                                    className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50 rounded-xl"
                                                >
                                                    {rejectingIds.has(p.record.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "↩"}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Print View */}
            <div className="hidden print:block">
                <div className="text-center mb-10 border-b-4 border-slate-900 pb-8">
                    <h1 className="text-3xl font-black">كشف صرف الرواتب النهائي</h1>
                    <p className="mt-2 text-lg">الشهر: {month} / {year}</p>
                </div>
                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-200 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-2">م</th>
                            <th className="border-2 border-slate-900 p-2">الاسم</th>
                            <th className="border-2 border-slate-900 p-2">القطاع</th>
                            <th className="border-2 border-slate-900 p-2">الصافي</th>
                            <th className="border-2 border-slate-900 p-2">التوقيع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payrollRecords.map((p, i) => (
                            <tr key={i} className="border-b border-slate-400">
                                <td className="border-2 border-slate-900 p-2 text-center">{i + 1}</td>
                                <td className="border-2 border-slate-900 p-2 font-bold">{p.worker.name}</td>
                                <td className="border-2 border-slate-900 p-2 text-center">{p.areaName}</td>
                                <td className="border-2 border-slate-900 p-2 text-center font-black">{p.totalAmount}</td>
                                <td className="border-2 border-slate-900 p-2"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="flex justify-between mt-20 px-20">
                    <div className="text-center font-bold">
                        <p>أمين الصندوق / مسؤول الرواتب</p>
                        <div className="h-20 mt-4 border-b border-slate-400 w-48 mx-auto"></div>
                    </div>
                    <div className="text-center font-bold">
                        <p>المدير المالي</p>
                        <div className="h-20 mt-4 border-b border-slate-400 w-48 mx-auto"></div>
                    </div>
                </div>
            </div>
        </>
    );
}
