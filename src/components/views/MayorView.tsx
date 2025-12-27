"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Button } from "../ui/button";
import Image from "next/image";
import { Badge } from "../ui/badge";
import {
    Activity,
    Users,
    CheckCircle2,
    Clock,
    TrendingUp,
    Loader2,
    ShieldCheck,
    Briefcase,
    Landmark,
    Target,
    Printer
} from "lucide-react";

export function MayorView() {
    const { workers, attendanceRecords, areas, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Stable print metadata - generated on mount to fix purity lint errors
    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `MAYOR-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

    const stats = useMemo(() => {
        const periodRecords = attendanceRecords.filter(r => r.month === month && r.year === year);

        const pendingStages = {
            SUPERVISOR: periodRecords.filter(r => r.status === 'PENDING_SUPERVISOR').length,
            GS: periodRecords.filter(r => r.status === 'PENDING_GS').length,
            HEALTH: periodRecords.filter(r => r.status === 'PENDING_HEALTH').length,
            HR: periodRecords.filter(r => r.status === 'PENDING_HR').length,
            FINANCE: periodRecords.filter(r => r.status === 'PENDING_FINANCE').length,
        };

        const totalApproved = periodRecords.filter(r => r.status === 'APPROVED').length;
        const totalPending = Object.values(pendingStages).reduce((a, b) => a + b, 0);

        // Calculate total financial value for approved records
        const approvedAmount = periodRecords
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => {
                const worker = workers.find(w => w.id === r.workerId);
                if (!worker) return sum;
                return sum + (r.totalCalculatedDays * worker.dayValue);
            }, 0);

        // Calculate potential financial value (all records if they were approved)
        const projectedAmount = periodRecords
            .reduce((sum, r) => {
                const worker = workers.find(w => w.id === r.workerId);
                if (!worker) return sum;
                return sum + (r.totalCalculatedDays * worker.dayValue);
            }, 0);

        return {
            pendingStages,
            totalApproved,
            totalPending,
            approvedAmount,
            projectedAmount,
            totalWorkers: workers.length,
            activeWorkersThisMonth: new Set(periodRecords.map(r => r.workerId)).size,
            completionRate: periodRecords.length > 0 ? Math.round((totalApproved / periodRecords.length) * 100) : 0
        };
    }, [attendanceRecords, workers, month, year]);

    const areaProgress = useMemo(() => {
        return areas.map(area => {
            const areaWorkers = workers.filter(w => w.areaId === area.id);
            const areaRecords = attendanceRecords.filter(r =>
                r.month === month &&
                r.year === year &&
                areaWorkers.some(w => w.id === r.workerId)
            );

            const approvedCount = areaRecords.filter(r => r.status === 'APPROVED').length;
            const totalCount = areaRecords.length;
            const percentage = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

            return {
                ...area,
                totalCount,
                approvedCount,
                percentage,
                pendingCount: totalCount - approvedCount
            };
        }).sort((a, b) => b.percentage - a.percentage);
    }, [areas, workers, attendanceRecords, month, year]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6 pb-24 print:hidden">
                {/* Executive Header - Ultra Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
                    <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 p-2.5 rounded-2xl text-white shadow-xl shadow-fuchsia-500/20 ring-1 ring-white/30">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">رئاسة البلدية</h2>
                                    <Badge className="bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100 text-[9px] font-black uppercase tracking-tighter">Executive</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">نظام الرقابة والحوكمة الذكي</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="flex gap-2 text-fuchsia-600 hover:bg-fuchsia-50"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="text-xs font-black">طباعة التقرير الاستراتيجي</span>
                            </Button>
                            <div className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Strategic Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "القوة العاملة", value: stats.totalWorkers, unit: "عامل", icon: Users, color: "blue", trend: "إجمالي السجلات" },
                        { label: "قيد المراجعة", value: stats.totalPending, unit: "معاملة", icon: Clock, color: "amber", trend: "بانتظار التدقيق" },
                        { label: "نسبة الإنجاز", value: stats.completionRate, unit: "%", icon: Target, color: "emerald", trend: "الكفاءة الكلية" },
                        { label: "الميزانية المعتمدة", value: stats.approvedAmount.toLocaleString(), unit: "د.أ", icon: TrendingUp, color: "fuchsia", trend: "المستحقات الحالية" }
                    ].map((kpi, i) => (
                        <div key={i} className="relative group overflow-hidden">
                            <div className="relative z-10 bg-white/60 backdrop-blur-xl p-5 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-300/50 transition-all duration-500">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3 rounded-2xl bg-${kpi.color}-50 text-${kpi.color}-600 ring-1 ring-${kpi.color}-100 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                        <kpi.icon className="h-6 w-6" />
                                    </div>
                                    <div className={`text-[10px] font-black px-2.5 py-1 rounded-full bg-${kpi.color}-50 text-${kpi.color}-700 uppercase tracking-tighter shadow-sm`}>
                                        {kpi.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">{kpi.label}</h3>
                                    <div className="flex items-baseline gap-1.2">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">{kpi.value}</span>
                                        <span className="text-xs font-bold text-slate-400 uppercase">{kpi.unit}</span>
                                    </div>
                                </div>
                                <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${kpi.color}-50 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-2xl`}></div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Process Funnel Card */}
                    <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-fuchsia-50 rounded-2xl text-fuchsia-600">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">مسار الاعتمادات الحية</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تحليل التدفق الرقمي للبلاغات</p>
                                </div>
                            </div>
                            <div className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-tighter">Live Monitor</div>
                        </div>

                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-8">
                            {[
                                { label: "المراقب", count: stats.pendingStages.SUPERVISOR, color: "blue", icon: Users },
                                { label: "المراقب العام", count: stats.pendingStages.GS, color: "indigo", icon: ShieldCheck },
                                { label: "الصحة", count: stats.pendingStages.HEALTH, color: "emerald", icon: Activity },
                                { label: "الموارد", count: stats.pendingStages.HR, color: "amber", icon: Briefcase },
                                { label: "المالية", count: stats.pendingStages.FINANCE, color: "teal", icon: Landmark },
                                { label: "الاعتماد", count: stats.totalApproved, color: "fuchsia", icon: CheckCircle2 }
                            ].map((step, i) => (
                                <div key={i} className="flex flex-col items-center group">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 border-2 ${step.count > 0 ? `bg-${step.color}-50 border-${step.color}-100 text-${step.color}-600 shadow-lg shadow-${step.color}-500/10` : 'bg-slate-50 border-slate-100 text-slate-300 opacity-40'
                                        } group-hover:scale-110`}>
                                        <step.icon className="h-5 w-5" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-500 mt-2 text-center leading-tight">{step.label}</span>
                                    <div className={`text-[11px] font-black mt-1 ${step.count > 0 ? `text-${step.color}-700` : 'text-slate-300'}`}>{step.count}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-white/50 border border-slate-100 p-5 rounded-3xl relative overflow-hidden">
                            <div className="flex gap-4">
                                <div className="w-1.5 h-auto bg-fuchsia-600 rounded-full"></div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-slate-900 uppercase">موجز الحالة الذكي</h4>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed">
                                        {stats.totalPending > 10 ?
                                            `تم رصد تكدس في العمليات الإجمالية (${stats.totalPending} سجل). يوصى بتشجيع المديرين على إنهاء الاعتمادات العالقة.` :
                                            "منظومة العمل تسير بكفاءة عالية وفق الجدول الزمني المحدد."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Regional Performance Card */}
                    <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl border border-white/40 shadow-xl shadow-slate-200/50">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 tracking-tight">ترتيب المناطق</h3>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">كفاءة الإنجاز المعتمد</p>
                            </div>
                        </div>

                        <div className="space-y-5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                            {areaProgress.map((area, idx) => (
                                <div key={area.id} className="group">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-black text-slate-700 group-hover:text-fuchsia-600 transition-colors uppercase">{area.name}</span>
                                        <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">{area.percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/30">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${idx === 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' :
                                                idx < 3 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                    'bg-slate-300'
                                                }`}
                                            style={{ width: `${area.percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Live Updates Table - Clean Glass */}
                <div className="bg-white/40 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden mx-1">
                    <div className="p-6 border-b border-white/40 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-6 bg-fuchsia-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 tracking-tight">آخر المعاملات المسجلة</h3>
                        </div>
                        <Badge className="bg-white/60 text-slate-500 border-slate-200/60 font-black px-3 py-1 rounded-xl">RECENT UPDATES</Badge>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-5">العامل</th>
                                    <th className="p-5">القطاع</th>
                                    <th className="p-5 text-center">المحطة الحالية</th>
                                    <th className="p-5 text-center">التاريخ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {attendanceRecords
                                    .filter(r => r.month === month && r.year === year)
                                    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                    .slice(0, 8)
                                    .map(record => {
                                        const worker = workers.find(w => w.id === record.workerId);
                                        const area = areas.find(a => a.id === worker?.areaId);
                                        const statusConfig = {
                                            PENDING_SUPERVISOR: { label: 'المراقب', color: 'slate' },
                                            PENDING_GS: { label: 'المراقب العام', color: 'indigo' },
                                            PENDING_HEALTH: { label: 'مدير الصحة', color: 'emerald' },
                                            PENDING_HR: { label: 'الموارد البشرية', color: 'amber' },
                                            PENDING_FINANCE: { label: 'المالية', color: 'teal' },
                                            APPROVED: { label: 'معتمد نهائياً', color: 'fuchsia' }
                                        }[record.status] || { label: record.status, color: 'slate' };

                                        return (
                                            <tr key={record.id} className="hover:bg-fuchsia-50/20 transition-all duration-300 group">
                                                <td className="p-5">
                                                    <div className="font-black text-slate-800 group-hover:text-fuchsia-700 transition-colors uppercase tracking-tight">{worker?.name}</div>
                                                    <div className="text-[9px] text-slate-400 font-bold tracking-tighter">ID: {worker?.id}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex items-center gap-1.5 text-slate-500 font-bold text-[11px]">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                        {area?.name}
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex justify-center">
                                                        <Badge className={`bg-${statusConfig.color}-50 text-${statusConfig.color}-700 border-${statusConfig.color}-100 font-black px-3 py-1 rounded-xl text-[10px]`}>
                                                            {statusConfig.label}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase">
                                                        {new Date(record.updatedAt).toLocaleDateString('ar-JO')}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Printable Area for Executive Overview - Standardized Official Layout */}
            <div className="hidden print:block font-sans">
                <div className="text-center mb-10 border-b-[6px] border-slate-900 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">تقرير الملخص الإداري التنفيذي</h1>
                            <p className="text-gray-600">الشهر: {month} / {year} | رئاسة البلدية</p>
                            <p className="text-sm mt-1 text-slate-800 font-bold uppercase">المكتب التنفيذي لعطوفة العمدة</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-12">
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">القوة العاملة الإجمالية</p>
                        <p className="text-4xl font-black text-slate-900">{stats.totalWorkers} عامل</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">نسبة الإنجاز الكلية</p>
                        <p className="text-4xl font-black text-slate-900">{stats.completionRate}%</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">المستحقات المعتمدة</p>
                        <p className="text-4xl font-black text-slate-900">{stats.approvedAmount.toLocaleString()} د.أ</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">بانتظار التدقيق</p>
                        <p className="text-4xl font-black text-slate-600">{stats.totalPending} سجل</p>
                    </div>
                </div>

                <h3 className="text-xl font-black text-slate-800 mb-4 border-r-4 border-fuchsia-600 pr-4">كفاءة القطاعات</h3>
                <table className="w-full border-collapse border border-slate-300 text-sm mb-12">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="border border-slate-300 p-3 text-right">المنطقة</th>
                            <th className="border border-slate-300 p-3 text-center">الإنجاز (%)</th>
                            <th className="border border-slate-300 p-3 text-center">سجلات منجزة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {areaProgress.map(area => (
                            <tr key={area.id}>
                                <td className="border border-slate-300 p-3 font-bold">{area.name}</td>
                                <td className="border border-slate-300 p-3 text-center">
                                    <div className="flex items-center gap-2 justify-center">
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-fuchsia-600" style={{ width: `${area.percentage}%` }}></div>
                                        </div>
                                        <span className="mr-2">{area.percentage}%</span>
                                    </div>
                                </td>
                                <td className="border border-slate-300 p-3 text-center">{area.approvedCount} / {area.totalCount}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-20 flex justify-between px-12">
                    <div className="text-center">
                        <p className="font-black text-slate-800 mb-12 italic tracking-tighter">اعتماد رئيس البلدية</p>
                        <div className="border-t-2 border-slate-900 w-48 mx-auto"></div>
                    </div>
                    <div className="text-center">
                        <p className="font-black text-slate-800 mb-12 italic tracking-tighter">ختم رئاسة الوزراء</p>
                        <div className="border-t-2 border-slate-900 w-48 mx-auto"></div>
                    </div>
                </div>
            </div>
        </>
    );
}
