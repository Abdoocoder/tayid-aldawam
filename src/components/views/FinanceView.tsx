"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Badge } from "../ui/badge";
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
    Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FinanceView() {
    const { workers, getWorkerAttendance, isLoading, error, areas, approveAttendance, rejectAttendance } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<'PENDING_FINANCE' | 'APPROVED'>('PENDING_FINANCE');
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

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
            <div className="space-y-6 pb-24 print:hidden">
                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
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

                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid - New Pattern */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                    {[
                        { label: 'إجمالي المستحقات', value: stats.totalAmount.toLocaleString(), unit: 'د.أ', icon: DollarSign, color: 'amber', trend: 'المعتمدة حالياً' },
                        { label: 'العمال المكتملين', value: stats.workersCount, unit: 'عامل', icon: Users, color: 'emerald', trend: 'جاهز للصرف' },
                        { label: 'صافي أيام العمل', value: stats.totalDays, unit: 'يوم', icon: Calendar, color: 'blue', trend: 'مجموع الساعات' },
                        { label: 'متوسط الأجور', value: stats.avgSalary.toFixed(1), unit: 'د.أ', icon: TrendingUp, color: 'indigo', trend: 'لكل عامل' }
                    ].map((stat, i) => (
                        <div key={i} className="relative group overflow-hidden">
                            <div className="relative z-10 bg-white/60 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/40 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500 hover:-translate-y-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 text-${stat.color}-600 ring-1 ring-${stat.color}-100 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700 uppercase tracking-tighter shadow-sm`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                                    <div className="flex items-baseline gap-1.2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">{stat.unit}</span>
                                    </div>
                                </div>

                                {/* Decorative background shape */}
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-50 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-2xl`}></div>
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
                            className="pr-12 h-12 bg-white/60 backdrop-blur-md border border-white/40 focus:border-amber-500 rounded-2xl shadow-sm text-base transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            className="h-12 bg-white/60 backdrop-blur-md border border-white/40 focus:border-amber-500 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[200px] outline-none px-4 transition-all"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as 'PENDING_FINANCE' | 'APPROVED')}
                        >
                            <option value="PENDING_FINANCE">بانتظار الاعتماد المالي</option>
                            <option value="APPROVED">الكشوف المعتمدة</option>
                        </select>

                        <select
                            className="h-12 bg-white/60 backdrop-blur-md border border-white/40 focus:border-amber-500 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[160px] outline-none px-4 transition-all"
                            value={areaFilter}
                            onChange={e => setAreaFilter(e.target.value)}
                        >
                            <option value="ALL">جميع القطاعات</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        <div className="flex items-center gap-2 ml-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="h-12 px-4 text-blue-600 hover:bg-blue-50 rounded-xl font-bold gap-2 border border-blue-100/50"
                            >
                                <Printer className="h-4 w-4" />
                                نسخة ورقية
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportCSV}
                                className="h-12 px-4 text-emerald-600 hover:bg-emerald-50 rounded-xl font-bold gap-2 border border-emerald-100/50"
                            >
                                <Download className="h-4 w-4" />
                                تصدير Excel
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Payroll Table - Commercial Banking Aesthetic */}
                <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mx-1 animate-in fade-in duration-1000">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-5">الموظف المنتج</th>
                                    <th className="p-5 text-center">القطاع</th>
                                    <th className="p-5 text-center">الأيام</th>
                                    <th className="p-5 text-center">سعر اليوم</th>
                                    <th className="p-5 text-center bg-amber-50/30 text-amber-700 font-black">صافي المستحق</th>
                                    <th className="p-5 text-center">الحالة</th>
                                    <th className="p-5 text-center">الإجراء</th>
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
                                            <td className="p-5">
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
                                                    <div className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1.5 rounded-xl border ${p.record?.status === 'APPROVED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-amber-700 bg-amber-50 border-amber-100'
                                                        }`}>
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

            {/* Print Section (Hidden on screen) */}
            <div className="hidden print:block p-8 bg-white" dir="rtl">
                <div className="text-center border-b-4 border-slate-900 pb-8 mb-10">
                    <h1 className="text-4xl font-black mb-2 tracking-tighter text-slate-900">كشف مسير رواتب العمال - الإدارة المالية</h1>
                    <div className="flex justify-center gap-8 text-sm text-slate-600 font-bold uppercase tracking-widest">
                        <span>فترة الاستحقاق: {month}/{year}</span>
                        <span>القطاع: {areaFilter === "ALL" ? "كافة القطاعات" : areas.find(a => a.id === areaFilter)?.name}</span>
                        <span>تاريخ الطباعة: {new Date().toLocaleDateString('ar-JO')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">إجمالي المبلغ</p>
                        <p className="text-3xl font-black text-slate-900">{stats.totalAmount.toLocaleString()} د.أ</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">عدد الموظفين</p>
                        <p className="text-3xl font-black text-slate-900">{approvedPayrolls.length} عامل</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200">
                        <p className="text-xs font-black text-slate-400 uppercase mb-1">مجموع الأيام</p>
                        <p className="text-3xl font-black text-slate-900">{stats.totalDays} يوم</p>
                    </div>
                </div>

                <table className="w-full border-collapse border border-slate-300">
                    <thead className="bg-slate-100">
                        <tr>
                            <th className="border border-slate-300 p-3 text-right">الاسم</th>
                            <th className="border border-slate-300 p-3 text-right">القطاع</th>
                            <th className="border border-slate-300 p-3 text-center">الأيام</th>
                            <th className="border border-slate-300 p-3 text-center font-black">الصافي (د.أ)</th>
                            <th className="border border-slate-300 p-3 text-center">التوقيع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedPayrolls.map((p) => (
                            <tr key={p.worker.id}>
                                <td className="border border-slate-300 p-3 font-bold">{p.worker.name}</td>
                                <td className="border border-slate-300 p-3">{p.areaName}</td>
                                <td className="border border-slate-300 p-3 text-center">{p.record?.totalCalculatedDays || 0}</td>
                                <td className="border border-slate-300 p-3 text-center font-black">{p.totalAmount.toLocaleString()}</td>
                                <td className="border border-slate-300 p-3 min-w-[150px]"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </>
    );
}
