"use client";

import React, { useState, useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Button } from "../ui/button";
import Image from "next/image";
import { Badge } from "../ui/badge";
import { MobileNav } from "../ui/mobile-nav";
import {
    Activity,
    Users,
    Clock,
    TrendingUp,
    Loader2,
    ShieldCheck,
    Target,
    Printer,
    Menu,
    LayoutDashboard
} from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { motion } from "framer-motion";

export function MayorView() {
    const { currentUser, workers, attendanceRecords, areas, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'نظرة استراتيجية', icon: LayoutDashboard },
        { id: 'report', label: 'تقرير استراتيجي', icon: Printer },
    ];

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
            AUDIT: periodRecords.filter(r => r.status === 'PENDING_AUDIT').length,
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
            <MobileNav
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab="overview"
                onTabChange={(id) => id === 'report' ? window.print() : null}
                user={{ name: currentUser?.name || "عطوفة العمدة", role: "رئاسة البلدية" }}
            />

            <div className="space-y-6 pb-24 min-h-screen print:hidden">
                {/* Executive Header - Ultra Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/5 shadow-sm print:hidden">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="bg-gradient-to-br from-fuchsia-600 to-purple-700 p-2.5 rounded-2xl text-white shadow-xl shadow-fuchsia-500/20 ring-1 ring-white/30">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">رئاسة البلدية</h2>
                                    <Badge className="bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-700 dark:text-fuchsia-400 border-fuchsia-100 dark:border-fuchsia-800 text-[9px] font-black uppercase tracking-tighter">Executive</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-right">نظام الرقابة والحوكمة الذكي</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <ThemeToggle />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="hidden md:flex gap-2 text-fuchsia-600 hover:bg-fuchsia-50 rounded-xl font-black"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="text-xs">تقرير استراتيجي</span>
                            </Button>

                            <div className="hidden md:block">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>

                            {/* Mobile Menu & Theme Trigger */}
                            <div className="md:hidden flex items-center gap-2">
                                <ThemeToggle />
                                <button
                                    onClick={() => setIsMobileNavOpen(true)}
                                    className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-400 shadow-sm active:scale-95 transition-all"
                                >
                                    <Menu className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Date Picker Bar */}
                    <div className="md:hidden mt-3 px-1">
                        <div className="bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200/50 dark:border-white/5 backdrop-blur-sm shadow-inner w-full">
                            <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                        </div>
                    </div>
                </div>

                {/* Strategic Overview Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1"
                >
                    {[
                        {
                            label: "القوة العاملة",
                            value: stats.totalWorkers,
                            unit: "عامل",
                            icon: Users,
                            gradient: 'from-blue-600 to-blue-700',
                            desc: "إجمالي السجلات"
                        },
                        {
                            label: "قيد المراجعة",
                            value: stats.totalPending,
                            unit: "مهمة",
                            icon: Clock,
                            gradient: 'from-amber-600 to-amber-700',
                            desc: "بانتظار التدقيق"
                        },
                        {
                            label: "نسبة الإنجاز",
                            value: stats.completionRate,
                            unit: "%",
                            icon: Target,
                            gradient: 'from-emerald-600 to-emerald-700',
                            desc: "الكفاءة الكلية"
                        },
                        {
                            label: "الميزانية المعتمدة",
                            value: stats.approvedAmount.toLocaleString(),
                            unit: "د.أ",
                            icon: TrendingUp,
                            gradient: 'from-fuchsia-600 to-fuchsia-700',
                            desc: "المستحقات الحالية"
                        }
                    ].map((kpi, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className={`relative group overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-[2rem] p-5 text-white shadow-lg transition-all duration-500 hover:shadow-xl`}
                        >
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 blur-2xl" />

                            <div className="relative z-10 flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl ring-1 ring-white/30 group-hover:scale-110 transition-transform duration-500">
                                        <kpi.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="text-[8px] font-black px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 uppercase tracking-widest">
                                        Active
                                    </div>
                                </div>

                                <div>
                                    <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-0.5">{kpi.label}</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black tracking-tighter">{kpi.value}</span>
                                        <span className="text-[9px] font-bold text-white/60 uppercase">{kpi.unit}</span>
                                    </div>
                                    <p className="text-white/60 text-[9px] font-bold mt-1.5 flex items-center gap-1.5">
                                        <span className="w-1 h-1 rounded-full bg-white/40 animate-pulse" />
                                        {kpi.desc}
                                    </p>
                                </div>
                            </div>

                            <kpi.icon className="absolute -bottom-4 -right-4 h-20 w-20 text-white/10 -rotate-12 transition-transform group-hover:scale-110 group-hover:rotate-0 duration-700" />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Analytics Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Process Funnel Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 bg-white/60 backdrop-blur-xl p-8 rounded-2xl border border-white/40 shadow-xl shadow-slate-200/50"
                    >
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

                        <div className="h-64 mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={[
                                        { name: "المراقب", count: stats.pendingStages.SUPERVISOR, color: "#3b82f6" },
                                        { name: "المراقب العام", count: stats.pendingStages.GS, color: "#6366f1" },
                                        { name: "الصحة", count: stats.pendingStages.HEALTH, color: "#10b981" },
                                        { name: "الموارد", count: stats.pendingStages.HR, color: "#f59e0b" },
                                        { name: "الرقابة", count: stats.pendingStages.AUDIT, color: "#f43f5e" },
                                        { name: "المالية", count: stats.pendingStages.FINANCE, color: "#14b8a6" },
                                        { name: "الاعتماد", count: stats.totalApproved, color: "#d946ef" }
                                    ]}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        fontSize={10}
                                        fontWeight="bold"
                                        stroke="#64748b"
                                        dy={10}
                                    />
                                    <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" stroke="#64748b" />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                return (
                                                    <div className="bg-white dark:bg-slate-900 p-3 border border-slate-100 dark:border-white/10 shadow-xl rounded-xl">
                                                        <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">{data.name}</p>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white">{payload[0].value as number} <span className="text-[10px] text-slate-400 dark:text-slate-500">سجل</span></p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                        {[
                                            { color: "#3b82f6" },
                                            { color: "#6366f1" },
                                            { color: "#10b981" },
                                            { color: "#f59e0b" },
                                            { color: "#f43f5e" },
                                            { color: "#14b8a6" },
                                            { color: "#d946ef" }
                                        ].map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-white/50 dark:from-slate-900/50 dark:to-slate-950/50 border border-slate-100 dark:border-white/5 p-5 rounded-2xl relative overflow-hidden">
                            <div className="flex gap-4">
                                <div className="w-1.5 h-auto bg-fuchsia-600 rounded-full"></div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase">موجز الحالة الذكي</h4>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                        {stats.totalPending > 10 ?
                                            `تم رصد تكدس في العمليات الإجمالية (${stats.totalPending} سجل). يوصى بتشجيع المديرين على إنهاء الاعتمادات العالقة.` :
                                            "منظومة العمل تسير بكفاءة عالية وفق الجدول الزمني المحدد."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Regional Performance Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-2xl border border-white/40 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-none"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-indigo-50 rounded-2xl text-indigo-600">
                                <Target className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">ترتيب المناطق</h3>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">كفاءة الإنجاز المعتمد</p>
                            </div>
                        </div>

                        <div className="space-y-5 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar">
                            {areaProgress.map((area, idx) => (
                                <div key={area.id} className="group">
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-xs font-black text-slate-700 dark:text-slate-200 group-hover:text-fuchsia-600 transition-colors uppercase">{area.name}</span>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-white/5">{area.percentage}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/30 dark:border-white/5">
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
                    </motion.div>
                </div>

                {/* Live Updates Table - Clean Glass */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-white/60 dark:border-white/5 overflow-hidden mx-1"
                >
                    <div className="p-6 border-b border-white/40 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-6 bg-fuchsia-600 rounded-full"></div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">آخر المعاملات المسجلة</h3>
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
                                            PENDING_AUDIT: { label: 'الرقابة الداخلية', color: 'rose' },
                                            PENDING_FINANCE: { label: 'المالية', color: 'teal' },
                                            PENDING_PAYROLL: { label: 'الرواتب', color: 'cyan' },
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
                </motion.div>
            </div>

            {/* Printable Area for Executive Overview - Standardized Official Layout */}
            <div className="fixed top-0 left-0 w-0 h-0 invisible overflow-hidden print:visible print:static print:w-full print:h-auto print:overflow-visible bg-white z-[9999]">
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
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">القوة العاملة الإجمالية</p>
                        <p className="text-4xl font-black text-slate-900">{stats.totalWorkers} عامل</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">نسبة الإنجاز الكلية</p>
                        <p className="text-4xl font-black text-slate-900">{stats.completionRate}%</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                        <p className="text-xs font-black text-slate-400 uppercase mb-2">المستحقات المعتمدة</p>
                        <p className="text-4xl font-black text-slate-900">{stats.approvedAmount.toLocaleString()} د.أ</p>
                    </div>
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
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
