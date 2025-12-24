"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
    Banknote,
    AlertCircle,
    Download,
    Search,
    MapPin,
    DollarSign,
    Printer,
    Users,
    Calendar,
    TrendingUp,
    CheckCircle,
    Loader2
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
        const headers = ["الرقم", "الاسم", "القطاع", "الأيام المحتسبة", "قيمة اليوم", "الصافي"];
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
        <div className="space-y-8 pb-20 animate-in fade-in duration-700">
            {/* Main Header Card */}
            <div className="relative overflow-hidden bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full -ml-24 -mb-24 opacity-30 blur-2xl"></div>

                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div className="flex items-center gap-5">
                        <div className="bg-gradient-to-br from-green-500 to-green-700 p-4 rounded-2xl text-white shadow-lg shadow-green-200 ring-4 ring-green-50">
                            <Banknote className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 leading-tight">القسم المالي</h2>
                            <p className="text-gray-500 font-medium mt-1">إدارة المستحقات والكشوفات المالية المعتمدة</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                        <div className="bg-gray-50 p-1.5 rounded-2xl border border-gray-100 flex items-center gap-2">
                            <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Insights Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'إجمالي المرتبات', value: stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'د.ل', icon: DollarSign, color: 'green', desc: 'للكشوف المعتمدة فقط' },
                    { label: 'العمال المستحقين', value: stats.workersCount, unit: 'عامل', icon: Users, color: 'blue', desc: 'تم اعتماد حضورهم' },
                    { label: 'إجمالي الأيام', value: stats.totalDays, unit: 'يوم', icon: Calendar, color: 'orange', desc: 'مجموع الأيام المحتسبة' },
                    { label: 'متوسط الراتب', value: stats.avgSalary.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), unit: 'د.ل', icon: TrendingUp, color: 'purple', desc: 'لكل عامل مستحق' }
                ].map((stat, i) => (
                    <Card key={i} className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-[1.5rem] overflow-hidden bg-white border border-transparent hover:border-gray-100">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform duration-300`}>
                                    <stat.icon className="h-6 w-6" />
                                </div>
                                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold bg-${stat.color}-50 text-${stat.color}-600 uppercase tracking-wider`}>
                                    تقرير {month}/{year}
                                </div>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs font-bold mb-1 uppercase tracking-tight">{stat.label}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-2xl font-black text-gray-900">{stat.value}</span>
                                    <span className="text-sm font-bold text-gray-400">{stat.unit}</span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {stat.desc}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Control Center */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-green-600 transition-colors" />
                        <Input
                            placeholder="بحث بالاسم، الرقم، أو القطاع..."
                            className="pr-12 h-14 bg-white border-gray-100 focus:border-green-500 focus:ring-green-500/20 rounded-2xl text-lg shadow-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative min-w-[200px]">
                        <select
                            className="w-full h-14 pr-4 pl-4 bg-white border border-gray-100 rounded-2xl text-gray-700 outline-none focus:ring-2 focus:ring-green-500/20 appearance-none shadow-sm cursor-pointer font-bold"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as 'PENDING_FINANCE' | 'APPROVED')}
                        >
                            <option value="PENDING_FINANCE">بانتظار الاعتماد النهائي</option>
                            <option value="APPROVED">معتمد نهائياً</option>
                        </select>
                    </div>
                </div>
                <div className="relative min-w-[240px]">
                    <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <select
                        className="w-full h-14 pr-12 pl-4 bg-white border border-gray-100 rounded-2xl text-gray-700 outline-none focus:ring-2 focus:ring-green-500/20 appearance-none shadow-sm cursor-pointer"
                        value={areaFilter}
                        onChange={e => setAreaFilter(e.target.value)}
                    >
                        <option value="ALL">جميع القطاعات</option>
                        {areas.map(a => (
                            <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="lg:col-span-4 flex gap-3">
                <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex-1 h-14 rounded-2xl border-gray-100 text-blue-600 hover:bg-blue-50 font-bold gap-3 shadow-sm"
                >
                    <Printer className="h-5 w-5" />
                    كشف ورقي
                </Button>
                <Button
                    onClick={handleExportCSV}
                    className="flex-1 h-14 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black gap-3 shadow-lg shadow-green-200"
                >
                    <Download className="h-5 w-5" />
                    تصدير Excel
                </Button>
            </div>

            {/* Main Data Table */}
            <Card className="border-none shadow-xl shadow-gray-200/50 rounded-[2rem] overflow-hidden bg-white border border-gray-50">
                <CardHeader className="p-8 border-b border-gray-50 bg-gradient-to-l from-gray-50/50 to-transparent">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <CardTitle className="text-xl font-black text-gray-900 flex items-center gap-2">
                                <span className="w-2 h-8 bg-green-600 rounded-full"></span>
                                {statusFilter === 'PENDING_FINANCE' ? 'سجلات بانتظار الاعتماد' : 'مسير الرواتب المعتمدة'}
                            </CardTitle>
                            <p className="text-gray-500 text-sm mt-1">
                                {statusFilter === 'PENDING_FINANCE' ? 'سجلات تحتاج للاعتماد النهائي من قسم الرواتب' : 'يتم عرض العمال الذين اجتازوا كافة مراحل التدقيق والاعتماد'}
                            </p>
                        </div>
                        <Badge className="bg-green-100 text-green-700 border-none px-4 py-1.5 rounded-full font-bold">
                            قائمة نهائية - {approvedPayrolls.length} عامل
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[11px] uppercase tracking-widest border-b border-gray-100">
                                    <th className="p-6 font-black">المعرف</th>
                                    <th className="p-6 font-black">اسم الموظف</th>
                                    <th className="p-6 font-black text-center">القطاع / المنطقة</th>
                                    <th className="p-6 font-black text-center">الأيام</th>
                                    <th className="p-6 font-black text-center">سعر اليوم</th>
                                    <th className="p-6 font-black text-center bg-green-50/30 text-green-800">إجمالي الراتب</th>
                                    <th className="p-6 font-black text-center">تاريخ الإدخال</th>
                                    {statusFilter === 'PENDING_FINANCE' && <th className="p-6 font-black text-center">إجراء</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {approvedPayrolls.length > 0 ? (
                                    approvedPayrolls.map((p) => (
                                        <tr key={p.worker.id} className="hover:bg-green-50/20 transition-all duration-200 group">
                                            <td className="p-6">
                                                <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">#{p.worker.id}</span>
                                            </td>
                                            <td className="p-6">
                                                <div className="font-black text-gray-900 group-hover:text-green-700 transition-colors uppercase tracking-tight">{p.worker.name}</div>
                                                <div className="text-[10px] text-gray-400 font-medium">عضو مسجل في المنظومة</div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-100/50">
                                                    <MapPin className="h-3 w-3" />
                                                    {p.areaName}
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="font-black text-gray-700 text-lg">{p.record?.totalCalculatedDays || "-"}</div>
                                            </td>
                                            <td className="p-6 text-center text-sm font-bold text-gray-500 whitespace-nowrap">
                                                {p.worker.dayValue} <span className="text-[10px] font-medium opacity-60 mr-1">د.ل</span>
                                            </td>
                                            <td className="p-6 text-center bg-green-50/10">
                                                <div className="text-xl font-black text-green-700">
                                                    {p.totalAmount.toLocaleString()}
                                                    <span className="text-xs font-medium mr-1.5 opacity-80 uppercase">د.ل</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="text-[11px] text-gray-400 font-bold uppercase">
                                                    {p.record ? new Date(p.record.updatedAt).toLocaleDateString('ar-LY') : "-"}
                                                </div>
                                            </td>
                                            {statusFilter === 'PENDING_FINANCE' && (
                                                <td className="p-6 text-center">
                                                    <Button
                                                        size="sm"
                                                        className="h-10 bg-green-600 hover:bg-green-700 text-white font-bold px-6 rounded-xl"
                                                        onClick={() => p.record && handleApprove(p.record.id)}
                                                        disabled={p.record ? approvingIds.has(p.record.id) : true}
                                                    >
                                                        {p.record && approvingIds.has(p.record.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <><CheckCircle className="h-4 w-4 ml-2" /> اعتماد نهائي</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="h-10 font-bold px-4 rounded-xl mr-2"
                                                        onClick={() => p.record && handleReject(p.record.id)}
                                                        disabled={p.record ? rejectingIds.has(p.record.id) || approvingIds.has(p.record.id) : true}
                                                    >
                                                        {p.record && rejectingIds.has(p.record.id) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            "رفض"
                                                        )}
                                                    </Button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="p-20 text-center">
                                            <div className="max-w-xs mx-auto space-y-3 opacity-30 select-none">
                                                <Search className="h-16 w-16 mx-auto" />
                                                <p className="font-black text-xl">لا توجد سجلات</p>
                                                <p className="text-sm">لم يتم العثور على أي كشوف معتمدة تطابق معايير البحث الحالية.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Print Section (Hidden on screen) */}
            <div className="hidden print:block p-8" dir="rtl">
                <div className="text-center border-b-4 border-green-700 pb-8 mb-10">
                    <h1 className="text-4xl font-black mb-2 tracking-tighter text-green-900">كشف مسير رواتب العمال العام</h1>
                    <div className="flex justify-center gap-8 text-sm text-gray-600 font-bold uppercase tracking-widest">
                        <span>فترة الاستحقاق: {month}/{year}</span>
                        <span>القطاع: {areaFilter === "ALL" ? "كافة القطاعات" : areas.find(a => a.id === areaFilter)?.name}</span>
                        <span>التاريخ: {new Date().toLocaleDateString('ar-LY')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10">
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">إجمالي المبلغ المطلوب</p>
                        <p className="text-3xl font-black text-green-900">{stats.totalAmount.toLocaleString()} د.ل</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">عدد العمال المدرجين</p>
                        <p className="text-3xl font-black text-blue-900">{approvedPayrolls.length} عامل</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-3xl border border-gray-200">
                        <p className="text-xs font-black text-gray-400 uppercase mb-1">صافي الأيام المحتسبة</p>
                        <p className="text-3xl font-black text-orange-900">{stats.totalDays} يوم</p>
                    </div>
                </div>

                <table className="w-full border-collapse rounded-2xl overflow-hidden border border-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border border-gray-300 p-3 text-right text-xs">#</th>
                            <th className="border border-gray-300 p-3 text-right">الاسم الكامل</th>
                            <th className="border border-gray-300 p-3 text-right">القطاع</th>
                            <th className="border border-gray-300 p-3 text-center">الأيام</th>
                            <th className="border border-gray-300 p-3 text-center">سعر اليوم</th>
                            <th className="border border-gray-300 p-3 text-center font-black">الصافي (د.ل)</th>
                            <th className="border border-gray-300 p-3 text-center">التوقيع</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedPayrolls.map((p, idx) => (
                            <tr key={p.worker.id}>
                                <td className="border border-gray-300 p-3 text-xs">{idx + 1}</td>
                                <td className="border border-gray-300 p-3 font-bold">{p.worker.name}</td>
                                <td className="border border-gray-300 p-3">{p.areaName}</td>
                                <td className="border border-gray-300 p-3 text-center">{p.record?.totalCalculatedDays || 0}</td>
                                <td className="border border-gray-300 p-3 text-center">{p.worker.dayValue}</td>
                                <td className="border border-gray-300 p-3 text-center font-black">{p.totalAmount.toLocaleString()}</td>
                                <td className="border border-gray-300 p-3 min-w-[120px]"></td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="mt-20 grid grid-cols-3 gap-12 text-center font-black uppercase text-xs">
                    <div>
                        <div className="border-t-2 border-black pt-4">المحاسب المراجع</div>
                        <p className="text-gray-400 mt-2 font-medium">Signature & Date</p>
                    </div>
                    <div>
                        <div className="border-t-2 border-black pt-4">مدير القسم المالي</div>
                        <p className="text-gray-400 mt-2 font-medium">Approval Stamp</p>
                    </div>
                    <div>
                        <div className="border-t-2 border-black pt-4">اعتماد المدير العام</div>
                        <p className="text-gray-400 mt-2 font-medium">Final Authorization</p>
                    </div>
                </div>
            </div>
        </div >
    );
}
