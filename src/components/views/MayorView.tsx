"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
    Activity,
    Users,
    CheckCircle2,
    Clock,
    TrendingUp,
    Search,
    PieChart,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Briefcase,
    Landmark,
    Target,
    ArrowUpRight,
    Zap
} from "lucide-react";

export function MayorView() {
    const { workers, attendanceRecords, areas, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const stats = useMemo(() => {
        const periodRecords = attendanceRecords.filter(r => r.month === month && r.year === year);

        const pendingStages = {
            SUPERVISOR: periodRecords.filter(r => r.status === 'PENDING_SUPERVISOR').length,
            GS: periodRecords.filter(r => r.status === 'PENDING_GS').length,
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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header section with glassmorphism */}
            <div className="relative overflow-hidden bg-[#0a2e2a] rounded-[2.5rem] p-10 text-white shadow-2xl border border-white/5">
                {/* Visual accents */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-emerald-500/20 via-transparent to-purple-500/10 z-0"></div>
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] z-0"></div>
                <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-teal-500/10 rounded-full blur-[80px] z-0"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-6">
                        <div className="bg-white/10 backdrop-blur-2xl p-5 rounded-3xl border border-white/20 shadow-xl shadow-black/20 ring-1 ring-white/30">
                            <ShieldCheck className="h-10 w-10 text-emerald-400" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">لوحة الرئيس</h2>
                                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 font-bold backdrop-blur-md">حصري</Badge>
                            </div>
                            <p className="text-emerald-100/70 font-medium text-lg">الرؤية الشاملة لمنظومة العمل - بلدية مادبا الكبرى</p>
                        </div>
                    </div>
                    <div className="bg-black/40 backdrop-blur-3xl p-3 rounded-3xl border border-white/10 flex gap-3 shadow-2xl ring-1 ring-white/10">
                        <MonthYearPicker
                            month={month}
                            year={year}
                            onChange={(m, y) => { setMonth(m); setYear(y); }}
                        />
                    </div>
                </div>
            </div>

            {/* Top Level KPIs - Enhanced with Micro-animations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "إجمالي العمال", value: stats.totalWorkers, sub: `${stats.activeWorkersThisMonth} عامل نشط`, icon: Users, color: "blue" },
                    { label: "قيد المراجعة", value: stats.totalPending, sub: "سجلات بانتظار الاعتماد", icon: Clock, color: "amber" },
                    { label: "الإنجاز الكلي", value: `${stats.completionRate}%`, sub: `${stats.totalApproved} سجل معتمد`, icon: Target, color: "emerald" },
                    { label: "الميزانية المعتمدة", value: `${stats.approvedAmount.toLocaleString()} د.أ`, sub: `من أصل ${stats.projectedAmount.toLocaleString()}`, icon: TrendingUp, color: "purple" }
                ].map((kpi, idx) => (
                    <Card key={idx} className="border-none shadow-xl hover:shadow-2xl transition-all duration-500 bg-white group rounded-3xl overflow-hidden relative">
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${kpi.color}-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-150`}></div>
                        <CardContent className="p-7 relative z-10">
                            <div className="flex justify-between items-start mb-5">
                                <div className={`p-4 bg-${kpi.color}-50 text-${kpi.color}-600 rounded-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-sm shadow-${kpi.color}-100`}>
                                    <kpi.icon className="h-6 w-6" />
                                </div>
                                <ArrowUpRight className={`h-5 w-5 text-slate-300 group-hover:text-${kpi.color}-500 transition-colors duration-500`} />
                            </div>
                            <div>
                                <p className="text-3xl font-black text-slate-900 tracking-tighter mb-1">{kpi.value}</p>
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">{kpi.label}</p>
                                </div>
                                <p className="text-xs text-slate-400 font-medium mt-2">{kpi.sub}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Custom Funnel Chart & Bottleneck Analysis */}
                <Card className="lg:col-span-2 border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/30 p-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-500/10 rounded-2xl">
                                    <Zap className="h-6 w-6 text-emerald-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">قمع التدفق الإجرائي</CardTitle>
                                    <p className="text-sm text-slate-500 font-medium">تحليل سرعة الانتقال بين محطات الاعتماد</p>
                                </div>
                            </div>
                            <Badge className="bg-slate-100 text-slate-600 border-none font-black px-4 py-1.5">LIVE</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        {/* Custom SVG Funnel */}
                        <div className="relative mb-12 px-4">
                            <div className="grid grid-cols-5 gap-4 relative z-10">
                                {[
                                    { label: "المراقب", count: stats.pendingStages.SUPERVISOR, color: "#3B82F6", icon: Users },
                                    { label: "المراقب العام", count: stats.pendingStages.GS, color: "#6366F1", icon: ShieldCheck },
                                    { label: "الموارد", count: stats.pendingStages.HR, color: "#F59E0B", icon: Briefcase },
                                    { label: "المالية", count: stats.pendingStages.FINANCE, color: "#14B8A6", icon: Landmark },
                                    { label: "الاعتماد", count: stats.totalApproved, color: "#10B981", icon: CheckCircle2 }
                                ].map((step, i) => (
                                    <div key={i} className="flex flex-col items-center group">
                                        <div className="relative mb-6">
                                            {/* Step Connector Line */}
                                            {i < 4 && (
                                                <div className="absolute top-1/2 left-full w-full h-[3px] bg-slate-100 -translate-y-1/2 z-0 hidden md:block">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-slate-200 to-indigo-500/20 transition-all duration-1000"
                                                        style={{ width: step.count > 0 ? '100%' : '0%' }}
                                                    ></div>
                                                </div>
                                            )}
                                            {/* Icon Hexagon/Box */}
                                            <div
                                                className={`
                                                    w-20 h-20 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-xl relative z-10
                                                    ${step.count > 0 ? 'scale-110 -rotate-2 group-hover:rotate-3' : 'opacity-40 grayscale group-hover:grayscale-0'}
                                                `}
                                                style={{
                                                    backgroundColor: step.count > 0 ? `${step.color}15` : '#f1f5f9',
                                                    border: `2px solid ${step.count > 0 ? step.color : '#e2e8f0'}`,
                                                    boxShadow: step.count > 0 ? `0 10px 30px -10px ${step.color}50` : 'none'
                                                }}
                                            >
                                                <step.icon className="h-10 w-10 transition-colors duration-500" style={{ color: step.count > 0 ? step.color : '#94a3b8' }} />

                                                {/* Ripple effect for pending */}
                                                {step.count > 0 && i < 4 && (
                                                    <div className="absolute inset-0 rounded-3xl animate-ping border-4" style={{ borderColor: `${step.color}20`, animationDuration: '3s' }}></div>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-widest mb-2 transition-colors duration-500 ${step.count > 0 ? 'text-slate-700' : 'text-slate-400'}`}>
                                            {step.label}
                                        </span>
                                        <div
                                            className={`px-4 py-1.5 rounded-full text-xs font-black shadow-sm transition-all duration-500 ${step.count > 0 ? 'text-white translate-y-0 opacity-100' : 'text-slate-400 bg-slate-50 border border-slate-100'}`}
                                            style={{ backgroundColor: step.count > 0 ? step.color : 'transparent' }}
                                        >
                                            {step.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Smart AI Insight Box */}
                        <div className="bg-[#f8fafc] border border-slate-100 p-8 rounded-[2rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500 transition-all duration-500 group-hover:w-2"></div>
                            <div className="flex items-start gap-5">
                                <div className="p-4 bg-white shadow-xl shadow-slate-200/50 rounded-2xl">
                                    <PieChart className="h-7 w-7 text-emerald-600" />
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-lg font-black text-slate-800">تحليل العوائق والفرص</h4>
                                    <p className="text-slate-500 leading-relaxed font-medium text-base">
                                        {stats.pendingStages.SUPERVISOR > 5 ?
                                            `تم رصد تكدس في مرحلة المراقبين الميدانيين (${stats.pendingStages.SUPERVISOR} سجل). يوصى بتفعيل آليات المتابعة الحثيثة لضمان ترحيل البيانات بالسرعة المطلوبة.`
                                            : stats.pendingStages.GS > 5 ?
                                                `التدفق حالياً متوقف عند المراقب العام. هناك ${stats.pendingStages.GS} سجل تنتظر المراجعة. مستوى الإشراف العام يحتاج للمتابعة المباشرة.`
                                                : stats.pendingStages.FINANCE > 2 ?
                                                    `وصلت السجلات للمرحلة النهائية في الدائرة المالية. القيمة المالية الجاهزة للصرف هي ${stats.approvedAmount.toLocaleString()} د.أ.`
                                                    : "سير العمل يسير بكفاءة عالية. جميع المسارات مفتوحة والاعتمادات تتم وفق الجدول الزمني المخطط له بنجاح."}
                                    </p>
                                    <div className="flex gap-4 pt-2">
                                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none px-4 py-1.5 font-bold cursor-default">
                                            كفاءة الأداء: {stats.completionRate}%
                                        </Badge>
                                        <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none px-4 py-1.5 font-bold cursor-default">
                                            معدل التدفق: عالي
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress by Area - Compact & Ranked */}
                <Card className="border-none shadow-2xl bg-[#1e293b] text-white overflow-hidden rounded-[2.5rem] relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                <Activity className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-bold tracking-tight">ترتيب القطاعات</CardTitle>
                                <p className="text-slate-400 text-xs mt-1">حسب أعلى نسبة إنجاز معتمد</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 px-8 pb-10">
                        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {areaProgress.map((area, idx) => (
                                <div key={area.id} className="group relative">
                                    <div className="flex justify-between items-end mb-2.5 px-1">
                                        <div className="flex items-center gap-3">
                                            <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black ${idx === 0 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-white/10 text-slate-300'}`}>
                                                {idx + 1}
                                            </span>
                                            <span className="font-black text-sm tracking-tight group-hover:text-emerald-400 transition-colors uppercase">{area.name}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl font-black text-emerald-400 tracking-tighter">{area.percentage}</span>
                                            <span className="text-[10px] font-bold text-slate-500">%</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden p-[1.5px] ring-1 ring-white/10 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ease-out relative shadow-sm ${idx === 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-slate-400 to-slate-600'}`}
                                            style={{ width: `${area.percentage}%` }}
                                        >
                                            <div className="absolute top-0 right-0 w-8 h-full bg-white/20 skew-x-[-20deg] animate-pulse"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between mt-2.5 px-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{area.totalCount} كشف كلي</span>
                                        <div className="flex gap-3">
                                            <span className="text-[10px] font-black text-emerald-500/80">{area.approvedCount} معتمد</span>
                                            <span className="text-[10px] font-black text-slate-400">{area.pendingCount} متبقي</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Summary Table - Premium Styling */}
            <Card className="border-none shadow-2xl bg-white overflow-hidden rounded-[2.5rem]">
                <CardHeader className="border-b border-slate-50 bg-slate-50/20 p-8 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-2xl">
                            <Search className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">سجل التحديثات الحية</CardTitle>
                            <p className="text-sm text-slate-500 font-medium">المعاملات الجارية حالياً في النظام</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50 font-black px-4 rounded-xl">عرض الأرشيف الكامل</Button>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-[#f8fafc] text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] border-b border-slate-100">
                                <th className="p-6">بيانات العامل</th>
                                <th className="p-6">القطاع الإداري</th>
                                <th className="p-6 text-center">المحطة الحالية</th>
                                <th className="p-6">تاريخ العمليات</th>
                                <th className="p-6 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {attendanceRecords
                                .filter(r => r.month === month && r.year === year)
                                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                .slice(0, 10)
                                .map(record => {
                                    const worker = workers.find(w => w.id === record.workerId);
                                    const area = areas.find(a => a.id === worker?.areaId);

                                    const statusConfig = {
                                        PENDING_SUPERVISOR: { label: 'عند المراقب', color: 'slate' },
                                        PENDING_GS: { label: 'عند المراقب العام', color: 'indigo' },
                                        PENDING_HR: { label: 'عند الموارد البشرية', color: 'amber' },
                                        PENDING_FINANCE: { label: 'عند المالية', color: 'teal' },
                                        APPROVED: { label: 'تم الاعتماد النهائي', color: 'emerald' }
                                    }[record.status] || { label: record.status, color: 'slate' };

                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/60 transition-all duration-300 group cursor-pointer border-r-4 border-transparent hover:border-blue-500">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                                                        {worker?.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{worker?.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter">REF: {worker?.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-slate-200"></div>
                                                    <span className="text-slate-600 font-bold uppercase tracking-tight">{area?.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex justify-center">
                                                    <Badge className={`
                                                        bg-${statusConfig.color}-50 text-${statusConfig.color}-700 
                                                        border border-${statusConfig.color}-200/50 px-4 py-1.5 font-black text-[11px] rounded-[10px] shadow-sm shadow-${statusConfig.color}-100/20
                                                    `}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="text-slate-500 text-xs font-bold tracking-tight">
                                                    {new Date(record.updatedAt).toLocaleDateString('ar-JO', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-500">
                                                    <ChevronRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-[-2px]" />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {attendanceRecords.filter(r => r.month === month && r.year === year).length === 0 && (
                        <div className="p-32 text-center bg-gray-50/10">
                            <div className="bg-slate-100/5 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                                <Activity className="h-12 w-12 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-black text-xl italic tracking-tight">لا توجد سجلات مكتشفة لهذه الفترة حتى الآن</p>
                            <p className="text-slate-300 text-sm mt-2 font-medium">سيتم عرض البيانات الحية هنا فور بدء المراقبين برفع سجلاتهم</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
