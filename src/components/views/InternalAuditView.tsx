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
    Menu
} from "lucide-react";
import { useAttendance } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { MobileNav } from "../ui/mobile-nav";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { MonthYearPicker } from "../ui/month-year-picker";

export function InternalAuditView() {
    const {
        workers,
        areas,
        getWorkerAttendance,
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
    const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set());

    const navItems = [
        { id: 'audit', label: 'تدقيق المستحقات', icon: ShieldCheck },
        { id: 'logs', label: 'سجل العمليات', icon: History },
    ];

    // Risk calculation function
    const calculateRisk = (record: any, worker: any): 'low' | 'medium' | 'high' => {
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
            const areaName = areas.find(a => a.id === w.areaId)?.name || "غير محدد";
            const risk = record ? calculateRisk(record, w) : 'low';
            const amount = record ? record.totalCalculatedDays * w.dayValue : 0;
            return { worker: w, record, areaName, risk, amount };
        }).filter(item => {
            if (!item.record) return false;
            if (activeTab === 'audit' && item.record.status !== 'PENDING_AUDIT') return false;

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
    }, [workers, areas, getWorkerAttendance, month, year, activeTab, searchTerm, riskFilter, areaFilter, amountFilter]);

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
            await rejectAttendance(recordId, 'PENDING_HR');
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
                onTabChange={(id) => setActiveTab(id as 'audit' | 'logs')}
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

                        <div className="flex items-center gap-3">
                            <div className="hidden md:block">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>
                            <button
                                onClick={() => setIsMobileNavOpen(true)}
                                className="md:hidden p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
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
                                        <th className="p-5 text-center">الأيام</th>
                                        <th className="p-5 text-center">إضافي</th>
                                        <th className="p-5 text-center">الإجمالي</th>
                                        <th className="p-5 text-center">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center text-slate-400 italic font-bold">
                                                لا توجد سجلات بانتظار التدقيق الرقابي حالياً
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredRecords.map(({ worker, record, areaName }) => (
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
        </>
    );
}
