"use client";

import React, { useState, useMemo } from "react";
import {
    ShieldCheck,
    Search,
    CheckCircle2,
    XCircle,
    History,
    AlertCircle,
    Loader2,
    Menu,
    TrendingUp,
    FileCheck,
    AlertTriangle,
    Filter,
    Printer
} from "lucide-react";
import { useAttendance } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { MobileNav } from "../ui/mobile-nav";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { MonthYearPicker } from "../ui/month-year-picker";
import { resolveAreaNames } from "@/lib/utils";

export function InternalAuditView() {
    const {
        workers,
        areas,
        getWorkerAttendance,
        loadAttendance,
        approveAttendance,
        rejectAttendance,
        isLoading,
        auditLogs
    } = useAttendance();

    const { appUser } = useAuth();
    const { showToast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<'audit' | 'logs'>('audit');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState('');
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());

    // Enhanced Filters
    const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
    const [areaFilter, setAreaFilter] = useState<string>('all');
    const [amountFilter, setAmountFilter] = useState<'all' | '0-20' | '20-30' | '30+'>('all');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING_AUDIT'); // Default to audit pending

    const navItems = [
        { id: 'audit', label: 'تدقيق المستحقات', icon: ShieldCheck },
        { id: 'logs', label: 'سجل العمليات', icon: History },
        { id: 'print', label: 'طباعة التقرير', icon: Printer },
    ];

    // Dynamic data loading for the selected period
    React.useEffect(() => {
        if (!appUser) return;
        loadAttendance(month, year);
    }, [month, year, loadAttendance, appUser]);

    // Risk calculation function
    const calculateRisk = (record: { totalCalculatedDays: number; normalDays: number }): 'low' | 'medium' | 'high' => {
        const totalDays = record.totalCalculatedDays;
        const normalDays = record.normalDays;
        const overtimeRatio = (totalDays - normalDays) / Math.max(normalDays, 1);

        // High risk if overtime > 50% of normal days or total > 35 days
        if (overtimeRatio > 0.5 || totalDays > 35) return 'high';
        // Medium risk if overtime > 25% or total > 28 days
        if (overtimeRatio > 0.25 || totalDays > 28) return 'medium';
        return 'low';
    };

    const filteredRecords = useMemo(() => {
        return workers.map(w => {
            const record = getWorkerAttendance(w.id, month, year);
            const areaName = resolveAreaNames(w.areaId, areas);
            const risk = record ? calculateRisk(record) : 'low';
            const amount = record ? record.totalCalculatedDays * w.dayValue : 0;
            return { worker: w, record, areaName, risk, amount };
        }).filter(item => {
            if (!item.record) return false;
            // Apply status filter
            if (activeTab === 'audit' && statusFilter !== 'all' && item.record.status !== statusFilter) return false;

            const matchesSearch = item.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.worker.id.includes(searchTerm) ||
                item.areaName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRisk = riskFilter === 'all' || item.risk === riskFilter;
            const matchesArea = areaFilter === 'all' || item.worker.areaId === areaFilter;

            let matchesAmount = true;
            if (amountFilter === '0-20') matchesAmount = item.record.totalCalculatedDays <= 20;
            else if (amountFilter === '20-30') matchesAmount = item.record.totalCalculatedDays > 20 && item.record.totalCalculatedDays <= 30;
            else if (amountFilter === '30+') matchesAmount = item.record.totalCalculatedDays > 30;

            return matchesSearch && matchesRisk && matchesArea && matchesAmount;
        });
    }, [workers, areas, getWorkerAttendance, month, year, activeTab, searchTerm, riskFilter, areaFilter, amountFilter, statusFilter]);

    // Analytics
    const analytics = useMemo(() => {
        const total = filteredRecords.length;
        const highRisk = filteredRecords.filter(r => r.risk === 'high').length;
        const mediumRisk = filteredRecords.filter(r => r.risk === 'medium').length;
        const lowRisk = filteredRecords.filter(r => r.risk === 'low').length;
        return { total, highRisk, mediumRisk, lowRisk };
    }, [filteredRecords]);

    const handleApprove = async (recordId: string) => {
        setApprovingIds(prev => new Set(prev).add(recordId));
        try {
            await approveAttendance(recordId, 'PENDING_FINANCE');
            showToast('تم التدقيق والتحويل للمالية');
        } catch (err) {
            console.error(err);
            showToast('خطأ في الاعتماد', 'يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setApprovingIds(prev => {
                const next = new Set(prev);
                next.delete(recordId);
                return next;
            });
        }
    };

    const handleReject = async (recordId: string) => {
        const reason = prompt("يرجى كتابة سبب إعادة السجل للمراجعة:");
        if (!reason) return;

        try {
            await rejectAttendance(recordId, 'PENDING_HR', reason);
            showToast('تم إعادة السجل لقسم الموارد البشرية');
        } catch (err) {
            console.error(err);
            showToast('خطأ في الرفض', 'يرجى المحاولة مرة أخرى', 'error');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
            </div>
        );
    }

    return (
        <>
            <MobileNav
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab={activeTab}
                onTabChange={(id) => id === 'print' ? window.print() : setActiveTab(id as 'audit' | 'logs')}
                user={{ name: appUser?.name || "مدقق الرقابة", role: "قسم الرقابة الداخلية" }}
            />

            <div className="space-y-6 pb-24">
                {/* Header */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-rose-600 to-red-700 p-2.5 rounded-2xl text-white shadow-lg shadow-rose-500/20">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-slate-900 tracking-tight">الرقابة الداخلية</h1>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تدقيق النزاهة والعمليات الميدانية</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="flex gap-2 text-rose-600 hover:bg-rose-50 rounded-xl font-black border border-rose-100 h-10 px-3 md:px-6"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden md:inline">طباعة تقرير التدقيق</span>
                            </Button>

                            <div className="hidden sm:block">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>

                            <button
                                onClick={() => setIsMobileNavOpen(true)}
                                className="p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Analytics Dashboard */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-0.5">إجمالي السجلات</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black tracking-tighter">{analytics.total}</span>
                                <span className="text-[9px] font-bold text-white/60 uppercase">سجل</span>
                            </div>
                        </div>
                        <FileCheck className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 -rotate-12" />
                    </div>
                    <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-0.5">منخفضة المخاطر</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black tracking-tighter">{analytics.lowRisk}</span>
                                <span className="text-[9px] font-bold text-white/60 uppercase">🟢</span>
                            </div>
                        </div>
                        <TrendingUp className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 -rotate-12" />
                    </div>
                    <div className="bg-gradient-to-br from-amber-600 to-orange-700 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-0.5">متوسطة المخاطر</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black tracking-tighter">{analytics.mediumRisk}</span>
                                <span className="text-[9px] font-bold text-white/60 uppercase">🟡</span>
                            </div>
                        </div>
                        <AlertCircle className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 -rotate-12" />
                    </div>
                    <div className="bg-gradient-to-br from-red-600 to-rose-700 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-0.5">عالية المخاطر</p>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-3xl font-black tracking-tighter">{analytics.highRisk}</span>
                                <span className="text-[9px] font-bold text-white/60 uppercase">🔴</span>
                            </div>
                        </div>
                        <AlertTriangle className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 -rotate-12" />
                    </div>
                </div>

                {/* Enhanced Filters */}
                <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 shadow-lg border border-white/40">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="h-5 w-5 text-rose-600" />
                        <h3 className="font-black text-slate-900">تصفية متقدمة</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">حالة المعاملة</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700"
                            >
                                <option value="all">🔍 جميع الحالات</option>
                                <option value="PENDING_SUPERVISOR">📋 عند المراقب</option>
                                <option value="PENDING_GS">👤 المراقب العام</option>
                                <option value="PENDING_HEALTH">🏥 الصحة</option>
                                <option value="PENDING_HR">👥 الموارد البشرية</option>
                                <option value="PENDING_AUDIT">🛡️ الرقابة (أنت)</option>
                                <option value="PENDING_FINANCE">💰 المالية</option>
                                <option value="PENDING_PAYROLL">💳 الرواتب</option>
                                <option value="APPROVED">✅ معتمد نهائياً</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">مستوى المخاطر</label>
                            <select
                                value={riskFilter}
                                onChange={(e) => setRiskFilter(e.target.value as 'all' | 'low' | 'medium' | 'high')}
                                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700"
                            >
                                <option value="all">الكل</option>
                                <option value="low">🟢 منخفضة</option>
                                <option value="medium">🟡 متوسطة</option>
                                <option value="high">🔴 عالية</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">القطاع</label>
                            <select
                                value={areaFilter}
                                onChange={(e) => setAreaFilter(e.target.value)}
                                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700"
                            >
                                <option value="all">جميع القطاعات</option>
                                {areas.map(area => (
                                    <option key={area.id} value={area.id}>{area.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-600 mb-2">عدد الأيام</label>
                            <select
                                value={amountFilter}
                                onChange={(e) => setAmountFilter(e.target.value as 'all' | '0-20' | '20-30' | '30+')}
                                className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm font-bold text-slate-700"
                            >
                                <option value="all">الكل</option>
                                <option value="0-20">0-20 يوم</option>
                                <option value="20-30">20-30 يوم</option>
                                <option value="30+">30+ يوم</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Search and Tabs */}
                <div className="flex flex-col md:flex-row gap-4 px-1">
                    <div className="relative flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="بحث في السجلات المطروحة..."
                            className="pr-12 h-12 bg-white/60 backdrop-blur-md rounded-2xl shadow-sm border-slate-100"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm self-center">
                        {navItems.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'audit' | 'logs')}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                                    ? "bg-white text-rose-700 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700"
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'audit' ? (
                    <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mx-1">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                        <th className="p-5">العامل</th>
                                        <th className="p-5">القطاع</th>
                                        <th className="p-5 text-center">الحالة</th>
                                        <th className="p-5 text-center">المخاطر</th>
                                        <th className="p-5 text-center">الأيام</th>
                                        <th className="p-5 text-center">إضافي</th>
                                        <th className="p-5 text-center">الإجمالي</th>
                                        <th className="p-5 text-center">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="p-20 text-center text-slate-400 italic font-bold">
                                                لا توجد سجلات بانتظار التدقيق الرقابي حالياً
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map(({ worker, record, areaName, risk }) => (
                                            <tr key={record!.id} className="hover:bg-rose-50/30 transition-all duration-300 group">
                                                <td className="p-5">
                                                    <div className="font-black text-slate-800 group-hover:text-rose-600 transition-colors">{worker.name}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {worker.id}</div>
                                                </td>
                                                <td className="p-5">
                                                    <Badge variant="outline" className="font-bold border-slate-200 text-slate-600">
                                                        {areaName}
                                                    </Badge>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <Badge
                                                        className={`font-black text-[10px] px-2 py-1 ${record!.status === 'PENDING_SUPERVISOR' ? 'bg-slate-100 text-slate-700' :
                                                            record!.status === 'PENDING_GS' ? 'bg-blue-100 text-blue-700' :
                                                                record!.status === 'PENDING_HEALTH' ? 'bg-teal-100 text-teal-700' :
                                                                    record!.status === 'PENDING_HR' ? 'bg-purple-100 text-purple-700' :
                                                                        record!.status === 'PENDING_AUDIT' ? 'bg-rose-100 text-rose-700' :
                                                                            record!.status === 'PENDING_FINANCE' ? 'bg-emerald-100 text-emerald-700' :
                                                                                record!.status === 'PENDING_PAYROLL' ? 'bg-cyan-100 text-cyan-700' :
                                                                                    'bg-green-100 text-green-700'
                                                            }`}
                                                    >
                                                        {record!.status === 'PENDING_SUPERVISOR' ? '📋 مراقب' :
                                                            record!.status === 'PENDING_GS' ? '👤 م.عام' :
                                                                record!.status === 'PENDING_HEALTH' ? '🏥 صحة' :
                                                                    record!.status === 'PENDING_HR' ? '👥 م.ب' :
                                                                        record!.status === 'PENDING_AUDIT' ? '🛡️ رقابة' :
                                                                            record!.status === 'PENDING_FINANCE' ? '💰 مالية' :
                                                                                record!.status === 'PENDING_PAYROLL' ? '💳 رواتب' :
                                                                                    '✅ معتمد'}
                                                    </Badge>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <Badge
                                                        className={`font-black text-xs px-3 py-1 ${risk === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                                            risk === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                                                                'bg-green-100 text-green-800 border-green-200'
                                                            }`}
                                                    >
                                                        {risk === 'high' ? '🔴 عالية' : risk === 'medium' ? '🟡 متوسطة' : '🟢 منخفضة'}
                                                    </Badge>
                                                </td>
                                                <td className="p-5 text-center font-black text-slate-700">{record!.normalDays}</td>
                                                <td className="p-5 text-center">
                                                    <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                                                        {record!.overtimeNormalDays} | {record!.overtimeHolidayDays} | {record!.overtimeEidDays || 0}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-black text-lg">
                                                        {record!.totalCalculatedDays}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex justify-center gap-2">
                                                        {record!.status === 'PENDING_AUDIT' ? (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove(record!.id)}
                                                                    disabled={approvingIds.has(record!.id)}
                                                                    className="bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl h-10 px-6 gap-2"
                                                                >
                                                                    {approvingIds.has(record!.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                                                    اعتماد
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleReject(record!.id)}
                                                                    className="text-rose-600 hover:bg-rose-50 h-10 w-10 p-0 rounded-xl"
                                                                >
                                                                    <XCircle className="h-5 w-5" />
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <Badge variant="outline" className="text-slate-500 text-xs">
                                                                {record!.status === 'APPROVED' ? '✅ معتمد نهائياً' : '⏳ في مرحلة أخرى'}
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
                ) : (
                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/40 shadow-xl overflow-hidden min-h-[400px]">
                        <div className="flex items-center gap-3 mb-6">
                            <History className="h-5 w-5 text-rose-600" />
                            <h3 className="font-black text-slate-900 tracking-tight">سجل العمليات الأخير</h3>
                        </div>
                        <div className="space-y-4">
                            {auditLogs.slice(0, 20).map(log => (
                                <div key={log.id} className="flex gap-4 p-4 bg-white/40 rounded-2xl border border-white/40 group hover:border-rose-200 transition-all">
                                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-rose-600 transition-colors">
                                        <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-black text-slate-800 uppercase">{log.action} - {log.table_name}</span>
                                            <span className="text-[10px] font-bold text-slate-400">{new Date(log.changed_at).toLocaleString('ar-JO')}</span>
                                        </div>
                                        <p className="text-sm text-slate-600 font-medium mt-1">
                                            سجل: {log.record_id} | بواسطة: {log.changed_by || 'نظام'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Formal Report View (Print Only) */}
            <div className="hidden print:block p-12 bg-white text-slate-900" dir="rtl">
                <div className="text-center mb-12 border-b-4 border-slate-900 pb-8 relative">
                    <div className="flex justify-between items-start mb-6">
                        <div className="text-right">
                            <h2 className="text-2xl font-black">المملكة الأردنية الهاشمية</h2>
                            <h3 className="text-xl font-bold">بلدية الزرقاء</h3>
                            <p className="text-gray-600 text-sm mt-1">قسم الرقابة والتدقيق الداخلي</p>
                        </div>
                        <div className="bg-slate-100 p-4 rounded-full">
                            <ShieldCheck className="h-12 w-12 text-slate-900" />
                        </div>
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {new Date().toLocaleDateString('ar-JO')}</p>
                            <p>الرقم: AUD-INT-{year}-{month}</p>
                        </div>
                    </div>

                    <h1 className="text-3xl font-black mt-4">تقرير الرقابة والتدقيق الداخلي للرواتب</h1>
                    <p className="text-slate-500 font-bold mt-2 underline underline-offset-4">للفترة: {month} / {year}</p>
                </div>

                {/* Audit Summary Cards (Print version) */}
                <div className="grid grid-cols-4 gap-4 mb-12">
                    <div className="border-2 border-slate-200 p-6 rounded-2xl text-center">
                        <p className="text-xs font-black text-slate-500 mb-1">إجمالي السجلات</p>
                        <p className="text-2xl font-black">{analytics.total}</p>
                    </div>
                    <div className="border-2 border-emerald-200 bg-emerald-50/30 p-6 rounded-2xl text-center">
                        <p className="text-xs font-black text-emerald-600 mb-1">منخفضة المخاطر</p>
                        <p className="text-2xl font-black">{analytics.lowRisk}</p>
                    </div>
                    <div className="border-2 border-amber-200 bg-amber-50/30 p-6 rounded-2xl text-center">
                        <p className="text-xs font-black text-amber-600 mb-1">متوسطة المخاطر</p>
                        <p className="text-2xl font-black">{analytics.mediumRisk}</p>
                    </div>
                    <div className="border-2 border-rose-200 bg-rose-50/30 p-6 rounded-2xl text-center">
                        <p className="text-xs font-black text-rose-600 mb-1">عالية المخاطر</p>
                        <p className="text-2xl font-black">{analytics.highRisk}</p>
                    </div>
                </div>

                <table className="w-full border-collapse mb-12">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border-2 border-slate-900 p-3 text-right">#</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الموظف</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-3 text-center">الأيام</th>
                            <th className="border-2 border-slate-900 p-3 text-center">إضافي</th>
                            <th className="border-2 border-slate-900 p-3 text-center">المستوى</th>
                            <th className="border-2 border-slate-900 p-3 text-center">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((item, index) => (
                            <tr key={item.worker.id}>
                                <td className="border border-slate-300 p-3 text-center font-bold">{index + 1}</td>
                                <td className="border border-slate-300 p-3 font-black text-sm">{item.worker.name}</td>
                                <td className="border border-slate-300 p-3 text-sm">{item.areaName}</td>
                                <td className="border border-slate-300 p-3 text-center font-bold">{item.record?.normalDays}</td>
                                <td className="border border-slate-300 p-3 text-center font-bold">
                                    {(item.record?.overtimeNormalDays || 0) + (item.record?.overtimeHolidayDays || 0)}
                                </td>
                                <td className="border border-slate-300 p-3 text-center font-black">
                                    {item.risk === 'high' ? '🔴 عالٍ' : item.risk === 'medium' ? '🟡 متوسط' : '🟢 منخفض'}
                                </td>
                                <td className="border border-slate-300 p-3 text-center text-xs font-bold">
                                    {item.record?.status === 'APPROVED' ? '✅ معتمد' : '⏳ قيد التدقيق'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-12 mt-24">
                    <div className="text-center space-y-20">
                        <p className="font-black border-b-2 border-slate-900 pb-2 inline-block px-12 text-lg">مدقق الرقابة الداخلية</p>
                        <p className="text-slate-400 font-bold">الاسم والتوقيع</p>
                    </div>
                    <div className="text-center space-y-20">
                        <p className="font-black border-b-2 border-slate-900 pb-2 inline-block px-12 text-lg">مدير الرقابة الداخلية</p>
                        <p className="text-slate-400 font-bold">الاسم والتوقيع</p>
                    </div>
                    <div className="text-center space-y-20">
                        <p className="font-black border-b-2 border-slate-900 pb-2 inline-block px-12 text-lg">عطوفة رئيس البلدية</p>
                        <p className="text-slate-400 font-bold">التنسيب بالصرف</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t-2 border-slate-100 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        TAYID-ALDAWAM SMART SYSTEM - AUDIT REPORT ID: {Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                </div>
            </div>
        </>
    );
}
