"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useAttendance, type Worker, type User, type AttendanceRecord } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Button } from "../ui/button";
import { MobileNav } from "../ui/mobile-nav";
import { BatchEntryTable } from "./BatchEntryTable";
import {
    Search,
    Printer,
    ShieldCheck,
    Loader2,
    CheckCircle,
    Menu,
    Clock,
    History,
    LayoutGrid,
    Activity,
    Users,
    Shield,
    MapPin,
    AlertTriangle,
    ExternalLink,
    Edit3
} from "lucide-react";
import Link from "next/link";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import Image from "next/image";
import { resolveAreaNames } from "@/lib/utils";

type ViewTab = 'requests' | 'history' | 'areas' | 'workers' | 'supervisors' | 'batch_entry';

export function GeneralSupervisorView() {
    const { currentUser, workers, users, attendanceRecords, areas, approveAttendance, rejectAttendance, loadAttendance, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<ViewTab>('requests');

    const navItems = [
        { id: 'overview', label: 'الرئيسية', icon: LayoutGrid },
        { id: 'print', label: 'طباعة كشف', icon: Printer },
    ];
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
    const [selectedNationality, setSelectedNationality] = useState<string>(currentUser?.handledNationality || "ALL");
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

    const isResponsibleForArea = useCallback((areaId: string) =>
        currentUser?.role === 'ADMIN' ||
        currentUser?.areaId === 'ALL' ||
        currentUser?.areas?.some(a => a.id === areaId), [currentUser]);

    const supervisorAreas = useMemo(() => areas.filter(a => isResponsibleForArea(a.id)), [areas, isResponsibleForArea]);

    // Dynamic data loading for the selected period
    useEffect(() => {
        if (!currentUser) return;
        loadAttendance(month, year);
    }, [month, year, loadAttendance, currentUser]);

    // Derived Data
    const { pendingRecords, historyRecords, areaProgress, responsibleSupervisors, responsibleWorkers } = useMemo(() => {
        const periodRecords = attendanceRecords.filter(r => r.month === month && r.year === year);

        const pending = periodRecords.filter(r => {
            const worker = workers.find(w => w.id === r.workerId);
            if (!worker || !isResponsibleForArea(worker.areaId)) return false;
            return r.status === 'PENDING_GS';
        });

        const history = periodRecords.filter(r => {
            const worker = workers.find(w => w.id === r.workerId);
            if (!worker || !isResponsibleForArea(worker.areaId)) return false;
            return r.status !== 'PENDING_SUPERVISOR' && r.status !== 'PENDING_GS';
        });

        // Workers assigned to these areas
        const resWorkers = workers.filter(w => isResponsibleForArea(w.areaId));

        // Supervisors assigned to these areas
        const resSupervisors = users.filter(u =>
            u.role === 'SUPERVISOR' &&
            (u.areaId && isResponsibleForArea(u.areaId) || u.areas?.some(a => isResponsibleForArea(a.id)))
        );

        // Area Progress
        const areaStats = supervisorAreas.map(area => {
            const areaWorkers = workers.filter(w => w.areaId === area.id);
            const areaRecords = periodRecords.filter(r => areaWorkers.some(w => w.id === r.workerId));
            const approvedCount = areaRecords.filter(r => r.status !== 'PENDING_SUPERVISOR' && r.status !== 'PENDING_GS').length;
            const pendingGSCount = areaRecords.filter(r => r.status === 'PENDING_GS').length;
            const pendingSupCount = areaRecords.filter(r => r.status === 'PENDING_SUPERVISOR').length;

            const areaSupervisor = users.find(u =>
                u.role === 'SUPERVISOR' &&
                (u.areaId === area.id || u.areas?.some(a => a.id === area.id))
            );

            return {
                ...area,
                totalWorkersCount: areaWorkers.length,
                submittedCount: areaRecords.length,
                approvedCount: approvedCount,
                pendingGSCount: pendingGSCount,
                pendingSupCount: pendingSupCount,
                supervisorName: areaSupervisor?.name || 'غير معين',
                status: areaWorkers.length === 0 ? 'NOT_STARTED' :
                    (approvedCount === areaWorkers.length ? 'COMPLETED' : 'IN_PROGRESS')
            };
        });

        return {
            pendingRecords: pending,
            historyRecords: history,
            areaProgress: areaStats,
            responsibleSupervisors: resSupervisors,
            responsibleWorkers: resWorkers
        };
    }, [attendanceRecords, workers, users, month, year, supervisorAreas, isResponsibleForArea]);

    const unsupervisedAreaIds = useMemo(() => {
        const assignedAreaIds = new Set<string>();
        users.filter(u => u.role === 'SUPERVISOR').forEach(u => {
            if (u.areaId) assignedAreaIds.add(u.areaId);
            u.areas?.forEach(a => assignedAreaIds.add(a.id));
        });

        return supervisorAreas
            .filter(a => !assignedAreaIds.has(a.id))
            .map(a => a.id);
    }, [users, supervisorAreas]);

    const filteredRecords = useMemo(() => {
        if (activeTab === 'workers') {
            return responsibleWorkers.filter(w =>
                (selectedAreaId === 'ALL' || w.areaId === selectedAreaId) &&
                (selectedNationality === 'ALL' || w.nationality === selectedNationality) &&
                (w.name.toLowerCase().includes(searchTerm.toLowerCase()) || w.id.includes(searchTerm))
            );
        }
        if (activeTab === 'supervisors') {
            return responsibleSupervisors.filter(u =>
                (selectedAreaId === 'ALL' || u.areaId === selectedAreaId || u.areas?.some(a => a.id === selectedAreaId)) &&
                (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.username.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        const base = activeTab === 'requests' ? pendingRecords : historyRecords;
        return base.filter(r => {
            const worker = workers.find(w => w.id === r.workerId);
            if (!worker) return false;

            const matchesArea = selectedAreaId === 'ALL' || worker.areaId === selectedAreaId;
            const matchesNationality = selectedNationality === 'ALL' || worker.nationality === selectedNationality;
            const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                worker.id.includes(searchTerm);

            return matchesArea && matchesNationality && matchesSearch;
        });
    }, [activeTab, pendingRecords, historyRecords, responsibleWorkers, responsibleSupervisors, workers, selectedAreaId, selectedNationality, searchTerm]);

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

    const handleBulkApprove = async () => {
        const ids = pendingRecords.map(r => r.id);
        const confirmBulk = confirm(`هل أنت متأكد من اعتماد ${ids.length} سجلات دفعة واحدة؟`);
        if (!confirmBulk) return;

        for (const id of ids) {
            await handleApprove(id);
        }
    };

    const handleReject = async (recordId: string) => {
        const reason = prompt("يرجى كتابة سبب رفض هذا السجل وإعادته للمراقب الميداني:");
        if (!reason) return;

        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
            await rejectAttendance(recordId, 'PENDING_SUPERVISOR', reason);
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
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm">
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
                                <span className="text-xs">طباعة</span>
                            </Button>

                            <div className="hidden md:block">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>

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

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 px-1">
                    {[
                        {
                            label: 'بانتظار الاعتماد',
                            value: pendingRecords.length,
                            unit: 'كشف معلق',
                            icon: Clock,
                            color: 'rose',
                            gradient: 'from-rose-600 to-rose-700',
                            desc: 'تحتاج مراجعة فورية'
                        },
                        {
                            label: 'إنجاز الشهر',
                            value: Math.round((historyRecords.length / (pendingRecords.length + historyRecords.length || 1)) * 100),
                            unit: '%',
                            icon: Activity,
                            color: 'indigo',
                            gradient: 'from-indigo-600 to-indigo-700',
                            desc: 'نسبة التدقيق الكلية'
                        },
                        {
                            label: 'تغطية القطاعات',
                            value: `${areaProgress.filter(a => a.status === 'COMPLETED').length} / ${areaProgress.length}`,
                            unit: 'قطاع مكتمل',
                            icon: LayoutGrid,
                            color: 'emerald',
                            gradient: 'from-emerald-600 to-emerald-700',
                            desc: 'حالة المناطق المسؤولة'
                        }
                    ].map((kpi, i) => (
                        <div key={i} className={`relative group overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-[2rem] p-6 text-white shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.02]`}>
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl transition-transform group-hover:scale-110" />
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-12 -mb-12 blur-xl" />

                            <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl ring-1 ring-white/30 group-hover:scale-110 transition-transform duration-500">
                                        <kpi.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-[10px] font-black px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 uppercase tracking-widest">
                                        Active
                                    </div>
                                </div>

                                <div>
                                    <p className="text-white/80 text-xs font-black uppercase tracking-widest mb-1">{kpi.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black tracking-tighter">{kpi.value}</span>
                                        <span className="text-[10px] font-bold text-white/60 uppercase">{kpi.unit}</span>
                                    </div>
                                    <p className="text-white/60 text-[10px] font-bold mt-2 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                                        {kpi.desc}
                                    </p>
                                </div>
                            </div>

                            {/* Background Icon */}
                            <kpi.icon className="absolute -bottom-6 -right-6 h-32 w-32 text-white/10 -rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-700" />
                        </div>
                    ))}
                </div>

                <div className="overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                    <div className="flex p-1 bg-slate-100/80 backdrop-blur-md rounded-2xl border border-slate-200/50 min-w-max md:min-w-0 md:w-full gap-1">
                        {[
                            { id: 'requests', label: 'الطلبات', icon: Clock },
                            { id: 'history', label: 'السجل', icon: History },
                            { id: 'areas', label: 'المناطق', icon: MapPin },
                            { id: 'workers', label: 'العمال', icon: Users },
                            { id: 'supervisors', label: 'المراقبين', icon: Shield },
                            { id: 'batch_entry', label: 'إدخال جماعي', icon: Edit3 },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ViewTab)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-black text-sm whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200'
                                    : 'text-slate-500 hover:text-slate-700'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab !== 'areas' && (
                    <div className="flex flex-col gap-4 px-1 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1 group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <Input
                                    id="gs-search"
                                    name="gsSearch"
                                    aria-label="بحث عام"
                                    placeholder="بحث..."
                                    className="pr-12 h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-indigo-500 rounded-2xl shadow-sm text-base"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 flex-1 md:flex-initial">
                                <Select
                                    id="gs-area-filter"
                                    name="gsAreaFilter"
                                    aria-label="تصفية حسب المنطقة"
                                    className="flex-1 md:w-48 h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-indigo-500 rounded-2xl shadow-sm font-bold text-slate-700"
                                    value={selectedAreaId}
                                    onChange={e => setSelectedAreaId(e.target.value)}
                                >
                                    <option value="ALL">جميع المناطق</option>
                                    {supervisorAreas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </Select>

                                <Select
                                    id="gs-nationality-filter"
                                    name="gsNationalityFilter"
                                    aria-label="تصفية حسب الجنسية"
                                    className="flex-1 md:w-36 h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-indigo-500 rounded-2xl shadow-sm font-bold text-slate-700"
                                    value={selectedNationality}
                                    onChange={e => setSelectedNationality(e.target.value)}
                                >
                                    <option value="ALL">جميع الجنسيات</option>
                                    <option value="أردني">أردني</option>
                                    <option value="مصري">مصري</option>
                                </Select>
                            </div>
                        </div>

                        {activeTab === 'requests' && pendingRecords.length > 0 && (
                            <Button
                                onClick={handleBulkApprove}
                                className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                            >
                                <ShieldCheck className="h-5 w-5" />
                                اعتماد الكل ({pendingRecords.length})
                            </Button>
                        )}
                    </div>
                )}

                {activeTab === 'batch_entry' && (
                    <BatchEntryTable
                        month={month}
                        year={year}
                        workers={workers}
                        attendanceRecords={attendanceRecords}
                        areas={areas}
                        responsibleAreasIds={supervisorAreas.map(a => a.id)}
                        unsupervisedAreaIds={unsupervisedAreaIds}
                    />
                )}

                <div className="px-1 animate-in fade-in duration-700">
                    {activeTab === 'areas' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {areaProgress.map(area => (
                                <div key={area.id} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{area.name}</h3>
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Shield className="h-3 w-3 text-slate-400" />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase">{area.supervisorName}</p>
                                            </div>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black ${area.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            area.status === 'IN_PROGRESS' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-slate-50 text-slate-400 border border-slate-100'
                                            }`}>
                                            {area.status === 'COMPLETED' ? 'مكتمل' :
                                                area.status === 'IN_PROGRESS' ? 'قيد العمل' : 'لم يبدأ'}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-slate-500">نسبة الإنجاز</span>
                                            <span className="text-indigo-600">{Math.round((area.approvedCount / (area.totalWorkersCount || 1)) * 100)}%</span>
                                        </div>
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 transition-all duration-500"
                                                style={{ width: `${(area.approvedCount / (area.totalWorkersCount || 1)) * 100}%` }}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-4">
                                            <div className="p-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50 text-center">
                                                <p className="text-[10px] text-indigo-400 font-bold uppercase">عندك</p>
                                                <p className="text-lg font-black text-indigo-700">{area.pendingGSCount}</p>
                                            </div>
                                            <div className="p-2 bg-amber-50/50 rounded-xl border border-amber-100/50 text-center">
                                                <p className="text-[10px] text-amber-400 font-bold uppercase">عند المراقب</p>
                                                <p className="text-lg font-black text-amber-700">{area.pendingSupCount}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                    ) : activeTab === 'workers' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-500">
                            {(filteredRecords as Worker[]).map((worker) => {
                                const record = attendanceRecords.find(r => r.workerId === worker.id && r.month === month && r.year === year);
                                const isFilled = !!record;
                                const areaName = resolveAreaNames(worker.areaId, areas);
                                // Check if this worker is in an area managed by a specific supervisor
                                const assignedSupervisor = users.find(u =>
                                    u.role === 'SUPERVISOR' &&
                                    (u.areaId === worker.areaId || u.areas?.some(a => a.id === worker.areaId))
                                );

                                return (
                                    <div key={worker.id} className={`group hover:shadow-2xl transition-all duration-300 relative overflow-hidden ring-1 rounded-2xl ${isFilled ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/20 ring-emerald-100 shadow-lg shadow-emerald-500/5' : 'bg-white ring-slate-100 shadow-xl shadow-slate-200/50'}`}>
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isFilled ? 'bg-white shadow-sm text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div className="text-right">
                                                    <h4 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{worker.name}</h4>
                                                    <div className="flex flex-col gap-1 mt-1 text-right">
                                                        <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                            <MapPin className="h-2.5 w-2.5" />
                                                            {areaName}
                                                        </span>
                                                        {!assignedSupervisor && (
                                                            <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded-md w-fit flex items-center gap-1">
                                                                <AlertTriangle className="h-2.5 w-2.5" />
                                                                بدون مراقب (إدخال مباشر)
                                                            </span>
                                                        )}
                                                        {assignedSupervisor && (
                                                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                                                                <Shield className="h-2.5 w-2.5" />
                                                                {assignedSupervisor.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            {isFilled && (
                                                <div className="bg-emerald-500 rounded-full p-1 shadow-lg shadow-emerald-500/20">
                                                    <CheckCircle className="h-4 w-4 text-white" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="px-5 pb-5">
                                            <div className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-colors ${isFilled ? 'bg-white/80 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الحالة</span>
                                                    <span className={`text-[11px] font-black ${isFilled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {isFilled ? (
                                                            record?.status === 'PENDING_GS' ? "بانتظارك للاعتماد" :
                                                                record?.status === 'PENDING_SUPERVISOR' ? "عند المراقب" :
                                                                    "مرحلة متقدمة"
                                                        ) : "بانتظار الإدخال"}
                                                    </span>
                                                </div>
                                                <Link href={`/dashboard/entry/${worker.id}?month=${month}&year=${year}`}>
                                                    <Button size="sm" className={`h-9 px-5 rounded-xl font-black shadow-lg transition-all active:scale-95 ${!isFilled ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200 text-white' : 'bg-white text-indigo-600 hover:bg-indigo-50 border border-indigo-100'}`}>
                                                        {isFilled ? "تعديل" : "إدخال"}
                                                        <ExternalLink className="h-3 w-3 mr-1" />
                                                    </Button>
                                                </Link>
                                            </div>

                                            {isFilled && (
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-50 flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">أيام عادية</span>
                                                        <span className="text-sm font-black text-slate-900">{record?.normalDays}</span>
                                                    </div>
                                                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-50 flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">الإجمالي</span>
                                                        <span className="text-sm font-black text-indigo-600">{record?.totalCalculatedDays}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (activeTab === 'requests' || activeTab === 'history') ? (
                        <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                            <th className="p-5">العامل</th>
                                            <th className="p-5">المنطقة</th>
                                            <th className="p-5 text-center">عادية</th>
                                            <th className="p-5 text-center">إضافي (ع)</th>
                                            <th className="p-5 text-center">إضافي (ع/ج)</th>
                                            <th className="p-5 text-center">أعياد</th>
                                            <th className="p-5 text-center">الإجمالي</th>
                                            <th className="p-5 text-center">{activeTab === 'requests' ? 'الاعتماد' : 'الحالة'}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredRecords.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-20 text-center text-slate-400 font-bold">
                                                    لا توجد بيانات مطابقة للبحث
                                                </td>
                                            </tr>
                                        ) : (
                                            (filteredRecords as AttendanceRecord[]).map((item) => {
                                                const worker = workers.find(w => w.id === item.workerId);
                                                const record = item;
                                                const areaName = resolveAreaNames(worker?.areaId, areas);

                                                return (
                                                    <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                                                        <td className="p-5">
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{worker?.name}</span>
                                                                <span className="text-[10px] text-slate-400 font-mono">ID: {worker?.id}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <span className="text-xs font-bold text-slate-600">{areaName}</span>
                                                        </td>
                                                        <td className="p-5 text-center font-black text-slate-700">{record?.normalDays || 0}</td>
                                                        <td className="p-5 text-center font-black text-indigo-600">{record?.overtimeNormalDays || 0}</td>
                                                        <td className="p-5 text-center font-black text-amber-600">{record?.overtimeHolidayDays || 0}</td>
                                                        <td className="p-5 text-center font-black text-rose-600">{record?.overtimeEidDays || 0}</td>
                                                        <td className="p-5 text-center">
                                                            <div className="inline-flex items-center justify-center min-w-[3rem] h-10 px-3 rounded-xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 text-indigo-700 font-black text-lg border border-indigo-100/30">
                                                                {record?.totalCalculatedDays || 0}
                                                            </div>
                                                        </td>
                                                        <td className="p-5">
                                                            <div className="flex items-center justify-center gap-2">
                                                                {activeTab === 'requests' ? (
                                                                    <>
                                                                        <Button
                                                                            size="sm"
                                                                            onClick={() => handleApprove(record!.id)}
                                                                            disabled={approvingIds.has(record!.id)}
                                                                            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                                                        >
                                                                            {approvingIds.has(record!.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "اعتماد"}
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => handleReject(record!.id)}
                                                                            disabled={rejectingIds.has(record!.id) || approvingIds.has(record!.id)}
                                                                            className="h-9 px-3 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
                                                                        >
                                                                            {rejectingIds.has(record!.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : "رفض"}
                                                                        </Button>
                                                                    </>
                                                                ) : (
                                                                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-black text-[10px] ${record!.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                        record!.status.startsWith('PENDING') ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                            'bg-slate-50 text-slate-500 border-slate-100'
                                                                        }`}>
                                                                        {record!.status === 'APPROVED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                                        {record!.status === 'APPROVED' ? 'تم الاعتماد النهائي' :
                                                                            record!.status === 'PENDING_HEALTH' ? 'عند مدير الصحة' :
                                                                                record!.status === 'PENDING_HR' ? 'عند شؤون الموظفين' :
                                                                                    record!.status === 'PENDING_AUDIT' ? 'عند الرقابة الداخلية' :
                                                                                        record!.status === 'PENDING_FINANCE' ? 'عند المالية' : 'قيد المعالجة'}
                                                                    </div>
                                                                )}
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
                    ) : activeTab === 'supervisors' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(filteredRecords as User[]).map((sup) => {
                                const supAreas = areas.filter(a => a.id === sup.areaId || sup.areas?.some((ca) => ca.id === a.id));
                                return (
                                    <div key={sup.id} className="bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm hover:shadow-md transition-all">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg ring-4 ring-indigo-50">
                                                <Shield className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 leading-none">{sup.name}</h3>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">@{sup.username}</p>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">المناطق المسؤولة</p>
                                            <div className="flex flex-wrap gap-1">
                                                {supAreas.map(a => (
                                                    <span key={a.id} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black border border-indigo-100">
                                                        {a.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                            <span className={`flex items-center gap-1.5 text-[10px] font-black ${sup.isActive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${sup.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                                {sup.isActive ? 'نشط' : 'غير نشط'}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </div>
            </div >

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
                </div>

                <table className="w-full border-collapse text-[10px] mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-2 text-right">م</th>
                            <th className="border-2 border-slate-900 p-2 text-right">اسم العامل</th>
                            <th className="border-2 border-slate-900 p-2 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-2 text-center">أيام عادية</th>
                            <th className="border-2 border-slate-900 p-2 text-center">إضافي (0.5)</th>
                            <th className="border-2 border-slate-900 p-2 text-center">إضافي (1.0)</th>
                            <th className="border-2 border-slate-900 p-2 text-center">أعياد (1.0)</th>
                            <th className="border-2 border-slate-900 p-2 text-center font-black bg-slate-50">إجمالي الأيام</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(activeTab === 'requests' ? pendingRecords :
                            activeTab === 'history' ? historyRecords : (filteredRecords as (AttendanceRecord | Worker)[])).map((item, index: number) => {
                                const worker = activeTab === 'workers' ? (item as Worker) : workers.find(w => w.id === (item as AttendanceRecord).workerId);
                                const record = activeTab === 'workers' ? attendanceRecords.find(r => r.workerId === (item as Worker).id && r.month === month && r.year === year) : (item as AttendanceRecord);
                                const areaName = resolveAreaNames(worker?.areaId, areas);
                                return (
                                    <tr key={'id' in item ? item.id : index} className="border-b-2 border-slate-400">
                                        <td className="border-2 border-slate-900 p-2 text-center font-bold">{index + 1}</td>
                                        <td className="border-2 border-slate-900 p-2 font-black">{worker?.name}</td>
                                        <td className="border-2 border-slate-900 p-2">{areaName}</td>
                                        <td className="border-2 border-slate-900 p-2 text-center font-bold">{record?.normalDays || 0}</td>
                                        <td className="border-2 border-slate-900 p-2 text-center font-bold">{record?.overtimeNormalDays || 0}</td>
                                        <td className="border-2 border-slate-900 p-2 text-center font-bold">{record?.overtimeHolidayDays || 0}</td>
                                        <td className="border-2 border-slate-900 p-2 text-center font-bold">{record?.overtimeEidDays || 0}</td>
                                        <td className="border-2 border-slate-900 p-2 text-center font-black bg-slate-50">{record?.totalCalculatedDays || 0}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">توقيع المراقب العام</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs text-center">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">تدقيق الدائرة الصحية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs text-center">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد عطوفة العمدة</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم رئاسة البلدية</p>
                    </div>
                </div>
            </div>
        </>
    );
}
