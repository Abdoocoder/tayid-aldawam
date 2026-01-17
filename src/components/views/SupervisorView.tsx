"use client";

import React, { useState } from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { MonthYearPicker } from "../ui/month-year-picker";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { MobileNav } from "../ui/mobile-nav";
import {
    MapPin, Search, Loader2, AlertCircle, Users, CheckCircle, Target,
    ClipboardList, User, Printer, Menu, Clock
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "../ui/input";
import { Select } from "../ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { getNationalityLabel } from "@/lib/export-utils";

export function SupervisorView() {
    const { currentUser, workers, getWorkerAttendance, isLoading, error, areas } = useAttendance();
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    const navItems = [
        { id: 'overview', label: 'كشف الحضور', icon: ClipboardList },
        { id: 'print', label: 'طباعة كشف', icon: Printer },
    ];
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedAreaId, setSelectedAreaId] = useState<string>("ALL");
    const [selectedNationality, setSelectedNationality] = useState<string>(currentUser?.handledNationality || "ALL");

    // Get all areas relevant to this supervisor
    const supervisorAreas = areas.filter(a =>
        currentUser?.areaId === 'ALL' ||
        a.id === currentUser?.areaId ||
        currentUser?.areas?.some(ca => ca.id === a.id)
    );

    // Filter workers by area(s) and search term
    const baseWorkers = workers.filter((w) => {
        if (currentUser?.areaId === 'ALL') return true;
        const isPrimaryArea = w.areaId === currentUser?.areaId;
        const isInAssignedAreas = currentUser?.areas?.some(a => a.id === w.areaId || a.name === w.areaId);
        return isPrimaryArea || isInAssignedAreas;
    });

    const filteredWorkers = baseWorkers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.id.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesArea = false;
        if (selectedAreaId === "ALL") {
            matchesArea = true;
        } else {
            const selectedAreaObj = areas.find(a => a.id === selectedAreaId);
            matchesArea = w.areaId === selectedAreaId || (selectedAreaObj ? w.areaId === selectedAreaObj.name : false);
        }

        const matchesNationality = selectedNationality === "ALL" || getNationalityLabel(w.nationality) === getNationalityLabel(selectedNationality);

        return matchesSearch && matchesArea && matchesNationality;
    });

    // Calculate stats
    const totalWorkers = baseWorkers.length;
    const completedEntries = baseWorkers.filter(w => !!getWorkerAttendance(w.id, month, year)).length;
    const pendingEntries = totalWorkers - completedEntries;
    const completionPercentage = totalWorkers > 0 ? Math.round((completedEntries / totalWorkers) * 100) : 0;

    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `SUP-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3 bg-red-50 p-6 rounded-lg border border-red-200">
                    <AlertCircle className="h-10 w-10 text-red-600 mx-auto" />
                    <p className="text-red-700 font-semibold">حدث خطأ في تحميل البيانات</p>
                    <p className="text-red-600 text-sm">{error}</p>
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
                onTabChange={(id) => id === 'print' ? window.print() : null}
                user={{ name: currentUser?.name || "مراقب الميدان", role: "مراقب قطاع" }}
            />

            <div className="space-y-6 pb-24 min-h-screen print:hidden">
                {/* Header & Month Picker - Sticky and Glassmorphic */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/5 shadow-sm print:hidden">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-2xl text-white shadow-xl">
                                    <ClipboardList className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">تأييد الدوام</h1>
                                    <div className="flex items-center bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-2 py-0.5 rounded-full scale-90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5" />
                                        <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase tracking-widest">Live System</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">Smart Attendance Verification</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.print()}
                                className="hidden md:flex gap-2 text-blue-600 hover:bg-blue-50 px-3 rounded-xl border border-transparent font-black"
                            >
                                <Printer className="h-4 w-4" />
                                <span className="text-xs">طباعة</span>
                            </Button>

                            <div className="hidden md:block">
                                <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                            </div>

                            {/* Mobile Menu Trigger */}
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

                {/* Quick Stats Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1"
                >
                    {[
                        {
                            label: 'العمال',
                            value: totalWorkers,
                            unit: 'عامل',
                            icon: Users,
                            gradient: 'from-blue-600 to-blue-700',
                            desc: 'المسجلين لدي'
                        },
                        {
                            label: 'مكتمل',
                            value: completedEntries,
                            unit: 'عامل',
                            icon: CheckCircle,
                            gradient: 'from-emerald-600 to-emerald-700',
                            desc: 'تم إدخالهم'
                        },
                        {
                            label: 'متبقي',
                            value: pendingEntries,
                            unit: 'عامل',
                            icon: Clock,
                            gradient: 'from-amber-600 to-amber-700',
                            desc: 'بانتظار الإدخال'
                        },
                        {
                            label: 'الإنجاز',
                            value: completionPercentage,
                            unit: '%',
                            icon: Target,
                            gradient: 'from-indigo-600 to-indigo-700',
                            desc: 'نسبة الإتمام'
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

                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">ملخص الشهر</span>
                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-2xl font-black text-slate-900 dark:text-white">{completedEntries}</span>
                                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500">/ {totalWorkers}</span>
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

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-3 px-1">
                    <div className="relative group flex-1">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            id="worker-search"
                            name="workerSearch"
                            aria-label="البحث عن العمال"
                            placeholder="ابحث عن عامل..."
                            className="pr-10 h-11 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-white/10 focus:border-blue-500 rounded-2xl shadow-sm dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 flex-1 md:flex-initial">
                        {supervisorAreas.length > 1 && (
                            <Select
                                id="area-filter"
                                name="areaFilter"
                                aria-label="تصفية حسب المنطقة"
                                className="flex-1 md:w-48 h-11 bg-white/60 backdrop-blur-md border-slate-200 rounded-2xl shadow-sm font-bold text-slate-700"
                                value={selectedAreaId}
                                onChange={e => setSelectedAreaId(e.target.value)}
                            >
                                <option value="ALL">جميع المناطق</option>
                                {supervisorAreas.map(area => (
                                    <option key={area.id} value={area.id}>{area.name}</option>
                                ))}
                            </Select>
                        )}

                        <Select
                            id="nationality-filter"
                            name="nationalityFilter"
                            aria-label="تصفية حسب الجنسية"
                            className="flex-1 md:w-36 h-11 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200 dark:border-white/10 rounded-2xl shadow-sm font-bold text-slate-700 dark:text-slate-200"
                            value={selectedNationality}
                            onChange={e => setSelectedNationality(e.target.value)}
                        >
                            <option value="ALL">جميع الجنسيات</option>
                            <option value="أردني">أردني</option>
                            <option value="مصري">مصري</option>
                            <option value="سوري">سوري</option>
                        </Select>
                    </div>
                </div>

                {/* Workers Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-1">
                    <AnimatePresence mode="popLayout">
                        {filteredWorkers.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="col-span-full bg-white/60 backdrop-blur-md rounded-2xl border border-dashed border-slate-300 py-16 text-center"
                            >
                                <div className="bg-slate-50 dark:bg-slate-800/50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner border border-slate-100 dark:border-white/5">
                                    <Search className="h-10 w-10 text-slate-300 dark:text-slate-600" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">لا توجد نتائج</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">لم نجد أي عامل يطابق معايير البحث الحالية</p>
                            </motion.div>
                        ) : (
                            filteredWorkers.map((worker, i) => {
                                const record = getWorkerAttendance(worker.id, month, year);
                                const isFilled = !!record;
                                const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";

                                return (
                                    <motion.div
                                        key={worker.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: i * 0.05 }}
                                        className={`group hover:shadow-2xl transition-all duration-300 relative overflow-hidden ring-1 rounded-2xl ${isFilled ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/20 dark:from-emerald-900/20 dark:to-emerald-950/40 ring-emerald-100 dark:ring-emerald-900/30 shadow-lg shadow-emerald-500/5' : 'bg-white dark:bg-slate-900/40 ring-slate-100 dark:ring-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none'}`}
                                    >
                                        <div className="p-5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-3 rounded-2xl transition-all duration-300 ${isFilled ? 'bg-white dark:bg-slate-800 shadow-sm text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div className="text-right">
                                                    <h4 className="text-base font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{worker.name}</h4>
                                                    <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                                                        <Badge variant="outline" className={`text-[8px] font-black px-1.5 py-0 border-transparent ${worker.nationality === 'JORDANIAN' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'}`}>
                                                            {worker.nationality === 'JORDANIAN' ? 'أردني' : worker.nationality === 'EGYPTIAN' ? 'مصري' : 'سوري'}
                                                        </Badge>
                                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center gap-1">
                                                            <MapPin className="h-2.5 w-2.5" />
                                                            {areaName}
                                                        </span>
                                                        <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 bg-slate-50/50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400">#{worker.id}</Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isFilled && (
                                                    <div className="bg-emerald-500 dark:bg-emerald-600 rounded-full p-1 shadow-lg shadow-emerald-500/20">
                                                        <CheckCircle className="h-4 w-4 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="px-5 pb-5">
                                            {isFilled && record.status === 'PENDING_SUPERVISOR' && record.rejectionNotes && (
                                                <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                                                    <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                                    <div className="text-[10px] text-amber-800 font-bold leading-relaxed">
                                                        <span className="block mb-0.5 underline">ملاحظة التعديل:</span>
                                                        {record.rejectionNotes}
                                                    </div>
                                                </div>
                                            )}
                                            <div className={`flex items-center justify-between gap-3 p-2.5 rounded-2xl border transition-colors ${isFilled ? 'bg-white/80 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}>
                                                <div className="flex flex-col text-right">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">الحالة التدقيقية</span>
                                                    <span className={`text-[11px] font-black ${isFilled ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                        {isFilled ? (
                                                            record.status === 'PENDING_GS' ? "بانتظار المشرف العام" :
                                                                record.status === 'PENDING_HR' ? "بانتظار الموارد" :
                                                                    record.status === 'PENDING_AUDIT' ? "بانتظار الرقابة" :
                                                                        record.status === 'PENDING_FINANCE' ? "بانتظار الرواتب" :
                                                                            record.status === 'PENDING_SUPERVISOR' ? "يحتاج تصحيح" :
                                                                                "معتمد نهائياً"
                                                        ) : "بانتظار الإدخال"}
                                                    </span>
                                                </div>
                                                <Link href={`/dashboard/entry/${worker.id}?month=${month}&year=${year}`}>
                                                    <Button size="sm" className={`h-9 px-5 rounded-xl font-black shadow-lg transition-all active:scale-95 ${!isFilled ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200 text-white' : 'bg-white text-blue-600 hover:bg-blue-50 border border-blue-100'}`}>
                                                        {isFilled ? (record.status === 'PENDING_SUPERVISOR' ? "تصحيح" : "تعديل") : "إدخال الحضور"}
                                                    </Button>
                                                </Link>
                                            </div>

                                            {isFilled && (
                                                <div className="grid grid-cols-2 gap-2 mt-3">
                                                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-50 flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">أيام عادية</span>
                                                        <span className="text-sm font-black text-slate-900">{record.normalDays}</span>
                                                    </div>
                                                    <div className="bg-white/60 p-2 rounded-xl border border-emerald-50 flex flex-col items-center">
                                                        <span className="text-[8px] font-black text-slate-400 uppercase">الإجمالي</span>
                                                        <span className="text-sm font-black text-blue-600">{record.totalCalculatedDays}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Printable Area - Standardized Official Layout */}
            <div className="fixed top-0 left-0 w-0 h-0 invisible overflow-hidden print:visible print:static print:w-full print:h-auto print:overflow-visible bg-white z-[9999]">
                <div className="text-center mb-10 border-b-[6px] border-emerald-700 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">كشف حصور وانصراف الكوادر</h1>
                            <p className="text-gray-600">
                                الشهر: {month} / {year} | القطاع: {selectedAreaId === "ALL" ? "جميع المناطق التابعة" : areas.find(a => a.id === selectedAreaId)?.name}
                            </p>
                            <p className="text-sm mt-1 text-emerald-600 font-bold uppercase">قسم المراقبة والرقابة</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">تقرير إثبات الدوام الشهري</h1>
                    <div className="flex justify-center gap-12 mt-4 text-slate-600 font-black">
                        <p>الشهر: <span className="text-emerald-700">{month}</span></p>
                        <p>السنة: <span className="text-emerald-700">{year}</span></p>
                        <p>المراقب المسؤول: <span className="text-emerald-700">{currentUser?.name}</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-3 text-right">م</th>
                            <th className="border-2 border-slate-900 p-3 text-right">رقم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">اسم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الجنسية</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أيام عادية</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">إضافي عادي (0.5)</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">إضافي عطل (1.0)</th>
                            <th className="border-2 border-slate-900 p-3 text-center text-[10px]">أيام أعياد (1.0)</th>
                            <th className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWorkers.map((worker, index) => {
                            const record = getWorkerAttendance(worker.id, month, year);
                            const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;
                            return (
                                <tr key={worker.id} className="border-b-2 border-slate-400">
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                    <td className="border-2 border-slate-900 p-3 font-mono">{worker.id}</td>
                                    <td className="border-2 border-slate-900 p-3 font-black">{worker.name}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center">{worker.nationality}</td>
                                    <td className="border-2 border-slate-900 p-3">{areaName}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? record.normalDays : "0"}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? record.overtimeNormalDays : "0"}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? record.overtimeHolidayDays : "0"}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{record ? (record.overtimeEidDays || 0) : "0"}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-black bg-slate-50">{record ? record.totalCalculatedDays : "0"}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">توقيع المراقب المسؤول</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد المراقب العام</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع والختم</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد إدارة المشاريع</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم الدائرة</p>
                    </div>
                </div>

                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest">
                        {`نظام تأييد الدوام الذكي - التاريخ: ${printMetadata.date} - الرقم المرجعي: ${printMetadata.ref}`}
                    </p>
                </div>
            </div>
        </>
    );
}
