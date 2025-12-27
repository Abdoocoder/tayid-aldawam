"use client";

import React, { useState, useEffect } from 'react';
import { useAttendance, Worker, User, UserRole } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '../ui/button';
import {
    Users,
    History,
    FileText,
    HardHat,
    LayoutDashboard,
    Loader2,
    Save,
    Menu,
    Shield,
    Eye
} from 'lucide-react';
import { Badge } from '../ui/badge';

// Sub Components
import { UsersTab } from './admin/UsersTab';
import { WorkersTab } from './admin/WorkersTab';
import { LogsTab } from './admin/LogsTab';

import { Input } from '../ui/input';
import { MonthYearPicker } from "../ui/month-year-picker";
import { Search, MapPin } from "lucide-react";
import { MobileNav, NavItem } from "../ui/mobile-nav";

interface WorkerEditingData extends Partial<Worker> {
    id: string;
    id_entered?: string;
}

export const AdminView = () => {
    const { workers, attendanceRecords, users, auditLogs, areas, isLoading, addWorker, updateWorker, deleteWorker, updateUser, deleteUser, getWorkerAttendance } = useAttendance();
    const { appUser } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workers' | 'logs' | 'attendance'>('overview');

    // Attendance Management State
    const [attendanceMonth, setAttendanceMonth] = useState(new Date().getMonth() + 1);
    const [attendanceYear, setAttendanceYear] = useState(new Date().getFullYear());
    const [attendanceSearchTerm, setAttendanceSearchTerm] = useState("");

    // Management states
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<{ type: 'worker', data: WorkerEditingData } | { type: 'user', data: User | (Partial<User> & { id: 'NEW' }) } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

    // Log filters
    const [logSearchTerm, setLogSearchTerm] = useState("");
    const [logTableFilter, setLogTableFilter] = useState("ALL");
    const [logActionFilter, setLogActionFilter] = useState("ALL");
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Clear search term when switching tabs
    useEffect(() => {
        setSearchTerm("");
    }, [activeTab]);

    const handleSaveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'worker') return;

        const data = editingItem.data;
        if (!data.name || data.name.trim().length < 2) {
            showToast('خطأ في البيانات', 'يجب أن يكون اسم العامل حرفين على الأقل', 'warning');
            return;
        }
        if (data.dayValue === undefined || data.dayValue < 0) {
            showToast('خطأ في البيانات', 'قيمة اليوم يجب أن تكون صفر أو أكثر', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem.data.id !== 'NEW') {
                await updateWorker(editingItem.data.id, editingItem.data as Partial<Worker>);
                showToast('تم تحديث بيانات العامل بنجاح');
            } else {
                const workerData = editingItem.data as WorkerEditingData;
                const finalId = (workerData.id_entered || '').trim();
                if (!finalId) {
                    showToast('خطأ في البيانات', 'يجب إدخال الرقم الوظيفي للبلدية', 'warning');
                    setIsSaving(false);
                    return;
                }
                // Check if ID already exists
                if (workers.some(w => w.id === finalId)) {
                    showToast('خطأ في البيانات', 'هذا الرقم الوظيفي مسجل مسبقاً لعامل آخر', 'warning');
                    setIsSaving(false);
                    return;
                }
                await addWorker({
                    id: finalId,
                    name: workerData.name || '',
                    areaId: workerData.areaId || '',
                    dayValue: workerData.dayValue || 0,
                    baseSalary: workerData.baseSalary || 0,
                });
                showToast('تم إضافة العامل بنجاح');
            }
            setEditingItem(null);
        } catch (err) {
            console.error(err);
            showToast('فشل حفظ البيانات', 'يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setIsSaving(false);
        }
    };

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
                await updateUser(editingItem.data.id, editingItem.data as Partial<User>);
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

    const handleDeleteWorker = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العامل؟')) return;
        try {
            await deleteWorker(id);
            showToast('تم حذف العامل بنجاح');
        } catch (err) {
            console.error(err);
            showToast('فشل حذف العامل', 'يرجى المحاولة مرة أخرى', 'error');
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


    const navItems: NavItem<'overview' | 'users' | 'workers' | 'logs' | 'attendance'>[] = [
        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
        { id: 'users', label: 'المستخدمين', icon: Users },
        { id: 'workers', label: 'العمال', icon: HardHat },
        { id: 'attendance', label: 'الحسابات', icon: FileText },
        { id: 'logs', label: 'السجلات', icon: History },
    ];

    if (isLoading) {
        return <div className="flex justify-center p-20">جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <>
            <MobileNav<'overview' | 'users' | 'workers' | 'logs' | 'attendance'>
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={{ name: appUser?.name || "مدير النظام", role: "الإدارة المركزية (Root)" }}
            />

            <div className="space-y-8 pb-24 animate-in fade-in duration-700 print:hidden">
                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-4 bg-white/40 backdrop-blur-2xl border-b border-white/20 shadow-sm animate-in fade-in slide-in-from-top-4 duration-700 print:hidden">
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
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">الإدارة المركزية</h2>
                                    <div className="flex items-center bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full scale-90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mr-1.5" />
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Root</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">System Governance & Control</p>
                            </div>
                        </div>

                        {/* Navigation Tabs - Desktop */}
                        <div className="hidden md:flex bg-slate-100/40 p-1.5 rounded-[1.5rem] border border-slate-200/40 backdrop-blur-md shadow-inner">
                            {navItems.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'workers' | 'logs' | 'attendance')}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-xs font-black transition-all duration-500 relative ${activeTab === tab.id
                                        ? "bg-white text-indigo-700 shadow-lg shadow-indigo-100 ring-1 ring-slate-100"
                                        : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                        }`}
                                >
                                    <tab.icon className={`h-4 w-4 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="md:hidden p-3 bg-white/80 border border-slate-200 rounded-2xl text-slate-600 shadow-xl active:scale-95 transition-all"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Content based on active tab */}
                <div className="animate-in fade-in zoom-in-95 duration-500 delay-200 print:hidden">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid - Responsive & Premium */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: 'إجمالي العمال',
                                        value: workers.length,
                                        unit: 'عامل',
                                        icon: HardHat,
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
                                        icon: FileText,
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

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Recent Users Card */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Recent Users Card */}
                                    <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">أحدث المستخدمين</h3>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-4 rounded-xl text-indigo-600 hover:bg-indigo-50 font-black text-xs transition-all"
                                                onClick={() => setActiveTab('users')}
                                            >
                                                إدارة الجميع
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {users.slice(0, 5).map((u) => (
                                                <div key={u.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 hover:bg-white transition-all duration-500 border border-white/20 hover:border-indigo-100 group/item shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-black text-slate-600 group-hover/item:from-indigo-600 group-hover/item:to-violet-600 group-hover/item:text-white transition-all duration-500 shadow-sm">
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 text-sm group-hover/item:text-indigo-900 transition-colors">{u.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{u.username}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                                                        {u.role}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Recent Activity Card */}
                                    <div className="bg-white/40 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/20 shadow-2xl shadow-indigo-500/5 relative overflow-hidden group">
                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-violet-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-violet-100 text-violet-600 p-2 rounded-xl">
                                                    <History className="h-5 w-5" />
                                                </div>
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight">آخر التحريرات</h3>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-9 px-4 rounded-xl text-violet-600 hover:bg-violet-50 font-black text-xs transition-all"
                                                onClick={() => setActiveTab('logs')}
                                            >
                                                السجل الكامل
                                            </Button>
                                        </div>
                                        <div className="space-y-4">
                                            {auditLogs.slice(0, 5).map((log) => (
                                                <div key={log.id} className="relative pr-6 py-1 group/log">
                                                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-100 rounded-full group-hover/log:bg-indigo-500 transition-colors duration-500" />
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <Badge className={`text-[9px] font-black border-none ring-1 px-2 py-0.5 rounded-lg ${log.action === 'INSERT' ? 'bg-emerald-50 text-emerald-600 ring-emerald-100' :
                                                            log.action === 'UPDATE' ? 'bg-indigo-50 text-indigo-600 ring-indigo-100' :
                                                                'bg-rose-50 text-rose-600 ring-rose-100'
                                                            }`}>
                                                            {log.action}
                                                        </Badge>
                                                        <span className="text-[10px] text-slate-400 font-black font-mono tracking-widest bg-slate-50 px-2 py-0.5 rounded-md">
                                                            {new Date(log.changed_at).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-700 leading-none">
                                                        تعديل في <span className="text-indigo-600 uppercase font-black">{log.table_name}</span>
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 font-bold mt-1.5 flex items-center gap-2">
                                                        بواسطة <span className="text-slate-600 font-black underline decoration-slate-200 underline-offset-2">{log.changed_by || 'نظام تلقائي'}</span>
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}


                    {activeTab === 'users' && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-2 px-3">
                                    <Users className="h-4 w-4 text-indigo-600" />
                                    <span className="text-xs font-black text-slate-700 hidden sm:inline">المستخدمين</span>
                                </div>
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
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
                                onEditUser={(u) => {
                                    setEditingItem({ type: 'user', data: u });
                                    setSelectedAreaIds(u.areaId ? u.areaId.split(',') : []);
                                }}
                                onDeleteUser={handleDeleteUser}
                                onToggleActive={(id, current) => updateUser(id, { isActive: !current })}
                                onAddUser={() => setEditingItem({ type: 'user', data: { id: 'NEW', name: '', username: '', role: 'SUPERVISOR', areaId: '' } })}
                            />
                        </div>
                    )}

                    {activeTab === 'workers' && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between gap-3 bg-white/60 p-1.5 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
                                <div className="flex items-center gap-2 px-3">
                                    <HardHat className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs font-black text-slate-700 hidden sm:inline">الكوادر العمالية</span>
                                </div>
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="بحث باسم العامل..."
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
                                onEditWorker={(w) => setEditingItem({ type: 'worker', data: w })}
                                onDeleteWorker={handleDeleteWorker}
                                onAddWorker={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}
                            />
                        </div>
                    )}

                    {activeTab === 'logs' && (
                        <div className="space-y-4 animate-in fade-in duration-500">
                            <LogsTab
                                logs={auditLogs}
                                searchTerm={logSearchTerm}
                                onSearchChange={setLogSearchTerm}
                                tableFilter={logTableFilter}
                                onTableFilterChange={setLogTableFilter}
                                actionFilter={logActionFilter}
                                onActionFilterChange={setLogActionFilter}
                            />
                        </div>
                    )}
                </div>

                {activeTab === 'attendance' && (
                    <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl shadow-indigo-500/10 overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
                        <div className="p-10 border-b border-white/10 flex flex-col lg:flex-row justify-between items-center gap-8 bg-gradient-to-br from-emerald-600/10 via-transparent to-transparent relative">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                            <div className="relative z-10 flex items-center gap-8">
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-[2rem] text-white shadow-xl shadow-emerald-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                                    <FileText className="h-8 w-8" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">سجلات الحضور المركزية</h3>
                                    <div className="flex items-center gap-2 mt-3">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Audit & Final Payroll Approval Center</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto relative z-10">
                                <div className="relative w-full sm:w-80 group">
                                    <div className="absolute inset-0 bg-white/50 blur-xl rounded-2xl group-focus-within:bg-emerald-500/10 transition-colors" />
                                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-600 transition-all duration-500" />
                                    <Input
                                        placeholder="بحث باسم العامل..."
                                        className="relative pr-14 h-14 bg-white/40 border-white/20 focus:border-emerald-500 shadow-xl rounded-[1.25rem] text-sm font-black transition-all duration-500 backdrop-blur-md"
                                        value={attendanceSearchTerm}
                                        onChange={e => setAttendanceSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="bg-white/40 p-2 rounded-[1.5rem] border border-white/20 shadow-xl backdrop-blur-md">
                                    <MonthYearPicker month={attendanceMonth} year={attendanceYear} onChange={(m, y) => { setAttendanceMonth(m); setAttendanceYear(y); }} />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/30 border-b border-white/10">
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">الموظف / العامل</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">القطاع البنيوي</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">أيام العمل</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الإضافي التراكمي</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">مرحلة الاعتماد</th>
                                        <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الإدارة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {workers.filter(w =>
                                        w.name.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
                                        w.id.includes(attendanceSearchTerm)
                                    ).map(worker => {
                                        const record = getWorkerAttendance(worker.id, attendanceMonth, attendanceYear);
                                        const areaName = areas.find(a => a.id === worker.areaId)?.name || 'غير محدد';

                                        return (
                                            <tr key={worker.id} className="hover:bg-emerald-50/20 transition-all duration-700 group border-b border-white/5 last:border-0 font-bold">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-6">
                                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-black text-slate-500 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-700 shadow-xl border border-white/20 text-lg">
                                                            {worker.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 group-hover:text-emerald-900 transition-colors text-base leading-tight">{worker.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-black font-mono tracking-widest mt-1.5 uppercase">ID: {worker.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <Badge variant="secondary" className="bg-white/80 text-slate-600 border border-white ring-1 ring-slate-100 font-black text-[10px] px-3 py-1.5 shadow-sm group-hover:shadow-xl group-hover:shadow-emerald-500/10 group-hover:ring-emerald-100 transition-all duration-500">
                                                        <MapPin className="h-4 w-4 ml-2 text-emerald-400 transition-colors" />
                                                        {areaName}
                                                    </Badge>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="text-xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                                                        {record?.normalDays || 0}
                                                        <span className="text-[10px] text-slate-400 mr-2 opacity-60">يوم</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="text-xl font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
                                                        {(record?.overtimeNormalDays || 0) + (record?.overtimeHolidayDays || 0) + (record?.overtimeEidDays || 0)}
                                                        <span className="text-[10px] text-slate-400 mr-2 opacity-60">يوم</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    {!record ? (
                                                        <Badge variant="outline" className="bg-slate-50 text-slate-400 border-dashed border-slate-200 text-[10px] font-black px-4 py-1.5 rounded-xl">لم يتم الرفع</Badge>
                                                    ) : (
                                                        <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest shadow-inner ${record.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                                                            record.status === 'PENDING_SUPERVISOR' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-100' :
                                                                'bg-amber-50 text-amber-700 ring-1 ring-amber-100'
                                                            }`}>
                                                            <div className={`w-2 h-2 rounded-full ${record.status === 'APPROVED' ? 'bg-emerald-500 animate-pulse' :
                                                                record.status === 'PENDING_SUPERVISOR' ? 'bg-rose-500' :
                                                                    'bg-amber-500'
                                                                }`} />
                                                            {record.status === 'APPROVED' ? 'معتمد نهائياً' :
                                                                record.status === 'PENDING_SUPERVISOR' ? 'معاد للتصحيح' :
                                                                    'قيد المراجعة'}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-center flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={!record}
                                                        className="h-12 px-6 rounded-2xl text-emerald-600 hover:bg-white hover:shadow-xl hover:shadow-emerald-500/10 border border-transparent hover:border-white/40 transition-all duration-500 font-black text-xs gap-3 group/btn"
                                                    >
                                                        <Eye className="h-4.5 w-4.5 group-hover/btn:scale-110 transition-transform" />
                                                        التدقيق
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {workers.filter(w =>
                                        w.name.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
                                        w.id.includes(attendanceSearchTerm)
                                    ).length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="py-[10%] text-center text-slate-400 font-black italic text-lg opacity-20">
                                                    لا توجد بيانات حضور مطابقة
                                                </td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals - Kept in parent to share state easily for now, or could be extracted too */}
            {/* Worker Modal - Modern & Responsive */}
            {
                (editingItem?.type === 'worker' && editingItem.data) && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-lg shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="text-right">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                        {editingItem?.data?.id === 'NEW' ? 'إضافة عامل جديد' : 'تعديل بيانات العامل'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">سجل القوى العاملة</p>
                                </div>
                                <button onClick={() => setEditingItem(null)} className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                    <span className="text-lg font-bold">✕</span>
                                </button>
                            </div>
                            <form onSubmit={handleSaveWorker} className="p-6 space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الرقم الوظيفي</label>
                                        <Input
                                            required
                                            disabled={editingItem?.data?.id !== 'NEW'}
                                            value={editingItem?.data?.id === 'NEW' ? editingItem?.data?.id_entered || '' : editingItem?.data?.id || ''}
                                            onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, id_entered: e.target.value } })}
                                            className="h-12 bg-slate-50/50 border-slate-100 focus:border-indigo-500 rounded-xl text-left font-mono"
                                            placeholder="مثال: 1024"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الاسم الكامل</label>
                                        <Input
                                            required
                                            value={editingItem?.data?.name || ''}
                                            onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                            className="h-12 bg-slate-50/50 border-slate-100 focus:border-indigo-500 rounded-xl text-right font-bold"
                                            placeholder="أدخل اسم العامل..."
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">القطاع / الحي</label>
                                        <select
                                            className="w-full h-12 rounded-xl border border-slate-100 px-3 bg-slate-50/50 text-sm font-bold text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                            value={editingItem?.data?.areaId || ''}
                                            onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } })}
                                        >
                                            <option value="">اختر القطاع...</option>
                                            {areas.map(a => (
                                                <option key={a.id} value={a.id}>{a.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">قيمة اليومية (دينار)</label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                step="0.5"
                                                min="0"
                                                required
                                                value={editingItem?.data?.dayValue || 0}
                                                onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: parseFloat(e.target.value) } })}
                                                className="h-12 bg-slate-50/50 border-slate-100 focus:border-indigo-500 rounded-xl text-left font-mono pl-12"
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase">JOD</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3">
                                    <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-black shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="ml-2 h-4 w-4" /> حفظ البيانات</>}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-12 px-6 rounded-xl font-black border-slate-200 text-slate-600 hover:bg-slate-50">إلغاء</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* User Modal - Modern & Responsive */}
            {
                (editingItem?.type === 'user' && editingItem.data) && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                        <div className="bg-white/95 backdrop-blur-xl rounded-2xl w-full max-w-[500px] shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                <div className="text-right">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">
                                        {editingItem?.data?.id === 'NEW' ? 'إضافة مستخدم جديد' : 'تعديل بيانات مستخدم'}
                                    </h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">إدارة صلاحيات النظام</p>
                                </div>
                                <button onClick={() => setEditingItem(null)} className="p-2 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors">
                                    <span className="text-lg font-bold">✕</span>
                                </button>
                            </div>
                            <form onSubmit={handleSaveUser} className="p-6 space-y-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">اسم الدخول (بـ الإنجليزية)</label>
                                        <Input
                                            required
                                            disabled={editingItem?.data?.id !== 'NEW'}
                                            value={editingItem?.data?.username || ''}
                                            onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, username: e.target.value } })}
                                            className="h-12 bg-slate-50/50 border-slate-100 focus:border-indigo-500 rounded-xl text-left font-mono"
                                            placeholder="username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الاسم الظاهر</label>
                                        <Input
                                            required
                                            value={editingItem?.data?.name || ''}
                                            onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                            className="h-12 bg-slate-50/50 border-slate-100 focus:border-indigo-500 rounded-xl text-right font-bold"
                                            placeholder="الاسم الكامل..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">الدور الوظيفي / الصلاحية</label>
                                    <select
                                        className="w-full h-12 rounded-xl border border-slate-100 px-3 bg-slate-50/50 text-sm font-bold text-right focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none"
                                        value={editingItem?.data?.role || 'SUPERVISOR'}
                                        onChange={e => editingItem && setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value as UserRole } })}
                                    >
                                        <optgroup label="الطاقم الميداني">
                                            <option value="SUPERVISOR">مراقب ميداني</option>
                                            <option value="GENERAL_SUPERVISOR">مراقب عام قطاعات</option>
                                        </optgroup>
                                        <optgroup label="الإدارة العليا">
                                            <option value="HEALTH_DIRECTOR">مدير الدائرة الصحية</option>
                                            <option value="HR">قسم الموارد البشرية</option>
                                            <option value="FINANCE">قسم الرواتب والمالية</option>
                                            <option value="MAYOR">عطوفة رئيس البلدية</option>
                                        </optgroup>
                                        <optgroup label="التقنيين">
                                            <option value="ADMIN">مدير النظام الرقمي</option>
                                        </optgroup>
                                    </select>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest block text-right">نطاق الإشراف (القطاعات المتاحة)</label>
                                    <div className="border border-slate-100 rounded-xl p-4 max-h-[160px] overflow-y-auto bg-slate-50/50 shadow-inner">
                                        <div className="space-y-2">
                                            <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100 group">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAreaIds.length === areas.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedAreaIds(areas.map(a => a.id));
                                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: areas.map(a => a.id).join(',') } });
                                                        } else {
                                                            setSelectedAreaIds([]);
                                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: '' } });
                                                        }
                                                    }}
                                                    className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                />
                                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-tighter">تحديد جميع القطاعات</span>
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {areas.map(area => (
                                                    <label key={area.id} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAreaIds.includes(area.id)}
                                                            onChange={(e) => {
                                                                let newIds;
                                                                if (e.target.checked) {
                                                                    newIds = [...selectedAreaIds, area.id];
                                                                } else {
                                                                    newIds = selectedAreaIds.filter(id => id !== area.id);
                                                                }
                                                                setSelectedAreaIds(newIds);
                                                                setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: newIds.join(',') } });
                                                            }}
                                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-[11px] font-bold text-slate-600 truncate">{area.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-black shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]">
                                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="ml-2 h-4 w-4" /> اعتماد المستخدم</>}
                                    </Button>
                                    <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-12 px-6 rounded-xl font-black border-slate-200 text-slate-600 hover:bg-slate-50">إلغاء</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </>
    );
};
