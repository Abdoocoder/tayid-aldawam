"use client";

import React, { useState, useEffect } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
import { User, Worker, Area } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '../ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    History,
    Loader2,
    Menu,
    Shield,
    Activity,
    MapPin,
    HardHat,
    Printer,
    Search,
    FileSpreadsheet
} from 'lucide-react';
import { ThemeToggle } from '../ui/theme-toggle';
import { exportToExcel, formatAttendanceForExport } from "@/lib/export-utils";

// Sub Components
import { UsersTab } from './admin/UsersTab';
import { WorkersTab } from './admin/WorkersTab';
import { LogsTab } from './admin/LogsTab';
import { AreasTab } from './admin/AreasTab';

import { Input } from '../ui/input';
import { MobileNav, NavItem } from "../ui/mobile-nav";

export const AdminView = () => {
    const {
        workers, attendanceRecords, users, auditLogs, areas, isLoading,
        updateUser, deleteUser,
        addWorker, updateWorker, deleteWorker,
        addArea, updateArea, deleteArea
    } = useAttendance();
    const { appUser } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workers' | 'logs' | 'areas'>('overview');

    // Management states
    const [searchTerm, setSearchTerm] = useState("");
    const [tableFilter, setTableFilter] = useState("ALL");
    const [actionFilter, setActionFilter] = useState("ALL");
    const [workerNationalityFilter, setWorkerNationalityFilter] = useState("ALL");

    const [editingItem, setEditingItem] = useState<{
        type: 'user', data: Partial<User> & { id: string }
    } | {
        type: 'worker', data: Partial<Worker> & { id: string }
    } | {
        type: 'area', data: Partial<Area> & { id: string }
    } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Clear search term when switching tabs
    useEffect(() => {
        setSearchTerm("");
    }, [activeTab]);

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'user') return;

        const data = editingItem.data;
        if (!data.name || data.name.trim().length < 2) {
            showToast('خطأ في البيانات', 'يجب أن يكون الاسم حرفين على الأقل', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem.data.id !== 'NEW') {
                await updateUser(editingItem.data.id, editingItem.data as Partial<User>, selectedAreaIds);
                showToast('تم تحديث بيانات المستخدم بنجاح');
            } else {
                showToast('تنبيه', 'خاصية إضافة المستخدمين قيد التطوير', 'warning');
            }

            setEditingItem(null);
        } catch (err) {
            console.error(err);
            showToast('فشل حفظ البيانات', 'يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (appUser?.id === id) {
            showToast('تنبيه', 'لا يمكنك حذف حسابك الشخصي', 'warning');
            return;
        }
        if (!window.confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await deleteUser(id);
            showToast('تم حذف المستخدم بنجاح');
        } catch (err) {
            console.error(err);
            showToast('فشل حذف المستخدم', 'يرجى المحاولة مرة أخرى', 'error');
        }
    };

    const handleSaveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'worker') return;

        setIsSaving(true);
        try {
            if (editingItem.data.id === 'NEW') {
                await addWorker(editingItem.data as Worker);
                showToast('تم إضافة العامل بنجاح');
            } else {
                await updateWorker(editingItem.data.id, editingItem.data as Partial<Worker>);
                showToast('تم تحديث بيانات العامل');
            }
            setEditingItem(null);
        } catch (err) {
            console.error(err);
            showToast('خطأ', 'فشل حفظ بيانات العامل', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorker = async (id: string) => {
        const hasAttendance = attendanceRecords.some(r => r.workerId === id);
        if (hasAttendance) {
            showToast('تنبيه', 'لا يمكن حذف هذا العامل لوجود سجلات حضور مرتبطة به', 'warning');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا العامل نهائياً؟')) return;

        try {
            await deleteWorker(id);
            showToast('تم حذف العامل بنجاح');
        } catch (err) {
            console.error(err);
            showToast('خطأ', 'فشل حذف العامل', 'error');
        }
    };

    const handleSaveArea = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'area') return;

        setIsSaving(true);
        try {
            if (editingItem.data.id === 'NEW') {
                await addArea(editingItem.data.name as string);
                showToast('تم إضافة القطاع بنجاح');
            } else {
                await updateArea(editingItem.data.id, editingItem.data.name as string);
                showToast('تم تحديث اسم القطاع');
            }
            setEditingItem(null);
        } catch (err) {
            console.error(err);
            showToast('خطأ', 'فشل حفظ بيانات القطاع', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteArea = async (id: string) => {
        const areaWorkers = workers.filter(w => w.areaId === id);
        if (areaWorkers.length > 0) {
            showToast('تنبيه', 'لا يمكن حذف القطاع لوجود عمال مسجلين فيه', 'warning');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف هذا القطاع؟')) return;

        try {
            await deleteArea(id);
            showToast('تم حذف القطاع بنجاح');
        } catch (err) {
            console.error(err);
            showToast('خطأ', 'فشل حذف القطاع', 'error');
        }
    };


    const navItems: NavItem<'overview' | 'users' | 'workers' | 'logs' | 'areas'>[] = [
        { id: 'overview', label: 'الرئيسية', icon: Activity },
        { id: 'users', label: 'المستخدمين', icon: Users },
        { id: 'workers', label: 'العمال', icon: HardHat },
        { id: 'areas', label: 'القطاعات', icon: MapPin },
        { id: 'logs', label: 'السجلات', icon: History },
    ];

    if (isLoading) {
        return <div className="flex justify-center p-20 font-black text-slate-400 animate-pulse">جاري تحميل لوحة التحكم الفائقة...</div>;
    }

    return (
        <>
            <div className="print:hidden">
                <MobileNav<'overview' | 'users' | 'workers' | 'logs' | 'areas'>
                    isOpen={isMobileNavOpen}
                    onClose={() => setIsMobileNavOpen(false)}
                    items={navItems}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    user={{ name: appUser?.name || "مدير النظام", role: "الإدارة التقنية (IT Admin)" }}
                />
            </div>

            <div className="space-y-8 pb-24">
                {/* Print Header */}
                <div className="hidden print:block pb-6 border-b-2 border-slate-900 mb-6">
                    <div className="flex justify-between items-center">
                        <div className="text-right">
                            <h1 className="text-2xl font-black text-slate-900">تقرير إدارة النظام</h1>
                            <p className="text-sm font-bold text-slate-500 mt-1">
                                {activeTab === 'users' ? 'سجل المستخدمين' :
                                    activeTab === 'workers' ? 'سجل العمال' :
                                        activeTab === 'areas' ? 'سجل القطاعات' :
                                            activeTab === 'logs' ? 'سجل العمليات' : 'تقرير عام'}
                            </p>
                        </div>
                        <div className="text-left">
                            <p className="text-xs font-mono text-slate-400">{new Date().toLocaleDateString('ar-JO')}</p>
                            <p className="text-[10px] uppercase text-slate-300 font-black tracking-widest">System Admin Report</p>
                        </div>
                    </div>
                </div>

                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-4 bg-white/40 dark:bg-slate-950/40 backdrop-blur-2xl border-b border-white/20 dark:border-white/5 shadow-sm print:hidden">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <div className="absolute -inset-1 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                                <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 p-3 rounded-2xl text-white shadow-xl">
                                    <Shield className="h-6 w-6" />
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">إدارة النظام</h2>
                                    <div className="flex items-center bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full scale-90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mr-1.5" />
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Technical Admin</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] mt-1.5">System Maintenance & User Access</p>
                            </div>
                        </div>

                        {/* Navigation Tabs - Desktop */}
                        <div className="hidden lg:flex bg-slate-100/40 dark:bg-slate-800/40 p-1.5 rounded-[1.5rem] border border-slate-200/40 dark:border-white/5 backdrop-blur-md shadow-inner">
                            {navItems.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-500 relative ${activeTab === tab.id
                                        ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-lg shadow-indigo-100 dark:shadow-none ring-1 ring-slate-100 dark:ring-white/10"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5"
                                        }`}
                                >
                                    <tab.icon className={`h-4 w-4 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="hidden lg:flex items-center gap-3">
                            <ThemeToggle />
                            {activeTab !== 'overview' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-10 px-4 rounded-xl border-slate-200 bg-white/50 text-slate-600 hover:text-indigo-600 font-black text-xs gap-2 transition-all"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4" />
                                    طباعة
                                </Button>
                            )}
                        </div>

                        {/* Mobile Menu & Theme Trigger */}
                        <div className="lg:hidden flex items-center gap-2">
                            <ThemeToggle />
                            <button
                                onClick={() => setIsMobileNavOpen(true)}
                                className="p-3 bg-white/80 border border-slate-200 rounded-2xl text-slate-600 shadow-xl active:scale-95 transition-all"
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-7xl mx-auto px-4 print:max-w-none print:px-0 print:w-full"
                >
                    {/* Content based on active tab */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">نظرة عامة على النظام</h3>
                                        <Button
                                            variant="outline"
                                            className="h-10 px-4 rounded-xl border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-600 dark:hover:bg-emerald-600 hover:text-white font-black text-[10px] gap-2 transition-all group"
                                            onClick={() => {
                                                const formatted = formatAttendanceForExport(attendanceRecords, workers, areas);
                                                exportToExcel(formatted, 'تقرير_الحضور_الشامل', 'Attendance');
                                            }}
                                        >
                                            <FileSpreadsheet className="h-4 w-4 group-hover:scale-110 transition-transform" />
                                            تصدير تقرير (Excel)
                                        </Button>
                                    </div>
                                    {/* Stats Grid - Responsive & Premium */}
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        {[
                                            {
                                                label: 'إجمالي العمال',
                                                value: workers.length,
                                                unit: 'عامل',
                                                icon: Users,
                                                gradient: 'from-indigo-600 to-indigo-700',
                                                desc: 'قاعدة بيانات العمال'
                                            },
                                            {
                                                label: 'المستخدمين',
                                                value: users.length,
                                                unit: 'حساب',
                                                icon: Users,
                                                gradient: 'from-violet-600 to-violet-700',
                                                desc: 'طاقم النظام'
                                            },
                                            {
                                                label: 'سجلات الحضور',
                                                value: attendanceRecords.length,
                                                unit: 'سجل',
                                                icon: Users,
                                                gradient: 'from-blue-600 to-blue-700',
                                                desc: 'الأرشيف المركزي'
                                            },
                                            {
                                                label: 'العمليات',
                                                value: auditLogs.length,
                                                unit: 'عملية',
                                                icon: History,
                                                gradient: 'from-slate-700 to-slate-800',
                                                desc: 'نشاط النظام'
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
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Workflow Distribution */}
                                        <div className="lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="flex items-center gap-3">
                                                    <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                                                        <Activity className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">مسار الاعتمادات</h3>
                                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Workflow Distribution</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {[
                                                    { label: 'بانتظار الميدان', status: 'PENDING_SUPERVISOR', color: 'bg-amber-500' },
                                                    { label: 'بانتظار الصحية', status: 'PENDING_HEALTH', color: 'bg-emerald-500' },
                                                    { label: 'بانتظار الرقابة', status: 'PENDING_AUDIT', color: 'bg-indigo-500' },
                                                    { label: 'بانتظار المالية', status: 'PENDING_FINANCE', color: 'bg-violet-500' },
                                                    { label: 'بانتظار الرواتب', status: 'PENDING_PAYROLL', color: 'bg-rose-500' },
                                                    { label: 'مكتمل نهائياً', status: 'APPROVED', color: 'bg-slate-900' },
                                                ].map((s) => {
                                                    const count = attendanceRecords.filter(r => r.status === s.status).length;
                                                    const total = attendanceRecords.length || 1;
                                                    const percentage = Math.round((count / total) * 100);

                                                    return (
                                                        <div key={s.status} className="bg-white/40 dark:bg-slate-800/20 border border-white dark:border-white/5 p-4 rounded-3xl hover:bg-white dark:hover:bg-slate-800/40 transition-all duration-500">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className={`w-2 h-2 rounded-full ${s.color}`} />
                                                                <span className="text-[10px] font-black text-slate-500 truncate">{s.label}</span>
                                                            </div>
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-2xl font-black text-slate-900 dark:text-white">{count}</span>
                                                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">%{percentage}</span>
                                                            </div>
                                                            <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden">
                                                                <div className={`h-full ${s.color}`} style={{ width: `${percentage}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Workforce Coverage */}
                                        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/5 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                                            <div className="flex items-center gap-3 mb-8">
                                                <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 p-2 rounded-xl">
                                                    <MapPin className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">توزيع العمال</h3>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Area Coverage</p>
                                                </div>
                                            </div>

                                            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                {areas.map((area) => {
                                                    const areaWorkers = workers.filter(w => w.areaId === area.id).length;
                                                    const totalWorkers = workers.length || 1;
                                                    const percentage = Math.round((areaWorkers / totalWorkers) * 100);

                                                    return (
                                                        <div key={area.id} className="group/area">
                                                            <div className="flex justify-between items-center mb-1.5">
                                                                <span className="text-xs font-black text-slate-700 dark:text-slate-200">{area.name}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{areaWorkers} عامل</span>
                                                            </div>
                                                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 group-hover/area:from-blue-500 group-hover/area:to-indigo-600 transition-all duration-700"
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'users' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                                        <div className="flex items-center gap-2 px-3">
                                            <Users className="h-4 w-4 text-indigo-600" />
                                            <span className="text-xs font-black text-slate-700 hidden sm:inline">المستخدمين</span>
                                        </div>
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                id="user-search"
                                                name="userSearch"
                                                aria-label="بحث عن المستخدمين"
                                                placeholder="بحث سريع..."
                                                className="pr-9 h-9 bg-white/80 border-slate-200/60 focus:bg-white transition-all rounded-xl text-xs font-bold"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <UsersTab
                                        users={users}
                                        areas={areas}
                                        searchTerm={searchTerm}
                                        onEditUser={(u: User) => {
                                            setEditingItem({ type: 'user', data: u });
                                            setSelectedAreaIds(u.areaId ? [u.areaId] : []);
                                        }}
                                        onDeleteUser={handleDeleteUser}
                                        onToggleActive={(id: string, current: boolean) => updateUser(id, { isActive: !current })}
                                        onAddUser={() => setEditingItem({ type: 'user', data: { id: 'NEW', name: '', username: '', role: 'SUPERVISOR', areaId: '' } })}
                                    />
                                </div>
                            )}

                            {activeTab === 'workers' && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                                        <div className="flex items-center gap-2 px-3">
                                            <HardHat className="h-4 w-4 text-blue-600" />
                                            <span className="text-xs font-black text-slate-700 hidden sm:inline">إدارة العمال</span>
                                        </div>
                                        <div className="relative flex-1 max-w-md">
                                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                            <Input
                                                id="worker-search"
                                                name="workerSearch"
                                                aria-label="بحث عن العمال"
                                                placeholder="بحث سريع..."
                                                className="pr-9 h-9 bg-white/80 border-slate-200/60 focus:bg-white transition-all rounded-xl text-xs font-bold"
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <WorkersTab
                                        workers={workers}
                                        areas={areas}
                                        searchTerm={searchTerm}
                                        nationalityFilter={workerNationalityFilter}
                                        onNationalityFilterChange={setWorkerNationalityFilter}
                                        onEditWorker={(w: Worker) => setEditingItem({ type: 'worker', data: w })}
                                        onDeleteWorker={handleDeleteWorker}
                                        onAddWorker={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: areas[0]?.id || '', baseSalary: 300, dayValue: 10, nationality: 'مصري' } })}
                                    />
                                </div>
                            )}

                            {activeTab === 'logs' && (
                                <LogsTab
                                    logs={auditLogs}
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    tableFilter={tableFilter}
                                    onTableFilterChange={setTableFilter}
                                    actionFilter={actionFilter}
                                    onActionFilterChange={setActionFilter}
                                />
                            )}

                            {activeTab === 'areas' && (
                                <AreasTab
                                    areas={areas}
                                    workers={workers}
                                    users={users}
                                    onEditArea={(a: Area) => setEditingItem({ type: 'area', data: a })}
                                    onDeleteArea={handleDeleteArea}
                                    onAddArea={() => setEditingItem({ type: 'area', data: { id: 'NEW', name: '' } })}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </motion.div >
            </div >

            {/* Editing Modal */}
            <AnimatePresence>
                {
                    editingItem && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setEditingItem(null)}
                                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="relative bg-white/95 backdrop-blur-xl rounded-3xl w-full max-w-lg shadow-2xl border border-white/50 overflow-hidden"
                            >
                                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                    <div className="text-right">
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                            {editingItem.data.id === 'NEW' ? 'إضافة جديد' : 'تعديل البيانات'}
                                        </h3>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إدارة موارد النظام</p>
                                    </div>
                                    <button onClick={() => setEditingItem(null)} className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                        <span className="text-lg font-bold">✕</span>
                                    </button>
                                </div>

                                {editingItem.type === 'user' && (
                                    <form onSubmit={handleSaveUser} className="p-6 space-y-5">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">اسم الدخول</label>
                                                <Input
                                                    required
                                                    disabled={editingItem.data.id !== 'NEW'}
                                                    value={editingItem.data.username || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, username: e.target.value } })}
                                                    className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                                                    placeholder="Username"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الاسم الظاهر</label>
                                                <Input
                                                    required
                                                    value={editingItem.data.name || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                                    className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                                                    placeholder="Name"
                                                />
                                            </div>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 h-12 rounded-xl font-black">
                                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ البيانات'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {editingItem.type === 'worker' && (
                                    <form onSubmit={handleSaveWorker} className="p-6 space-y-5">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">اسم العامل</label>
                                                <Input
                                                    required
                                                    value={editingItem.data.name || ''}
                                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                                    className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">القطاع</label>
                                                    <select
                                                        className="w-full h-12 bg-slate-50/50 border border-slate-100 rounded-xl px-3 text-sm font-bold outline-none"
                                                        value={editingItem.data.areaId || ''}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } })}
                                                    >
                                                        {areas.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الجنسية</label>
                                                    <select
                                                        className="w-full h-12 bg-slate-50/50 border border-slate-100 rounded-xl px-3 text-sm font-bold outline-none"
                                                        value={editingItem.data.nationality || 'أردني'}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, nationality: e.target.value } })}
                                                    >
                                                        <option value="أردني">أردني</option>
                                                        <option value="مصري">مصري</option>
                                                        <option value="سوري">سوري</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الراتب الأساسي</label>
                                                    <Input
                                                        type="number"
                                                        value={editingItem.data.baseSalary || 0}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, baseSalary: Number(e.target.value) } })}
                                                        className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">قيمة اليوم</label>
                                                    <Input
                                                        type="number"
                                                        value={editingItem.data.dayValue || 0}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: Number(e.target.value) } })}
                                                        className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-4 flex gap-3">
                                            <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 h-12 rounded-xl font-black">
                                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ العامل'}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {editingItem.type === 'area' && (
                                    <form onSubmit={handleSaveArea} className="p-6 space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">اسم القطاع</label>
                                            <Input
                                                required
                                                value={editingItem.data.name || ''}
                                                onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                                className="h-12 bg-slate-50/50 border-slate-100 rounded-xl"
                                            />
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 h-12 rounded-xl font-black">
                                                {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'حفظ القطاع'}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
        </>
    );
};
