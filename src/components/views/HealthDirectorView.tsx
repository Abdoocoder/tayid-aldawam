"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
    Activity,
    Search,
    Printer,
    ShieldCheck,
    Loader2,
    CheckCircle2,
    XCircle,
    MapPin,
    User as UserIcon,
    TrendingUp
} from "lucide-react";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

export function HealthDirectorView() {
    const { currentUser, workers, attendanceRecords, areas, approveAttendance, rejectAttendance, isLoading } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());

    // Analytics: Stage tracking
    const stageStats = useMemo(() => {
        const stats = {
            supervisor: 0,
            general: 0,
            health: 0,
            completed: 0
        };

        attendanceRecords.forEach(r => {
            if (r.month === month && r.year === year) {
                if (r.status === 'PENDING_SUPERVISOR') stats.supervisor++;
                else if (r.status === 'PENDING_GS') stats.general++;
                else if (r.status === 'PENDING_HEALTH') stats.health++;
                else stats.completed++;
            }
        });

        return stats;
    }, [attendanceRecords, month, year]);

    const filteredRecords = attendanceRecords.filter(r => {
        const worker = workers.find(w => w.id === r.workerId);
        if (!worker) return false;

        const isCorrectPeriod = r.month === month && r.year === year;
        const isPendingHealth = r.status === 'PENDING_HEALTH';
        const matchesArea = selectedAreaId === 'ALL' || worker.areaId === selectedAreaId;
        const matchesSearch = worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            worker.id.includes(searchTerm);

        return isCorrectPeriod && isPendingHealth && matchesArea && matchesSearch;
    });

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

    const handleReject = async (recordId: string) => {
        if (!confirm("هل أنت متأكد من رفض هذا السجل وإعادته للمراقب العام؟")) return;
        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
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
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-3xl shadow-xl shadow-emerald-900/5 border border-emerald-50">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 p-4 rounded-2xl text-white shadow-lg shadow-emerald-200 animate-in zoom-in-50 duration-500">
                        <Activity className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900">لوحة مدير الدائرة الصحية</h2>
                        <p className="text-emerald-600 font-bold flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            اعتماد ومتابعة مسار الدوام الصحي
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 w-full lg:w-auto">
                    <Button variant="outline" onClick={() => window.print()} className="gap-2 border-emerald-100 text-emerald-700 hover:bg-emerald-50 rounded-xl h-12">
                        <Printer className="h-5 w-5" />
                        تقرير الحضور
                    </Button>
                    <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                </div>
            </div>

            {/* Workflow Progress Monitoring */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'مرحلة المراقب', value: stageStats.supervisor, color: 'blue', icon: UserIcon },
                    { label: 'مرحلة المراقب العام', value: stageStats.general, color: 'indigo', icon: ShieldCheck },
                    { label: 'بانتظار اعتمادك', value: stageStats.health, color: 'emerald', icon: Activity },
                    { label: 'تم التحويل للموارد', value: stageStats.completed, color: 'slate', icon: CheckCircle2 }
                ].map((stat, i) => (
                    <Card key={i} className={`border-none shadow-sm bg-${stat.color}-50/50 hover:bg-${stat.color}-50 transition-colors cursor-default`}>
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className={`text-xs font-black text-${stat.color}-600 uppercase tracking-wider mb-1`}>{stat.label}</p>
                                <p className={`text-3xl font-black text-${stat.color}-900`}>{stat.value}</p>
                            </div>
                            <div className={`bg-${stat.color}-100 p-3 rounded-xl text-${stat.color}-600`}>
                                <stat.icon className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Action Area */}
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 bg-slate-50 p-1 rounded-2xl w-full md:w-auto">
                        <div className="relative flex-1 md:w-[300px]">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="ابحث عن عامل أو رقم الموظف..."
                                className="pr-10 bg-transparent border-none focus-visible:ring-0 shadow-none text-sm font-bold"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select
                            className="w-[200px] border-none bg-white shadow-sm ring-0 rounded-xl"
                            value={selectedAreaId}
                            onChange={e => setSelectedAreaId(e.target.value)}
                        >
                            <option value="ALL">جميع القطاعات</option>
                            {areas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </Select>
                    </div>

                    {filteredRecords.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-4 py-2">
                                {filteredRecords.length} سجلات تحتاج قرارك
                            </Badge>
                        </div>
                    )}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-400 text-[11px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="p-5">معلومات الموظف</th>
                                <th className="p-5">القطاع / المنطقة</th>
                                <th className="p-5 text-center">أيام العمل</th>
                                <th className="p-5 text-center">الدورات الإضافية</th>
                                <th className="p-5 text-center">الاستحقاق النهائي</th>
                                <th className="p-5 text-center">القرار الإداري</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRecords.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center">
                                        <div className="flex flex-col items-center gap-4 opacity-20">
                                            <ShieldCheck className="h-16 w-16" />
                                            <p className="text-xl font-bold">لا توجد سجلات بانتظار الاعتماد الصحي في هذه الفترة</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredRecords.map(record => {
                                    const worker = workers.find(w => w.id === record.workerId);
                                    const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                                    return (
                                        <tr key={record.id} className="hover:bg-emerald-50/20 transition-all group">
                                            <td className="p-5">
                                                <div className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors uppercase tracking-tight">
                                                    {worker?.name}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[9px] font-mono border-slate-200 text-slate-400">
                                                        ID: {worker?.id}
                                                    </Badge>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex items-center gap-2 text-slate-600 font-bold">
                                                    <MapPin className="h-4 w-4 opacity-30" />
                                                    {areaName}
                                                </div>
                                            </td>
                                            <td className="p-5 text-center font-black text-slate-600 text-lg">
                                                {record.normalDays}
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex justify-center gap-1">
                                                    <span className="bg-blue-50 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">ع: {record.overtimeNormalDays}</span>
                                                    <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">عط: {record.overtimeHolidayDays}</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-xl font-black shadow-lg shadow-emerald-100">
                                                    {record.totalCalculatedDays}
                                                    <span className="text-[10px] opacity-70">يوم</span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex justify-center gap-3">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleApprove(record.id)}
                                                        disabled={approvingIds.has(record.id)}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black h-10 px-6 rounded-xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
                                                    >
                                                        {approvingIds.has(record.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                <CheckCircle2 className="h-4 w-4" />
                                                                اعتماد الإدارة
                                                            </div>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleReject(record.id)}
                                                        disabled={rejectingIds.has(record.id) || approvingIds.has(record.id)}
                                                        className="h-10 px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-xl"
                                                    >
                                                        {rejectingIds.has(record.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <XCircle className="h-5 w-5" />
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

            {/* Printable Area - Hidden by default */}
            <div className="hidden print:block">
                <div className="text-center mb-8 border-b-4 border-emerald-600 pb-6">
                    <h1 className="text-3xl font-black mb-2">تقرير اعتماد الدائرة الصحية</h1>
                    <p className="text-slate-600 font-bold">
                        الفترة المالية: {month}/{year} | صادق عليه: {currentUser?.name}
                    </p>
                    <div className="mt-4 inline-block bg-emerald-50 px-6 py-2 rounded-full text-emerald-700 font-black border border-emerald-200 uppercase tracking-widest text-xs">
                        نظام تأييد الدوام الذكي
                    </div>
                </div>

                <table className="w-full border-collapse border border-slate-300 text-sm">
                    <thead>
                        <tr className="bg-slate-100 font-black text-slate-900 border-b-2 border-slate-300">
                            <th className="border border-slate-300 p-3 text-right">اسم الموظف</th>
                            <th className="border border-slate-300 p-3 text-right">المنطقة</th>
                            <th className="border border-slate-300 p-3 text-center">أيام العمل</th>
                            <th className="border border-slate-300 p-3 text-center">الإضافي</th>
                            <th className="border border-slate-300 p-3 text-center">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRecords.map(record => {
                            const worker = workers.find(w => w.id === record.workerId);
                            const areaName = areas.find(a => a.id === worker?.areaId)?.name || 'غير معروف';
                            return (
                                <tr key={record.id} className="border-b border-slate-200">
                                    <td className="border border-slate-300 p-3 font-bold">{worker?.name}</td>
                                    <td className="border border-slate-300 p-3">{areaName}</td>
                                    <td className="border border-slate-300 p-3 text-center">{record.normalDays}</td>
                                    <td className="border border-slate-300 p-3 text-center">{record.overtimeNormalDays + record.overtimeHolidayDays}</td>
                                    <td className="border border-slate-300 p-3 text-center font-black">{record.totalCalculatedDays}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-16 grid grid-cols-3 gap-12 text-center">
                    <div className="space-y-12">
                        <div className="font-black border-t-2 border-slate-900 pt-3">مدير الدائرة الصحية</div>
                    </div>
                    <div className="space-y-12">
                        <div className="font-black border-t-2 border-slate-900 pt-3">المراقب العام</div>
                    </div>
                    <div className="space-y-12">
                        <div className="font-black border-t-2 border-slate-900 pt-3">ختم البلدية الرسمي</div>
                    </div>
                </div>

                <div className="mt-20 text-[10px] text-slate-400 text-center font-mono">
                    تم إنشاء هذا التقرير آلياً بتاريخ {new Date().toLocaleString('ar-JO')}
                </div>
            </div>
        </div>
    );
}
