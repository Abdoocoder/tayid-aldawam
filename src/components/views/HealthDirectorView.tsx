"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Image from "next/image";
import {
    Activity,
    Search,
    CheckCircle2,
    XCircle,
    MapPin,
    User as UserIcon,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Coins,
    History,
    Printer,
    ShieldCheck,
    Loader2
} from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

export function HealthDirectorView() {
    const { currentUser, workers, attendanceRecords, areas, approveAttendance, rejectAttendance, isLoading, users } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
    const [selectedSupervisorId, setSelectedSupervisorId] = useState<string>("ALL");
    const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
    const [isBulkApproving, setIsBulkApproving] = useState(false);

    const supervisors = useMemo(() => users.filter(u => u.role === 'SUPERVISOR'), [users]);

    // Analytics: Stage tracking
    const analytics = useMemo(() => {
        const currentMonthRecords = attendanceRecords.filter(r => r.month === month && r.year === year);
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        const prevMonthRecords = attendanceRecords.filter(r => r.month === prevMonth && r.year === prevYear);

        const calculateCost = (recordsToCalculate: typeof attendanceRecords) => {
            return recordsToCalculate.reduce((total, r) => {
                const worker = workers.find(w => w.id === r.workerId);
                return total + (r.totalCalculatedDays * (worker?.dayValue || 0));
            }, 0);
        };

        const currentCost = calculateCost(currentMonthRecords);
        const prevCost = calculateCost(prevMonthRecords);
        const costDiff = prevCost === 0 ? 0 : ((currentCost - prevCost) / prevCost) * 100;

        const stats = {
            supervisor: 0,
            general: 0,
            health: 0,
            completed: 0,
            totalCost: currentCost,
            costDiff,
            anomalies: 0
        };

        currentMonthRecords.forEach(r => {
            if (r.status === 'PENDING_SUPERVISOR') stats.supervisor++;
            else if (r.status === 'PENDING_GS') stats.general++;
            else if (r.status === 'PENDING_HEALTH') stats.health++;
            else stats.completed++;

            if (r.totalCalculatedDays > 30 || r.overtimeNormalDays > 15 || r.overtimeHolidayDays > 10) {
                stats.anomalies++;
            }
        });

        return stats;
    }, [attendanceRecords, workers, month, year]);

    const filteredRecords = useMemo(() => {
        return attendanceRecords.filter(r => {
            const worker = workers.find(w => w.id === r.workerId);
            if (!worker) return false;

            const isCorrectPeriod = r.month === month && r.year === year;
            const isPendingHealth = r.status === 'PENDING_HEALTH';

            // Hierarchy filter
            const matchesArea = selectedAreaId === 'ALL' || worker.areaId === selectedAreaId;
            const supervisor = supervisors.find(s => s.id === selectedSupervisorId);
            const matchesSupervisor = selectedSupervisorId === 'ALL' ||
                (supervisor?.areas?.some(a => a.id === worker.areaId) || supervisor?.areaId === worker.areaId);

            const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                worker.id.includes(searchTerm);

            const isAnomaly = r.totalCalculatedDays > 30 || r.overtimeNormalDays > 15 || r.overtimeHolidayDays > 10;
            const matchesAnomaly = !showAnomaliesOnly || isAnomaly;

            return isCorrectPeriod && isPendingHealth && matchesArea && matchesSupervisor && matchesSearch && matchesAnomaly;
        });
    }, [attendanceRecords, workers, month, year, selectedAreaId, selectedSupervisorId, searchTerm, showAnomaliesOnly, supervisors]);

    const handleApprove = async (recordId: string) => {
        setApprovingIds(prev => new Set(prev).add(recordId));
        try {
            await approveAttendance(recordId, 'PENDING_HR');
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
        if (!confirm(`هل أنت متأكد من اعتماد جميع السجلات المفلترة (${filteredRecords.length} سجل)؟`)) return;
        setIsBulkApproving(true);
        try {
            for (const record of filteredRecords) {
                await approveAttendance(record.id, 'PENDING_HR');
            }
        } catch (err) {
            console.error("Bulk approval failed:", err);
        } finally {
            setIsBulkApproving(false);
        }
    };

    const handleReject = async (recordId: string) => {
        const reason = prompt("يرجى كتابة سبب الرفض ليظهر للمراقب العام:");
        if (!reason) return;

        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
            // We use audit log or a field if it exists, but for now we just log it
            await rejectAttendance(recordId, 'PENDING_GS');
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
                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <>
            <div className="space-y-8 pb-12 animate-in fade-in duration-700 print:hidden">
                {/* Header Section with Glassmorphism */}
                <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl shadow-emerald-900/10 border border-white/40">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/30 rounded-full blur-3xl -mr-20 -mt-20 shrink-0" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-100/20 rounded-full blur-2xl -ml-10 -mb-10 shrink-0" />

                    <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-5 rounded-3xl text-white shadow-xl shadow-emerald-200 ring-4 ring-emerald-50 animate-in zoom-in-50 duration-500">
                                <Activity className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-4xl font-black text-slate-900 tracking-tight">لوحة مدير الدائرة الصحية</h2>
                                <p className="text-emerald-600 font-bold flex items-center gap-2 mt-1">
                                    <TrendingUp className="h-5 w-5" />
                                    <span className="text-lg">اعتماد ومتابعة مسار الدوام الصحي</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                            <Button
                                variant="outline"
                                onClick={() => window.print()}
                                className="gap-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50/50 rounded-2xl h-14 px-6 font-bold shadow-sm transition-all hover:scale-[1.02]"
                            >
                                <Printer className="h-5 w-5" />
                                تقرير الحضور
                            </Button>
                            <MonthYearPicker
                                month={month}
                                year={year}
                                onChange={(m, y) => { setMonth(m); setYear(y); }}
                            />
                        </div>
                    </div>
                </div>

                {/* Enhanced KPI Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                    {[
                        { label: 'بانتظار اعتمادك', value: analytics.health, color: 'emerald', icon: Activity, desc: 'تحت المراجعة' },
                        { label: 'تم التحويل للموارد', value: analytics.completed, color: 'slate', icon: CheckCircle2, desc: 'سجلات معتمدة' },
                        { label: 'مرحلة المراقب العام', value: analytics.general, color: 'indigo', icon: ShieldCheck, desc: 'سجلات مدققة' },
                        {
                            label: 'التكلفة التقديرية',
                            value: `${analytics.totalCost.toLocaleString()} د.أ`,
                            color: 'amber',
                            icon: Coins,
                            desc: analytics.costDiff !== 0 ? (
                                <span className={`flex items-center gap-1 ${analytics.costDiff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                    {analytics.costDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {Math.abs(analytics.costDiff).toFixed(1)}% عن الشهر الماضي
                                </span>
                            ) : 'لا يوجد بيانات سابقة'
                        },
                        {
                            label: 'تنبيهات الحضور',
                            value: analytics.anomalies,
                            color: analytics.anomalies > 0 ? 'rose' : 'slate',
                            icon: AlertTriangle,
                            desc: 'سجلات تتطلب مراجعة دقيقة'
                        }
                    ].map((stat, i) => (
                        <Card key={i} className={`group relative border-none shadow-xl shadow-slate-200/40 bg-white hover:bg-${stat.color}-50/30 transition-all duration-300 rounded-[2rem] overflow-hidden`}>
                            <div className={`absolute top-0 right-0 w-1.5 h-full bg-${stat.color}-500/50`} />
                            <CardContent className="p-6 flex flex-col justify-between h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`bg-${stat.color}-50 p-3 rounded-2xl text-${stat.color}-600`}>
                                        <stat.icon className="h-6 w-6" />
                                    </div>
                                    <p className={`text-[10px] font-black text-${stat.color}-600 uppercase tracking-[0.15em] opacity-80`}>{stat.label}</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-slate-900 tracking-tight mb-1">{stat.value}</p>
                                    <div className="text-xs text-slate-400 font-bold">{stat.desc}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Main Action Area */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden transition-all duration-500">
                    <div className="p-8 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-6 bg-slate-50/30">
                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full xl:w-auto">
                            <div className="relative group flex-1 md:w-[320px]">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                                <Input
                                    placeholder="ابحث عن عامل أو رقم الموظف..."
                                    className="pr-12 h-14 bg-white border-2 border-slate-100 focus:border-emerald-500 rounded-2xl text-base font-bold transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <Select
                                    className="h-14 min-w-[180px] border-2 border-slate-100 bg-white rounded-2xl font-bold shadow-sm"
                                    value={selectedSupervisorId}
                                    onChange={e => setSelectedSupervisorId(e.target.value)}
                                >
                                    <option value="ALL">جميع المراقبين</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </Select>
                                <Select
                                    className="h-14 min-w-[180px] border-2 border-slate-100 bg-white rounded-2xl font-bold shadow-sm"
                                    value={selectedAreaId}
                                    onChange={e => setSelectedAreaId(e.target.value)}
                                >
                                    <option value="ALL">جميع المناطق</option>
                                    {areas.map(area => (
                                        <option key={area.id} value={area.id}>{area.name}</option>
                                    ))}
                                </Select>
                                <Button
                                    variant={showAnomaliesOnly ? 'destructive' : 'outline'}
                                    onClick={() => setShowAnomaliesOnly(!showAnomaliesOnly)}
                                    className={`h-14 px-6 rounded-2xl font-bold transition-all gap-2 ${!showAnomaliesOnly && 'border-slate-100 text-slate-600'}`}
                                >
                                    <AlertTriangle className="h-5 w-5" />
                                    {showAnomaliesOnly ? 'عرض الكل' : 'عرض التنبيهات فقط'}
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 w-full xl:w-auto justify-end">
                            {filteredRecords.length > 0 && (
                                <div className="flex items-center gap-3">
                                    <Badge className="bg-emerald-50 text-emerald-700 border-2 border-emerald-100 font-black px-6 py-3 rounded-2xl text-sm shadow-sm">
                                        {filteredRecords.length} سجلات تحتاج قرارك
                                    </Badge>
                                    <Button
                                        onClick={handleBulkApprove}
                                        disabled={isBulkApproving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 px-8 rounded-2xl shadow-lg shadow-emerald-200 transition-all hover:scale-[1.02] active:scale-95 gap-2"
                                    >
                                        {isBulkApproving ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="h-5 w-5" />
                                                اعتماد الكل
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                                    <th className="p-6">الموظف / المسؤول</th>
                                    <th className="p-6">المنطقة</th>
                                    <th className="p-3 md:p-4 border-b text-center">أيام عادية</th>
                                    <th className="p-3 md:p-4 border-b text-center">إضافي عادي (x0.5)</th>
                                    <th className="p-3 md:p-4 border-b text-center">إضافي عطل (x1.0)</th>
                                    <th className="p-3 md:p-4 border-b text-center">أيام أعياد (x1.0)</th>
                                    <th className="p-3 md:p-4 border-b text-center">الإجمالي</th>
                                    <th className="p-6 text-center">حالة التدقيق</th>
                                    <th className="p-6 text-center">القرار الإداري</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredRecords.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-32 text-center">
                                            <div className="flex flex-col items-center gap-6 group">
                                                <div className="bg-slate-50 p-8 rounded-[2.5rem] group-hover:scale-110 transition-transform duration-500">
                                                    <ShieldCheck className="h-20 w-20 text-slate-200" />
                                                </div>
                                                <div className="space-y-2">
                                                    <p className="text-2xl font-black text-slate-300">لا توجد سجلات تحتاج للاعتماد</p>
                                                    <p className="text-slate-400 font-bold">كل شيء يبدو منظماً بشكل رائع</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRecords.map(record => {
                                        const worker = workers.find(w => w.id === record.workerId);
                                        const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                                        return (
                                            <tr key={record.id} className="hover:bg-emerald-50/30 transition-all group/row">
                                                <td className="p-6">
                                                    <div className="flex items-center gap-3">
                                                        {(record.totalCalculatedDays > 30 || record.overtimeNormalDays > 15 || record.overtimeHolidayDays > 10) && (
                                                            <div className="bg-rose-100 p-2 rounded-full animate-pulse shadow-sm shadow-rose-200">
                                                                <AlertTriangle className="h-5 w-5 text-rose-600" />
                                                            </div>
                                                        )}
                                                        <div>
                                                            <div className="font-black text-slate-900 group-hover/row:text-emerald-700 transition-colors text-lg tracking-tight">
                                                                {worker?.name}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="text-[10px] font-mono font-black text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                                                                    ID: {worker?.id}
                                                                </span>
                                                                <span className="text-[9px] font-bold text-slate-500 flex items-center gap-1">
                                                                    <UserIcon className="h-3 w-3" />
                                                                    المراقب: {users.find(u => u.role === 'SUPERVISOR' && (u.areaId === worker?.areaId || u.areas?.some(a => a.id === worker?.areaId)))?.name || 'غير محدد'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-6">
                                                    <div className="flex items-center gap-2 text-slate-600 font-bold">
                                                        <div className="bg-slate-100 p-2 rounded-xl">
                                                            <MapPin className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        {areaName}
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <span className="text-xl font-black text-slate-700">{record.normalDays}</span>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <Badge className="bg-blue-50 text-blue-700 border-blue-100 font-black px-3 py-1 rounded-xl">
                                                        {record.overtimeNormalDays} ع
                                                    </Badge>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 font-black px-3 py-1 rounded-xl">
                                                        {record.overtimeHolidayDays} ط
                                                    </Badge>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <Badge className="bg-purple-50 text-purple-700 border-purple-100 font-black px-4 py-1.5 rounded-xl text-sm">
                                                        {record.overtimeEidDays || 0} يوم
                                                    </Badge>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className={`inline-flex flex-col items-center bg-gradient-to-br ${record.totalCalculatedDays > 30 ? 'from-rose-600 to-rose-800' : 'from-emerald-600 to-emerald-800'} text-white px-6 py-2 rounded-2xl font-black shadow-lg shadow-emerald-200 ring-4 ring-emerald-50`}>
                                                        <span className="text-xl leading-none">{record.totalCalculatedDays}</span>
                                                        <span className="text-[10px] font-bold opacity-80 mt-0.5 uppercase tracking-tighter">يوم استحقاق</span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 font-black px-3 py-1 rounded-xl flex gap-1 items-center">
                                                            <ShieldCheck className="h-3 w-3" />
                                                            دققها المراقب العام
                                                        </Badge>
                                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 mt-1">
                                                            <History className="h-3 w-3" />
                                                            {new Date(record.updatedAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })} - {new Date(record.updatedAt).toLocaleDateString('ar-JO')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-6 text-center">
                                                    <div className="flex justify-center gap-3">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleApprove(record.id)}
                                                            disabled={approvingIds.has(record.id)}
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 px-6 rounded-2xl shadow-xl shadow-emerald-200 transition-all hover:scale-105 active:scale-95"
                                                        >
                                                            {approvingIds.has(record.id) ? (
                                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle2 className="h-5 w-5" />
                                                                    اعتماد الإدارة
                                                                </div>
                                                            )}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleReject(record.id)}
                                                            disabled={rejectingIds.has(record.id) || approvingIds.has(record.id)}
                                                            className="h-12 w-12 p-0 text-rose-500 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-2xl transition-colors"
                                                            title="رفض وإعادة للمراقب العام"
                                                        >
                                                            {rejectingIds.has(record.id) ? (
                                                                <Loader2 className="h-5 w-5 animate-spin text-rose-500" />
                                                            ) : (
                                                                <XCircle className="h-6 w-6" />
                                                            )}
                                                        </Button>
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

            </div>
            {/* Printable Area - Enhanced for Officials */}
            <div className="hidden print:block font-sans">
                <div className="text-center mb-10 border-b-[6px] border-emerald-700 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">كشف مراقبة دوام الكوادر</h1>
                            <p className="text-gray-600">الشهر: {month} / {year} | القطاع: جميع المناطق</p>
                            <p className="text-sm mt-1 text-blue-600 font-bold uppercase">مديرية الشؤون الصحية</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {new Date().toLocaleDateString('ar-JO')}</p>
                            <p>الرقم: AD/H-{year}-{month}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">تقرير اعتماد الدائرة الصحية</h1>
                    <div className="flex justify-center gap-12 mt-4">
                        <p className="text-slate-600 font-black">الشهر: <span className="text-emerald-700">{month}</span></p>
                        <p className="text-slate-600 font-black">السنة: <span className="text-emerald-700">{year}</span></p>
                        <p className="text-slate-600 font-black">المسؤول: <span className="text-emerald-700">{currentUser?.name}</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-4 text-right">م</th>
                            <th className="border-2 border-slate-900 p-4 text-right">اسم الموظف</th>
                            <th className="border-2 border-slate-900 p-4 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-4 text-right">المراقب المسؤول</th>
                            <th className="border border-gray-300 p-2 text-center">أيام عادية</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي عادي (x0.5)</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي عطل (x1.0)</th>
                            <th className="border border-gray-300 p-2 text-center">أيام أعياد (x1.0)</th>
                            <th className="border border-gray-300 p-2 text-center font-bold bg-gray-50">الإجمالي المعتمد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map((record, index) => {
                            const worker = workers.find(w => w.id === record.workerId);
                            const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                            const supervisorName = users.find(u => u.role === 'SUPERVISOR' && (u.areaId === worker?.areaId || u.areas?.some(a => a.id === worker?.areaId)))?.name || 'غير محدد';
                            return (
                                <tr key={record.id} className="border-b-2 border-slate-400">
                                    <td className="border-2 border-slate-900 p-4 text-center font-bold">{index + 1}</td>
                                    <td className="border-2 border-slate-900 p-4 font-black">{worker?.name}</td>
                                    <td className="border-2 border-slate-900 p-4">{areaName}</td>
                                    <td className="border-2 border-slate-900 p-4 text-xs">{supervisorName}</td>
                                    <td className="border-2 border-slate-900 p-4 text-center font-bold">{record.normalDays}</td>
                                    <td className="border-2 border-slate-900 p-4 text-center font-bold">{record.overtimeNormalDays}</td>
                                    <td className="border-2 border-slate-900 p-4 text-center font-bold">{record.overtimeHolidayDays}</td>
                                    <td className="border-2 border-slate-900 p-4 text-center font-bold">{record.overtimeEidDays || 0}</td>
                                    <td className="border-2 border-slate-900 p-4 text-center font-black bg-slate-50">{record.totalCalculatedDays}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2">مدير الدائرة الصحية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2">المراقب العام</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2">اعتماد عطوفة العمدة</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم الدائرة</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest">
                        نظام تأييد الدوام الذكي - الرقم المرجعي للتقرير: {Math.random().toString(36).substring(7).toUpperCase()}
                    </p>
                </div>
            </div >
        </>
    );
}
