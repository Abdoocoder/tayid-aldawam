"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import {
    Activity,
    Users,
    CheckCircle2,
    Clock,
    AlertCircle,
    TrendingUp,
    BarChart3,
    Search,
    PieChart,
    ChevronRight,
    Loader2
} from "lucide-react";
export function MayorView() {
    const { workers, attendanceRecords, areas, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    const stats = useMemo(() => {
        const periodRecords = attendanceRecords.filter(r => r.month === month && r.year === year);
        const totalPendingSupervisor = periodRecords.filter(r => r.status === 'PENDING_SUPERVISOR').length;
        const totalPendingGS = periodRecords.filter(r => r.status === 'PENDING_GS').length;
        const totalPendingHR = periodRecords.filter(r => r.status === 'PENDING_HR').length;
        const totalPendingFinance = periodRecords.filter(r => r.status === 'PENDING_FINANCE').length;
        const totalApproved = periodRecords.filter(r => r.status === 'APPROVED').length;

        // Calculate total financial value for approved records
        const approvedAmount = periodRecords
            .filter(r => r.status === 'APPROVED')
            .reduce((sum, r) => {
                const worker = workers.find(w => w.id === r.workerId);
                if (!worker) return sum;
                return sum + (r.totalCalculatedDays * worker.dayValue);
            }, 0);

        return {
            totalPendingSupervisor,
            totalPendingGS,
            totalPendingHR,
            totalPendingFinance,
            totalApproved,
            approvedAmount,
            totalWorkers: workers.length,
            activeWorkersThisMonth: new Set(periodRecords.map(r => r.workerId)).size
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
        }).sort((a, b) => b.totalCount - a.totalCount);
    }, [areas, workers, attendanceRecords, month, year]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header section with glassmorphism */}
            <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-white/20 backdrop-blur-md p-4 rounded-2xl border border-white/30 shadow-inner">
                            <Activity className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">لوحة رئيس البلدية</h2>
                            <p className="text-emerald-100 font-medium opacity-90">مراقبة سير العمل واعتمادات تأييد الدوام</p>
                        </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/20 flex gap-2">
                        <MonthYearPicker
                            month={month}
                            year={year}
                            onChange={(m, y) => { setMonth(m); setYear(y); }}
                        />
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[-50px] left-[-0px] w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl"></div>
            </div>

            {/* Top Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Users className="h-6 w-6" />
                            </div>
                            <Badge className="bg-blue-50 text-blue-700 border-none">إجمالي العمال</Badge>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800">{stats.totalWorkers}</p>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                {stats.activeWorkersThisMonth} عامل نشط هذا الشهر
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                                <Clock className="h-6 w-6" />
                            </div>
                            <Badge className="bg-amber-50 text-amber-700 border-none">قيد المعالجة</Badge>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800">
                                {stats.totalPendingSupervisor + stats.totalPendingGS + stats.totalPendingHR + stats.totalPendingFinance}
                            </p>
                            <p className="text-sm text-slate-500 font-medium mt-1">سجل لم يكتمل اعتماده بعد</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-110 transition-transform">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-700 border-none">مكتمل</Badge>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800">{stats.totalApproved}</p>
                            <p className="text-sm text-slate-500 font-medium mt-1">تم توقيعها بالكامل</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-white group">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <Badge className="bg-purple-50 text-purple-700 border-none">القيمة المالية</Badge>
                        </div>
                        <div>
                            <p className="text-3xl font-black text-slate-800">{stats.approvedAmount.toLocaleString()} <span className="text-sm font-bold">د.ل</span></p>
                            <p className="text-sm text-slate-500 font-medium mt-1">للسجلات المعتمدة نهائياً</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workflow Progress Visualization */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-xl font-bold text-slate-800">تتبع مراحل العمل</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="relative">
                            {/* Workflow line */}
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -translate-y-1/2 rounded-full hidden md:block"></div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center relative z-10">
                                {[
                                    { label: "المراقب", count: stats.totalPendingSupervisor, icon: Users, color: "blue" },
                                    { label: "المراقب العام", count: stats.totalPendingGS, icon: ShieldCheck, color: "indigo" },
                                    { label: "الموارد البشرية", count: stats.totalPendingHR, icon: Briefcase, color: "amber" },
                                    { label: "المالية", count: stats.totalPendingFinance, icon: Landmark, color: "teal" },
                                    { label: "تم الاعتماد", count: stats.totalApproved, icon: CheckCircle2, color: "emerald" }
                                ].map((step) => (
                                    <div key={step.label} className="flex flex-col items-center group">
                                        <div className={`
                                            w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-500 shadow-lg
                                            ${step.count > 0 ? `bg-${step.color}-600 text-white scale-110 rotate-3` : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'}
                                        `}>
                                            <step.icon className="h-8 w-8" />
                                        </div>
                                        <span className={`text-sm font-bold mb-1 ${step.count > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{step.label}</span>
                                        <Badge variant={step.count > 0 ? "default" : "outline"} className={`
                                            ${step.count > 0 ? `bg-${step.color}-100 text-${step.color}-700 border-none` : 'bg-transparent text-slate-300 border-slate-200'}
                                            font-black px-3
                                        `}>
                                            {step.count}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-12 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex items-center gap-4 mb-4">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <p className="text-sm font-bold text-slate-700">تحليل العوائق</p>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                {stats.totalPendingSupervisor > 5 ?
                                    `هناك عدد مرتفع من السجلات (${stats.totalPendingSupervisor}) لا تزال عند المراقبين الميدانيين. قد يتطلب الأمر توجيهاً لتسريع الرفع.`
                                    : stats.totalPendingGS > 5 ?
                                        `تتجمع السجلات حالياً عند المراقب العام، يرجى متابعة سرعة الاعتماد الأولي.`
                                        : "سير العمل طبيعي ومنتظم عبر جميع القنوات."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress by Area */}
                <Card className="border-none shadow-xl bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6">
                        <div className="flex items-center gap-3">
                            <PieChart className="h-5 w-5 text-emerald-600" />
                            <CardTitle className="text-xl font-bold text-slate-800">إنجاز القطاعات</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[450px] overflow-y-auto p-2">
                            {areaProgress.map((area) => (
                                <div key={area.id} className="p-4 hover:bg-slate-50 rounded-xl transition-colors group cursor-default">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-slate-700 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">{area.name}</span>
                                        <span className="text-xs font-black text-slate-400">{area.percentage}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ease-out rounded-full"
                                            style={{ width: `${area.percentage}%` }}
                                        ></div>
                                    </div>
                                    <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-400">
                                        <span>{area.approvedCount} معتمد</span>
                                        <span>{area.pendingCount} متبقي</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Summary Table */}
            <Card className="border-none shadow-xl bg-white overflow-hidden">
                <CardHeader className="border-b border-slate-50 bg-slate-50/50 p-6 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Search className="h-5 w-5 text-emerald-600" />
                        <CardTitle className="text-xl font-bold text-slate-800">آخر التحديثات</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4">العامل</th>
                                <th className="p-4">القطاع</th>
                                <th className="p-4">المرحلة الحالية</th>
                                <th className="p-4">تاريخ التحديث</th>
                                <th className="p-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {attendanceRecords
                                .filter(r => r.month === month && r.year === year)
                                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                .slice(0, 10)
                                .map(record => {
                                    const worker = workers.find(w => w.id === record.workerId);
                                    const area = areas.find(a => a.id === worker?.areaId);
                                    return (
                                        <tr key={record.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{worker?.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">ID: {worker?.id}</div>
                                            </td>
                                            <td className="p-4 text-slate-600 font-medium">{area?.name}</td>
                                            <td className="p-4">
                                                <Badge className={`
                                                    ${record.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' :
                                                        record.status.startsWith('PENDING') ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}
                                                    border-none px-3 py-1 font-bold
                                                `}>
                                                    {record.status === 'PENDING_SUPERVISOR' && 'عند المراقب'}
                                                    {record.status === 'PENDING_GS' && 'عند المراقب العام'}
                                                    {record.status === 'PENDING_HR' && 'عند الموارد البشرية'}
                                                    {record.status === 'PENDING_FINANCE' && 'عند المالية'}
                                                    {record.status === 'APPROVED' && 'تم الاعتماد النهائي'}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-slate-400 text-xs font-medium">
                                                {new Date(record.updatedAt).toLocaleDateString('ar-LY')}
                                            </td>
                                            <td className="p-4">
                                                <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-emerald-500 transition-all group-hover:translate-x-[-4px]" />
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                    {attendanceRecords.filter(r => r.month === month && r.year === year).length === 0 && (
                        <div className="p-20 text-center">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Activity className="h-10 w-10 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold italic">لا توجد سجلات مكتشفة لهذه الفترة حتى الآن</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Additional icons for the workflow steps
function ShieldCheck(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
    )
}

function Briefcase(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
    )
}

function Landmark(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <line x1="3" x2="21" y1="22" y2="22" />
            <line x1="6" x2="6" y1="18" y2="11" />
            <line x1="10" x2="10" y1="18" y2="11" />
            <line x1="14" x2="14" y1="18" y2="11" />
            <line x1="18" x2="18" y1="18" y2="11" />
            <polygon points="12 2 20 7 4 7" />
        </svg>
    )
}
