"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Badge } from "../ui/badge";
import Image from "next/image"; // Added import for Image
import {
    Banknote,
    AlertCircle,
    Download,
    Search,
    DollarSign,
    Printer,
    Users,
    Calendar,
    TrendingUp,
    CheckCircle,
    Loader2,
    Clock,
    Menu
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "../ui/mobile-nav";

export function FinanceView() {
    const { currentUser, workers, getWorkerAttendance, isLoading, error, areas, approveAttendance, rejectAttendance } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<'PENDING_FINANCE' | 'APPROVED'>('PENDING_FINANCE');
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Filter workers based on search and area
    const approvedPayrolls = workers.map(w => {
        const record = getWorkerAttendance(w.id, month, year);
        const isApproved = record?.status === 'APPROVED';
        const areaName = areas.find(a => a.id === w.areaId)?.name || "غير محدد";

        return {
            worker: w,
            record,
            isApproved,
            areaName,
            totalAmount: record ? record.totalCalculatedDays * w.dayValue : 0
        };
    }).filter(p => {
        const matchesSearch = p.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.worker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.areaName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = areaFilter === "ALL" || p.worker.areaId === areaFilter;
        const matchesStatus = p.record?.status === statusFilter;
        return matchesStatus && matchesSearch && matchesArea;
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
        if (!confirm("هل أنت متأكد من رفض هذا السجل وإعادته؟")) return;
        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
            await rejectAttendance(recordId, 'PENDING_HR');
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

    // Stats calculations based on all workers for the selected month
    const stats = useMemo(() => {
        let total = 0;
        let totalDays = 0;
        let workersWithRecord = 0;

        workers.forEach(w => {
            const r = getWorkerAttendance(w.id, month, year);
            if (r && r.status === 'APPROVED') {
                total += (r.totalCalculatedDays * w.dayValue);
                totalDays += r.totalCalculatedDays;
                workersWithRecord++;
            }
        });

        return {
            totalAmount: total,
            totalDays: totalDays,
            workersCount: workersWithRecord,
            avgSalary: workersWithRecord > 0 ? total / workersWithRecord : 0
        };
    }, [workers, getWorkerAttendance, month, year]);

    // Stable print metadata - generated on mount to fix purity lint errors
    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

    const navItems = [
        { id: 'PENDING_FINANCE', label: 'بانتظار الاعتماد المالي', icon: Clock },
        { id: 'APPROVED', label: 'الكشوف المعتمدة', icon: CheckCircle },
    ];

    const handleExportCSV = () => {
        const headers = ["الرقم", "الاسم", "القطاع", "الأيام المحتسبة", "قيمة اليوم", "الصافي المستحق"];
        const rows = approvedPayrolls.map(p => [
            p.worker.id,
            p.worker.name,
            p.areaName,
            p.record ? p.record.totalCalculatedDays : 0,
            p.worker.dayValue,
            p.totalAmount.toFixed(2)
        ]);

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <div className="relative">
                        <div className="h-16 w-16 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mx-auto"></div>
                        <Banknote className="h-6 w-6 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-gray-500 font-bold animate-pulse">جاري جلب البيانات المالية...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px] p-6">
                <div className="text-center space-y-4 bg-red-50 p-8 rounded-3xl border border-red-100 max-w-md w-full shadow-xl shadow-red-900/5">
                    <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <p className="text-red-900 font-black text-xl mb-1">عذراً، حدث خطأ</p>
                        <p className="text-red-600 text-sm leading-relaxed">{error}</p>
                    </div>
                    <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100 rounded-xl" onClick={() => window.location.reload()}>
                        إعادة المحاولة
                    </Button>
                </div>
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
                onTabChange={(id) => id === 'report' ? window.print() : null}
                user={{ name: currentUser?.name || "مدير المالية", role: "الدائرة المالية" }}
            />

            <div className="space-y-6 pb-24 print:hidden">
                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-amber-600 to-yellow-600 p-2.5 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">الإدارة المالية</h2>
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black uppercase tracking-tighter">Certified</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تدقيق الرواتب والمستحقات</p>
                            </div>
                        </div>

                        {/* Desktop & Mobile Control */}
                        <div className="flex items-center gap-3">
                            <div className="hidden md:block bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
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
                </div>

                {/* Quick Stats Grid - New Pattern */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    {[
                        { label: 'إجمالي المستحقات', value: stats.totalAmount.toLocaleString(), unit: 'د.أ', icon: DollarSign, color: 'amber', trend: 'المعتمدة حالياً', gradient: 'from-amber-500/10 to-amber-600/5' },
                        { label: 'العمال المكتملين', value: stats.workersCount, unit: 'عامل', icon: Users, color: 'emerald', trend: 'جاهز للصرف', gradient: 'from-emerald-500/10 to-emerald-600/5' },
                        { label: 'صافي أيام العمل', value: stats.totalDays, unit: 'يوم', icon: Calendar, color: 'blue', trend: 'مجموع الساعات', gradient: 'from-blue-500/10 to-blue-600/5' },
                        { label: 'متوسط الأجور', value: stats.avgSalary.toFixed(1), unit: 'د.أ', icon: TrendingUp, color: 'indigo', trend: 'لكل عامل', gradient: 'from-indigo-500/10 to-indigo-600/5' }
                    ].map((stat, i) => (
                        <div key={i} className="relative group/card overflow-hidden">
                            <div className={`relative z-10 bg-white/60 backdrop-blur-xl p-5 rounded-2xl border border-white/40 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-${stat.color}-200/50 transition-all duration-500 hover:-translate-y-1`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm ring-1 ring-${stat.color}-100/50 group-hover/card:scale-110 transition-transform duration-500`}>
                                        <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
                                    </div>
                                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700 uppercase tracking-tighter shadow-sm border border-${stat.color}-100/50`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">{stat.unit}</span>
                                    </div>
                                </div>

                                {/* Large Watermark Icon */}
                                <div className={`absolute -left-2 -bottom-4 opacity-[0.08] group-hover/card:opacity-[0.12] transition-opacity duration-500`}>
                                    <stat.icon size={96} strokeWidth={2.5} className={`text-${stat.color}-600 rotate-12`} />
                                </div>

                                {/* Gradient Overlay */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover/card:opacity-100 transition-opacity duration-500`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Control Center - Floating Glassmorph */}
                <div className="flex flex-col lg:flex-row gap-3 px-1 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                        <Input
                            placeholder="بحث بالاسم أو الرقم أو القطاع..."
                            className="pr-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm text-base transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                        <select
                            className="hidden md:block h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[200px] outline-none px-4 transition-all"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as 'PENDING_FINANCE' | 'APPROVED')}
                        >
                            <option value="PENDING_FINANCE">📊 بانتظار الاعتماد المالي</option>
                            <option value="APPROVED">✅ الكشوف المعتمدة</option>
                        </select>

                        <div className="md:hidden flex-1">
                            <div className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner w-full">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>
                        </div>

                        <select
                            className="h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[160px] outline-none px-4 transition-all"
                            value={areaFilter}
                            onChange={e => setAreaFilter(e.target.value)}
                        >
                            <option value="ALL">🏢 جميع القطاعات</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 mr-auto lg:mr-0 lg:mr-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="h-12 px-6 text-blue-600 hover:bg-blue-50/80 rounded-2xl font-black gap-2 border border-blue-200 shadow-sm transition-all active:scale-95"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">نسخة ورقية</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportCSV}
                                className="h-12 px-6 text-emerald-600 hover:bg-emerald-50/80 rounded-2xl font-black gap-2 border border-emerald-200 shadow-sm transition-all active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">تصدير Excel</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payroll Table - Commercial Banking Aesthetic */}
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white overflow-hidden mx-1 animate-in fade-in duration-1000">
                    <div className="overflow-x-auto relative scrollbar-hide">
                        <table className="w-full text-right border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-slate-900/5 text-slate-500 text-[11px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                                    <th className="p-6 sticky right-0 bg-slate-50/95 backdrop-blur-md z-20 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">📝 الموظف المنتج</th>
                                    <th className="p-6 text-center">🏢 القطاع</th>
                                    <th className="p-6 text-center">📅 الأيام</th>
                                    <th className="p-6 text-center">💰 سعر اليوم</th>
                                    <th className="p-6 text-center bg-amber-500/10 text-amber-900 font-extrabold">💵 صافي المستحق</th>
                                    <th className="p-6 text-center">🔔 الحالة</th>
                                    <th className="p-6 text-center">⚡ الإجراء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {approvedPayrolls.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center text-slate-400 italic font-bold">
                                            لا توجد سجلات مالية مطابقة للبحث
                                        </td>
                                    </tr>
                                ) : (
                                    approvedPayrolls.map((p) => (
                                        <tr key={p.worker.id} className="hover:bg-amber-50/20 transition-all duration-300 group">
                                            <td className="p-5 sticky right-0 bg-inherit z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                                                <div className="font-black text-slate-800 group-hover:text-amber-700 transition-colors uppercase tracking-tight">{p.worker.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter uppercase font-bold opacity-60">ID: {p.worker.id}</div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="inline-flex items-center px-3 py-1 bg-slate-100/50 text-slate-600 rounded-full text-[11px] font-bold border border-slate-200/50">
                                                    {p.areaName}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center font-black text-slate-700 text-lg">{p.record?.totalCalculatedDays || "-"}</td>
                                            <td className="p-5 text-center font-bold text-slate-500 text-sm">
                                                {p.worker.dayValue.toLocaleString()} <span className="text-[10px] opacity-60 uppercase font-black">د.أ</span>
                                            </td>
                                            <td className="p-5 text-center bg-amber-50/10">
                                                <div className="inline-flex flex-col items-center justify-center px-5 py-2 rounded-2xl bg-white/60 backdrop-blur-sm text-amber-800 font-black text-xl shadow-sm border border-amber-100 ring-1 ring-amber-200/20">
                                                    {p.totalAmount.toLocaleString()}
                                                    <span className="text-[9px] uppercase tracking-widest opacity-60 mt-0.5 font-bold">دينار أردني</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex justify-center">
                                                    <div className={`flex items - center gap - 1.5 text - [10px] font - black px - 3 py - 1.5 rounded - xl border ${p.record?.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'
                                                        } `}>
                                                        {p.record?.status === 'APPROVED' ? <CheckCircle className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
                                                        {p.record?.status === 'APPROVED' ? 'معتمد للصرف' : 'بانتظار الاعتماد'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {statusFilter === 'PENDING_FINANCE' && p.record && (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleApprove(p.record!.id)}
                                                                disabled={approvingIds.has(p.record.id)}
                                                                className="h-10 px-5 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl shadow-lg shadow-amber-200/50 transition-all active:scale-95"
                                                            >
                                                                {approvingIds.has(p.record.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعتماد"}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleReject(p.record!.id)}
                                                                disabled={rejectingIds.has(p.record.id)}
                                                                className="h-10 px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
                                                            >
                                                                {rejectingIds.has(p.record.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "رفض"}
                                                            </Button>
                                                        </>
                                                    )}
                                                    {statusFilter === 'APPROVED' && (
                                                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-black px-3 py-1.5 rounded-xl uppercase text-[10px]">
                                                            جاهز للتحويل البنكي
                                                        </Badge>
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

            </div>

            {/* Printable Area - Standardized Official Layout */}
            <div className="hidden print:block font-sans">
                <div className="text-center mb-10 border-b-[6px] border-emerald-900 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">كشف الصرف المالي الشهري</h1>
                            <p className="text-gray-600 text-xs">
                                الشهر: {month} / {year} | حالة الاعتماد: مكتملة
                            </p>
                            <p className="text-sm mt-1 text-emerald-800 font-bold uppercase">الدائرة المالية والمحاسبية</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">تقرير مسيرات الرواتب والمستحقات</h1>
                    <div className="flex justify-center gap-12 mt-4 text-slate-600 font-black">
                        <p>الشهر: <span className="text-emerald-900">{month}</span></p>
                        <p>السنة: <span className="text-emerald-900">{year}</span></p>
                        <p>إجمالي المصروفات: <span className="text-emerald-900">{stats.totalAmount.toLocaleString()} د.أ</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-3 text-right">م</th>
                            <th className="border-2 border-slate-900 p-3 text-right">اسم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أيام العمل</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أجر اليوم</th>
                            <th className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50 text-base">صافي المستحق</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedPayrolls.map((p, index) => (
                            <tr key={p.worker.id} className="border-b-2 border-slate-400">
                                <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                <td className="border-2 border-slate-900 p-3 font-black">{p.worker.name}</td>
                                <td className="border-2 border-slate-900 p-3 text-center">{p.record?.totalCalculatedDays || 0}</td>
                                <td className="border-2 border-slate-900 p-3 text-center">{p.worker.dayValue}</td>
                                <td className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50 text-base">
                                    {p.totalAmount.toLocaleString()} د.أ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-900 text-white font-black border-2 border-slate-900">
                            <td colSpan={4} className="p-4 text-left text-lg">إجمالي مسير الرواتب العام:</td>
                            <td className="p-4 text-center text-xl">{stats.totalAmount.toLocaleString()} د.أ</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">توقيع المحاسب</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs text-left px-8">التوقيع:</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">مدير الدائرة المالية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs text-left px-8">التوقيع:</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد عطوفة العمدة</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم رئاسة البلدية</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        Financial Support System - Payment Serial: {printMetadata.ref} - Date: {printMetadata.date}
                    </p>
                </div>
            </div>
        </>
    );
}
