"use client";

import React, { useState, useMemo } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Badge } from "../ui/badge";
import Image from "next/image"; // Added import for Image
import {
    Banknote,
    AlertCircle,
    Download,
    Search,
    DollarSign,
    Printer,
    Users,
    Calendar,
    TrendingUp,
    CheckCircle,
    Loader2,
    Clock,
    Menu,
    LayoutGrid
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MobileNav } from "../ui/mobile-nav";
import { resolveAreaNames } from "@/lib/utils";

export function FinanceView() {
    const { currentUser, workers, getWorkerAttendance, loadAttendance, isLoading, error, areas, approveAttendance, rejectAttendance } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("ALL");
    const [statusFilter, setStatusFilter] = useState<string>('PENDING_FINANCE'); // Default to finance pending
    const [viewMode, setViewMode] = useState<'table' | 'grid'>('table'); // View mode toggle
    const [approvingIds, setApprovingIds] = useState<Set<string>>(new Set());
    const [rejectingIds, setRejectingIds] = useState<Set<string>>(new Set());
    const [selectedNationality, setSelectedNationality] = useState<string>(currentUser?.handledNationality || "ALL");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Budget Configuration (in a real app, this would be fetched from database)
    const [monthlyBudget] = useState(500000); // Example budget in dinars

    // Dynamic data loading for the selected period
    React.useEffect(() => {
        if (!currentUser) return;
        loadAttendance(month, year);
    }, [month, year, loadAttendance, currentUser]);

    // Filter workers based on search and area
    const approvedPayrolls = workers.map(w => {
        const record = getWorkerAttendance(w.id, month, year);
        const isApproved = record?.status === 'APPROVED';
        const areaName = resolveAreaNames(w.areaId, areas);

        // Calculate cost breakdown
        const normalCost = record ? record.normalDays * w.dayValue : 0;
        const overtimeNormalCost = record ? record.overtimeNormalDays * 0.5 * w.dayValue : 0;
        const overtimeHolidayCost = record ? record.overtimeHolidayDays * w.dayValue : 0;
        const overtimeEidCost = record ? (record.overtimeEidDays || 0) * w.dayValue : 0;
        const totalAmount = normalCost + overtimeNormalCost + overtimeHolidayCost + overtimeEidCost;

        return {
            worker: w,
            record,
            isApproved,
            areaName,
            totalAmount,
            normalCost,
            overtimeNormalCost,
            overtimeHolidayCost,
            overtimeEidCost
        };
    }).filter(p => {
        const matchesSearch = p.worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.worker.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.areaName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesArea = areaFilter === "ALL" || p.worker.areaId === areaFilter;
        const matchesStatus = statusFilter === 'all' || p.record?.status === statusFilter;
        const matchesNationality = selectedNationality === "ALL" || p.worker.nationality === selectedNationality;
        return matchesStatus && matchesSearch && matchesArea && matchesNationality;
    });

    const handleApprove = async (recordId: string) => {
        setApprovingIds(prev => new Set(prev).add(recordId));
        try {
            await approveAttendance(recordId, 'PENDING_PAYROLL');
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
        const reason = prompt("يرجى كتابة سبب رفض هذا السجل وإعادته للرقابة:");
        if (!reason) return;
        setRejectingIds(prev => new Set(prev).add(recordId));
        try {
            await rejectAttendance(recordId, 'PENDING_AUDIT', reason);
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

    // Enhanced stats calculations with budget tracking and cost breakdown
    const stats = useMemo(() => {
        let totalAmount = 0;
        let totalDays = 0;
        let workersCount = 0;
        let normalCostTotal = 0;
        let overtimeCostTotal = 0;
        let holidayCostTotal = 0;

        workers.forEach(w => {
            const r = getWorkerAttendance(w.id, month, year);
            if (r && r.status === 'APPROVED') {
                const normalCost = r.normalDays * w.dayValue;
                const otNormalCost = r.overtimeNormalDays * 0.5 * w.dayValue;
                const otHolidayCost = r.overtimeHolidayDays * w.dayValue;
                const otEidCost = (r.overtimeEidDays || 0) * w.dayValue;

                normalCostTotal += normalCost;
                overtimeCostTotal += otNormalCost;
                holidayCostTotal += otHolidayCost + otEidCost;

                totalAmount += normalCost + otNormalCost + otHolidayCost + otEidCost;
                totalDays += r.totalCalculatedDays;
                workersCount++;
            }
        });

        const budgetRemaining = monthlyBudget - totalAmount;
        const budgetUtilization = (totalAmount / monthlyBudget) * 100;

        return {
            totalAmount,
            totalDays,
            workersCount,
            avgSalary: workersCount > 0 ? totalAmount / workersCount : 0,
            normalCostTotal,
            overtimeCostTotal,
            holidayCostTotal,
            budgetRemaining,
            budgetUtilization
        };
    }, [workers, getWorkerAttendance, month, year, monthlyBudget]);

    // Stable print metadata - generated on mount to fix purity lint errors
    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `PAY-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

    const navItems = [
        { id: 'PENDING_FINANCE', label: 'بانتظار الاعتماد المالي', icon: Clock },
        { id: 'APPROVED', label: 'الكشوف المعتمدة', icon: CheckCircle },
        { id: 'print', label: 'طباعة التقرير', icon: Printer },
        { id: 'export', label: 'تصدير Excel', icon: Download },
    ];

    const handleExportCSV = () => {
        const headers = ["الرقم", "الاسم", "القطاع", "الأيام المحتسبة", "قيمة اليوم", "الصافي المستحق"];
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
        <>
            <MobileNav
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab="overview"
                onTabChange={(id) => {
                    if (id === 'print') window.print();
                    else if (id === 'export') handleExportCSV();
                    else setStatusFilter(id);
                }}
                user={{ name: currentUser?.name || "المدير المالي", role: "المدير المالي" }}
            />

            <div className="space-y-6 pb-24 print:hidden">
                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-amber-600 to-yellow-600 p-2.5 rounded-2xl text-white shadow-lg shadow-amber-500/20">
                                <Banknote className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">الإدارة المالية</h2>
                                    <Badge className="bg-amber-50 text-amber-700 border-amber-100 text-[9px] font-black uppercase tracking-tighter">Certified</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تدقيق الرواتب والمستحقات</p>
                            </div>
                        </div>

                        {/* Desktop & Mobile Control */}
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="h-10 px-3 md:px-6 text-blue-600 hover:bg-blue-50/80 rounded-2xl font-black gap-2 border border-blue-200 shadow-sm transition-all active:scale-95"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden md:inline">نسخة ورقية</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportCSV}
                                className="h-10 px-3 md:px-6 text-emerald-600 hover:bg-emerald-50/80 rounded-2xl font-black gap-2 border border-emerald-200 shadow-sm transition-all active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden md:inline">تصدير Excel</span>
                            </Button>

                            <div className="hidden sm:block">
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
                </div>
            </div>

            {/* View Toggle & Filters */}
            <div className="flex flex-col lg:flex-row gap-3 px-1">
                <div className="flex bg-slate-100/80 p-1 rounded-2xl w-fit border border-slate-200/50">
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <LayoutGrid className="h-4 w-4" />
                            <span>جدول تفصيلي</span>
                        </div>
                    </button>
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`px-4 py-2 rounded-xl text-sm font-black transition-all ${viewMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>بطاقات</span>
                        </div>
                    </button>
                </div>

                <div className="relative flex-1 group">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
                        {[
                            {
                                label: 'إجمالي المستحقات',
                                value: stats.totalAmount.toLocaleString(),
                                unit: 'د.أ',
                                icon: DollarSign,
                                gradient: 'from-amber-600 to-amber-700',
                                desc: 'المعتمدة حالياً'
                            },
                            {
                                label: 'العمال المكتملين',
                                value: stats.workersCount,
                                unit: 'عامل',
                                icon: Users,
                                gradient: 'from-emerald-600 to-emerald-700',
                                desc: 'جاهز للصرف'
                            },
                            {
                                label: 'صافي أيام العمل',
                                value: stats.totalDays,
                                unit: 'يوم',
                                icon: Calendar,
                                gradient: 'from-blue-600 to-blue-700',
                                desc: 'مجموع الساعات'
                            },
                            {
                                label: 'متوسط الأجور',
                                value: stats.avgSalary.toFixed(1),
                                unit: 'د.أ',
                                icon: TrendingUp,
                                gradient: 'from-indigo-600 to-indigo-700',
                                desc: 'لكل عامل'
                            }
                        ].map((kpi, i) => (
                            <div key={i} className={`relative group overflow-hidden bg-gradient-to-br ${kpi.gradient} rounded-[2rem] p-5 text-white shadow-lg transition-all duration-500 hover:shadow-xl hover:scale-[1.02]`}>
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
                            </div>
                        ))}
                    </div>

                    {/* Control Center - Floating Glassmorph */
                /* Removed original Control Center start div as it is now merged above */}
                    <div className="relative flex-1 group">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-600 transition-colors" />
                        <Input
                            id="finance-search"
                            name="financeSearch"
                            aria-label="بحث في السجلات المالية"
                            placeholder="بحث بالاسم أو الرقم أو القطاع..."
                            className="pr-12 h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm text-base transition-all"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                        <select
                            id="finance-status-filter"
                            name="financeStatusFilter"
                            aria-label="تصفية حسب الحالة المالية"
                            className="hidden md:block h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[200px] outline-none px-4 transition-all"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="all">🔍 جميع الحالات</option>
                            <option value="PENDING_SUPERVISOR">📋 عند المراقب</option>
                            <option value="PENDING_GS">👤 المراقب العام</option>
                            <option value="PENDING_HEALTH">🏥 الصحة</option>
                            <option value="PENDING_HR">👥 الموارد البشرية</option>
                            <option value="PENDING_AUDIT">🛡️ الرقابة الداخلية</option>
                            <option value="PENDING_FINANCE">💰 المالية (أنت)</option>
                            <option value="PENDING_PAYROLL">💳 الرواتب</option>
                            <option value="APPROVED">✅ معتمد نهائياً</option>
                        </select>

                        <div className="md:hidden flex-1">
                            <div className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner w-full">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>
                        </div>

                        <select
                            id="finance-area-filter"
                            name="financeAreaFilter"
                            aria-label="تصفية حسب القطاع المالي"
                            className="h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[160px] outline-none px-4 transition-all"
                            value={areaFilter}
                            onChange={e => setAreaFilter(e.target.value)}
                        >
                            <option value="ALL">🏢 جميع القطاعات</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>

                        <select
                            id="finance-nationality-filter"
                            name="financeNationalityFilter"
                            aria-label="تصفية حسب الجنسية المالية"
                            className="h-12 bg-white/80 backdrop-blur-md border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 rounded-2xl shadow-sm font-bold text-slate-700 min-w-[140px] outline-none px-4 transition-all"
                            value={selectedNationality}
                            onChange={e => setSelectedNationality(e.target.value)}
                        >
                            <option value="ALL">جميع الجنسيات</option>
                            <option value="أردني">أردني</option>
                            <option value="مصري">مصري</option>
                        </select>

                        <div className="flex items-center gap-2 mr-auto lg:mr-0 lg:mr-auto">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="h-12 px-6 text-blue-600 hover:bg-blue-50/80 rounded-2xl font-black gap-2 border border-blue-200 shadow-sm transition-all active:scale-95"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">نسخة ورقية</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleExportCSV}
                                className="h-12 px-6 text-emerald-600 hover:bg-emerald-50/80 rounded-2xl font-black gap-2 border border-emerald-200 shadow-sm transition-all active:scale-95"
                            >
                                <Download className="h-4 w-4" />
                                <span className="hidden sm:inline">تصدير Excel</span>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                {viewMode === 'table' ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-white overflow-hidden mx-1 animate-in fade-in duration-1000">
                        <div className="overflow-x-auto relative scrollbar-hide">
                            <table className="w-full text-right border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-900/5 text-slate-500 text-[10px] font-black uppercase tracking-wider border-b border-slate-100">
                                        <th className="p-4 sticky right-0 bg-slate-50/95 backdrop-blur-md z-20 shadow-sm">الموظف</th>
                                        <th className="p-4 text-center">المنطقة</th>
                                        <th className="p-4 text-center bg-blue-50/50 text-blue-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>أيام العمل العادية</span>
                                                <span className="text-[9px] opacity-60 font-normal">عدد أيام الحضور الفعلي</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center bg-indigo-50/50 text-indigo-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>إضافي (أيام عادية)</span>
                                                <span className="text-[9px] opacity-60 font-normal">ساعات إضافية (x0.5)</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center bg-amber-50/50 text-amber-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>إضافي (عطل وجمع)</span>
                                                <span className="text-[9px] opacity-60 font-normal">ساعات إضافية (x1.0)</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center bg-rose-50/50 text-rose-900 min-w-[120px]">
                                            <div className="flex flex-col gap-1">
                                                <span>أيام الأعياد</span>
                                                <span className="text-[9px] opacity-60 font-normal">عطل رسمية (x1.0)</span>
                                            </div>
                                        </th>
                                        <th className="p-4 text-center font-extrabold text-slate-800">صافي المستحق</th>
                                        <th className="p-4 text-center">الحالة</th>
                                        <th className="p-4 text-center">الإجراء</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {approvedPayrolls.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-20 text-center text-slate-400 italic font-bold">
                                                لا توجد سجلات مالية مطابقة للبحث
                                            </td>
                                        </tr>
                                    ) : (
                                        approvedPayrolls.map((p) => (
                                            <tr key={p.worker.id} className="hover:bg-slate-50/80 transition-all duration-300 group text-[11px] font-bold">
                                                <td className="p-4 sticky right-0 bg-inherit z-10 shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs">
                                                            {p.worker.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-800 text-xs">{p.worker.name}</div>
                                                            <div className="text-[9px] text-slate-400 font-mono">ID: {p.worker.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center text-slate-500">{p.areaName}</td>

                                                {/* Detailed Columns */}
                                                <td className="p-4 text-center bg-blue-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.normalDays || 0}</span>
                                                        <span className="text-[9px] text-blue-600 font-mono">{p.normalCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-indigo-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.overtimeNormalDays || 0}</span>
                                                        <span className="text-[9px] text-indigo-600 font-mono">{p.overtimeNormalCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-amber-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.overtimeHolidayDays || 0}</span>
                                                        <span className="text-[9px] text-amber-600 font-mono">{p.overtimeHolidayCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center bg-rose-50/30">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-slate-900 text-xs">{p.record?.overtimeEidDays || 0}</span>
                                                        <span className="text-[9px] text-rose-600 font-mono">{p.overtimeEidCost.toLocaleString()} د.أ</span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center bg-emerald-50/30">
                                                    <div className="flex flex-col items-center justify-center p-1.5 rounded-xl bg-white border border-emerald-100 shadow-sm">
                                                        <span className="text-sm font-black text-emerald-700">{p.totalAmount.toLocaleString()}</span>
                                                        <span className="text-[8px] text-emerald-500 uppercase">دينار</span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] ${p.record?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                        'bg-amber-50 text-amber-700 border-amber-100'
                                                        }`}>
                                                        {p.record?.status === 'APPROVED' ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                                        <span>{p.record?.status === 'APPROVED' ? 'معتمد' : 'بانتظار الاعتماد'}</span>
                                                    </div>
                                                </td>

                                                <td className="p-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {statusFilter === 'PENDING_FINANCE' && p.record && (
                                                            <>
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => handleApprove(p.record!.id)}
                                                                    disabled={approvingIds.has(p.record.id)}
                                                                    className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs"
                                                                >
                                                                    {approvingIds.has(p.record.id) ? <Loader2 className="h-3 w-3 animate-spin" /> : "اعتماد"}
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleReject(p.record!.id)}
                                                                    disabled={rejectingIds.has(p.record.id)}
                                                                    className="h-8 px-2 text-rose-600 hover:bg-rose-50 rounded-lg"
                                                                >
                                                                    <AlertCircle className="h-4 w-4" />
                                                                </Button>
                                                            </>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mx-1">
                        {approvedPayrolls.map((p) => (
                            <div key={p.worker.id} className="bg-white/80 backdrop-blur-md p-5 rounded-[2rem] border border-white shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-black shadow-inner">
                                            {p.worker.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900">{p.worker.name}</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{p.areaName}</p>
                                        </div>
                                    </div>
                                    <Badge className={`font-black text-[9px] px-2 py-0.5 ${p.record?.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {p.record?.status === 'APPROVED' ? 'معتمد' : 'معلق'}
                                    </Badge>
                                </div>

                                <div className="space-y-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                                    <div className="flex justify-between items-start text-slate-700 pb-3 border-b border-slate-200/50">
                                        <div>
                                            <p className="font-bold text-sm">أيام العمل العادية</p>
                                            <p className="text-[10px] text-slate-400">عدد أيام الحضور الفعلي في الموقع</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.normalDays || 0}</span>
                                            <span className="text-[10px] text-blue-600 font-mono font-bold">{p.normalCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-slate-700 pb-3 border-b border-slate-200/50">
                                        <div>
                                            <p className="font-bold text-sm">إضافي (أيام عادية)</p>
                                            <p className="text-[10px] text-slate-400">ساعات إضافية محتسبة بنصف يوم (x0.5)</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.overtimeNormalDays || 0}</span>
                                            <span className="text-[10px] text-indigo-600 font-mono font-bold">{p.overtimeNormalCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-slate-700 pb-3 border-b border-slate-200/50">
                                        <div>
                                            <p className="font-bold text-sm">إضافي (عطل وجمع)</p>
                                            <p className="text-[10px] text-slate-400">ساعات إضافية محتسبة بيوم كامل (x1.0)</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.overtimeHolidayDays || 0}</span>
                                            <span className="text-[10px] text-amber-600 font-mono font-bold">{p.overtimeHolidayCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-start text-slate-700">
                                        <div>
                                            <p className="font-bold text-sm">أيام الأعياد</p>
                                            <p className="text-[10px] text-slate-400">أيام العطل الرسمية والأعياد (x1.0)</p>
                                        </div>
                                        <div className="text-left">
                                            <span className="block font-black text-lg">{p.record?.overtimeEidDays || 0}</span>
                                            <span className="text-[10px] text-rose-600 font-mono font-bold">{p.overtimeEidCost.toLocaleString()} د.أ</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-slate-400 font-bold uppercase">صافي المستحق</span>
                                        <span className="text-xl font-black text-slate-900">{p.totalAmount.toLocaleString()} <span className="text-[10px] text-slate-400">د.أ</span></span>
                                    </div>

                                    <div className="flex gap-2">
                                        {statusFilter === 'PENDING_FINANCE' && p.record && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleApprove(p.record!.id)}
                                                    disabled={approvingIds.has(p.record.id)}
                                                    className="h-9 w-9 p-0 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg shadow-emerald-200/50"
                                                >
                                                    {approvingIds.has(p.record.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleReject(p.record!.id)}
                                                    disabled={rejectingIds.has(p.record.id)}
                                                    className="h-9 w-9 p-0 text-rose-600 hover:bg-rose-50 rounded-xl"
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

            {/* Printable Area - Standardized Official Layout */}
            <div className="hidden print:block font-sans">
                <div className="text-center mb-10 border-b-[6px] border-emerald-900 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">كشف الصرف المالي الشهري</h1>
                            <p className="text-gray-600 text-xs">
                                الشهر: {month} / {year} | حالة الاعتماد: مكتملة
                            </p>
                            <p className="text-sm mt-1 text-emerald-800 font-bold uppercase">الدائرة المالية والمحاسبية</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">تقرير مسيرات الرواتب والمستحقات</h1>
                    <div className="flex justify-center gap-12 mt-4 text-slate-600 font-black">
                        <p>الشهر: <span className="text-emerald-900">{month}</span></p>
                        <p>السنة: <span className="text-emerald-900">{year}</span></p>
                        <p>إجمالي المصروفات: <span className="text-emerald-900">{stats.totalAmount.toLocaleString()} د.أ</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-3 text-right">م</th>
                            <th className="border-2 border-slate-900 p-3 text-right">اسم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أيام العمل</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أجر اليوم</th>
                            <th className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50 text-base">صافي المستحق</th>
                        </tr>
                    </thead>
                    <tbody>
                        {approvedPayrolls.map((p, index) => (
                            <tr key={p.worker.id} className="border-b-2 border-slate-400">
                                <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                <td className="border-2 border-slate-900 p-3 font-black">{p.worker.name}</td>
                                <td className="border-2 border-slate-900 p-3 text-center">{p.record?.totalCalculatedDays || 0}</td>
                                <td className="border-2 border-slate-900 p-3 text-center">{p.worker.dayValue}</td>
                                <td className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50 text-base">
                                    {p.totalAmount.toLocaleString()} د.أ
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-slate-900 text-white font-black border-2 border-slate-900">
                            <td colSpan={4} className="p-4 text-left text-lg">إجمالي مسير الرواتب العام:</td>
                            <td className="p-4 text-center text-xl">{stats.totalAmount.toLocaleString()} د.أ</td>
                        </tr>
                    </tfoot>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">توقيع المحاسب</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs text-left px-8">التوقيع:</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">مدير الدائرة المالية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs text-left px-8">التوقيع:</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد عطوفة العمدة</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم رئاسة البلدية</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        Financial Support System - Payment Serial: {printMetadata.ref} - Date: {printMetadata.date}
                    </p>
                </div>
            </div>
        </>
    );
}
