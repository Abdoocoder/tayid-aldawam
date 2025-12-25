"use client";

import React, { useState } from 'react';
import { useAttendance, Worker, User, UserRole } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '../ui/button';
import {
    Edit2,
    Trash2,
    UserPlus,
    Search,
    Printer,
    Users,
    History,
    FileText,
    HardHat,
    LayoutDashboard,
    ShieldCheck,
    Plus,
    Activity,
    MapPin,
    Loader2,
    Save
} from 'lucide-react';
import Image from "next/image";
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { MonthYearPicker } from "../ui/month-year-picker";
import { Select } from "../ui/select";

interface WorkerEditingData extends Partial<Worker> {
    id: string;
    id_entered?: string;
}

export const AdminView = () => {
    const { workers, attendanceRecords, users, auditLogs, areas, isLoading, addWorker, updateWorker, deleteWorker, updateUser, deleteUser, rejectAttendance, getWorkerAttendance } = useAttendance();
    const { appUser } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workers' | 'logs' | 'attendance'>('overview');

    // Stable print metadata - generated on mount to fix purity lint errors
    const [printMetadata] = useState(() => ({
        date: new Date().toLocaleDateString('ar-JO'),
        ref: `ADM-${Math.random().toString(36).substring(7).toUpperCase()}`
    }));

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

    const filteredLogs = auditLogs.filter(log => {
        const matchesSearch = !logSearchTerm || (log.changed_by || '').toLowerCase().includes(logSearchTerm.toLowerCase());
        const matchesTable = logTableFilter === 'ALL' || log.table_name === logTableFilter;
        const matchesAction = logActionFilter === 'ALL' || log.action === logActionFilter;
        return matchesSearch && matchesTable && matchesAction;
    });

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
        // Prevent self-deletion
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


    if (isLoading) {
        return <div className="flex justify-center p-20">جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <>
            <div className="space-y-8 pb-24 animate-in fade-in duration-700 print:hidden">
                {/* Executive Admin Header - Sticky & Premium Glass */}
                <div className="sticky top-0 z-50 -mx-4 px-4 py-4 bg-slate-50/80 backdrop-blur-xl border-b border-slate-200/50 shadow-sm transition-all duration-300">
                    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-5">
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-3 rounded-2xl text-white shadow-xl shadow-indigo-500/20 group hover:scale-105 transition-transform duration-500">
                                <ShieldCheck className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">الإدارة المركزية</h2>
                                    <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100/50 text-[10px] font-black uppercase tracking-widest px-2 py-0">Root</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">System Governance & Control</p>
                            </div>
                        </div>

                        <div className="flex items-center bg-slate-200/50 p-1.5 rounded-2xl border border-slate-300/30 backdrop-blur-md shadow-inner w-full lg:w-auto overflow-x-auto no-scrollbar gap-1">
                            {[
                                { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
                                { id: 'users', label: 'المستخدمين', icon: Users },
                                { id: 'workers', label: 'العمال', icon: HardHat },
                                { id: 'attendance', label: 'الحسابات', icon: FileText },
                                { id: 'logs', label: 'السجلات', icon: History },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                    className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-[11px] font-black transition-all duration-500 whitespace-nowrap group ${activeTab === tab.id
                                        ? 'bg-white text-indigo-600 shadow-lg shadow-slate-200 ring-1 ring-slate-100 scale-[1.02]'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                                        }`}
                                >
                                    <tab.icon className={`h-4 w-4 transition-colors duration-500 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>


                {/* Content based on active tab */}
                {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        {/* Stats Grid - Standardized Pattern */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {[
                                { label: 'إجمالي العمال', value: workers.length, unit: 'عامل', icon: HardHat, color: 'indigo', trend: 'القوى العاملة' },
                                { label: 'المستخدمين النشطين', value: users.length, unit: 'حساب', icon: Users, color: 'violet', trend: 'صلاحيات النظام' },
                                { label: 'سجلات الحضور', value: attendanceRecords.length, unit: 'سجل', icon: FileText, color: 'blue', trend: 'قاعدة البيانات' },
                                { label: 'إجمالي العمليات', value: auditLogs.length, unit: 'عملية', icon: History, color: 'slate', trend: 'سجل التدقيق' }
                            ].map((stat, i) => (
                                <div key={i} className="group relative transition-all duration-500 hover:-translate-y-1">
                                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/50 shadow-xl shadow-slate-200/40 group-hover:shadow-2xl group-hover:bg-white/80 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-3 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 ring-1 ring-${stat.color}-100/50 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                                <stat.icon className="h-6 w-6" />
                                            </div>
                                            <div className={`text-[9px] font-black px-2.5 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700 uppercase tracking-widest shadow-sm`}>
                                                {stat.trend}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1.5">{stat.label}</h3>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">{stat.unit}</span>
                                            </div>
                                        </div>
                                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${stat.color}-100 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-1000 blur-3xl`}></div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Recent Users Card */}
                            <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white/60">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">أحدث المستخدمين</h3>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">المسؤولون والمراقبون المضافون</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-100/50 rounded-2xl text-slate-400">
                                        <Users className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {users.slice(0, 5).map((u) => (
                                        <div key={u.id} className="flex items-center justify-between p-4 rounded-3xl bg-white/40 hover:bg-white transition-all duration-500 border border-transparent hover:border-slate-100 group shadow-sm hover:shadow-md">
                                            <div className="flex items-center gap-4">
                                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-black text-slate-600 group-hover:from-indigo-50 group-hover:to-indigo-100 group-hover:text-indigo-600 transition-all duration-500">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{u.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{u.role}</p>
                                                </div>
                                            </div>
                                            <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors duration-500 ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'} `}>
                                                {u.role}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full mt-8 h-12 rounded-2xl text-indigo-600 hover:bg-indigo-50 font-black text-xs gap-3 border border-indigo-100/20 transition-all"
                                    onClick={() => setActiveTab('users')}
                                >
                                    عرض جميع المستخدمين
                                    <Activity className="h-3.5 w-3.5" />
                                </Button>
                            </div>

                            {/* Recent Activity Card */}
                            <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 border border-white/60">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 tracking-tight">آخر التحريرات</h3>
                                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">سجل العمليات الأخيرة في النظام</p>
                                    </div>
                                    <div className="p-3.5 bg-slate-100/50 rounded-2xl text-slate-400">
                                        <History className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {auditLogs.slice(0, 5).map((log) => (
                                        <div key={log.id} className="relative p-5 rounded-3xl bg-white/40 hover:bg-white transition-all duration-500 border-r-4 border-indigo-500 shadow-sm hover:shadow-md">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-[9px] font-black uppercase tracking-widest">
                                                    {log.action}
                                                </div>
                                                <span className="text-[10px] text-slate-400 font-bold font-mono">
                                                    {new Date(log.changed_at).toLocaleTimeString('ar-JO')}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-slate-800 mb-2">
                                                تعديل في جدول {log.table_name}
                                            </p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                                                <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                                                بواسطة: {log.changed_by || 'نظام'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    variant="ghost"
                                    className="w-full mt-8 h-12 rounded-2xl text-violet-600 hover:bg-violet-50 font-black text-xs gap-3 border border-violet-100/20 transition-all"
                                    onClick={() => setActiveTab('logs')}
                                >
                                    عرض السجل الكامل
                                    <History className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Search Center - Floating Premium Glass */}
                {(activeTab === 'users' || activeTab === 'workers') && (
                    <div className="relative group max-w-2xl mx-auto w-full px-1 animate-in fade-in slide-in-from-bottom-2 duration-1000">
                        <div className="absolute inset-0 bg-indigo-500/5 rounded-[2.5rem] blur-2xl group-focus-within:bg-indigo-500/10 transition-all duration-700"></div>
                        <Search className="absolute right-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 group-focus-within:scale-110 transition-all duration-500 z-10" />
                        <Input
                            placeholder="ابحث بالاسم، الرقم الوظيفي، أو القطاع..."
                            className="pr-16 h-16 bg-white/70 backdrop-blur-xl border border-white/60 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 text-lg transition-all duration-500 relative z-0 placeholder:text-slate-300 font-bold"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-indigo-50/30 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="bg-gradient-to-br from-indigo-100 to-violet-100 p-4 rounded-2xl text-indigo-600 shadow-inner">
                                    <UserPlus className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الصلاحيات</h3>
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Access Control & Team Management</p>
                                </div>
                            </div>
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 h-14 px-10 rounded-2xl font-black text-sm gap-4 group transition-all duration-500 hover:-translate-y-0.5"
                                onClick={() => setEditingItem({ type: 'user', data: { id: 'NEW', name: '', username: '', role: 'SUPERVISOR', areaId: '' } })}
                            >
                                <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                                إضافة مستخدم جديد
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الدور</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">النطاق الإشرافي</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التحكم</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.filter(u =>
                                        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        u.username.toLowerCase().includes(searchTerm.toLowerCase())
                                    ).map((u) => {
                                        const areaName = u.areaId === 'ALL' ? 'التحكم الكامل' : (areas.find(a => a.id === u.areaId)?.name || "غير محدد");
                                        return (
                                            <tr key={u.id} className="hover:bg-indigo-50/30 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all duration-500 shadow-sm">
                                                            {u.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 group-hover:text-indigo-800 transition-colors text-sm">{u.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-black font-mono uppercase tracking-tighter">{u.username}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ring-1 px-2.5 py-0.5 ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 ring-indigo-100/50 border-indigo-200' : 'bg-slate-50 text-slate-600 ring-slate-100'} `}>
                                                        {u.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-2.5 text-[11px] font-black text-slate-500 group-hover:text-indigo-600 transition-colors">
                                                        <MapPin className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                                        {areaName}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest ${u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-amber-50 text-amber-700 border border-amber-100/50'} `}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} `}></span>
                                                        {u.isActive ? 'نشط' : 'معطل'}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm transition-all duration-300"
                                                            onClick={() => {
                                                                setEditingItem({ type: 'user', data: u });
                                                                setSelectedAreaIds(u.areaId ? u.areaId.split(',') : []);
                                                            }}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className={`h-10 w-10 rounded-xl transition-all duration-300 ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'} `}
                                                            onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                                                        >
                                                            <ShieldCheck className="h-4.5 w-4.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                                                            onClick={() => handleDeleteUser(u.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'workers' && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-blue-50/30 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-2xl text-blue-600 shadow-inner">
                                    <HardHat className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">الكوادر العمالية</h3>
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Workforce Management & Area Assignment</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs gap-2.5 transition-all"
                                    onClick={() => window.print()}
                                >
                                    <Printer className="h-4 w-4" />
                                    نسخة ورقية
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 h-12 px-8 rounded-2xl font-black text-sm gap-3 group transition-all duration-500 hover:-translate-y-0.5"
                                    onClick={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}
                                >
                                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                                    إضافة عامل جديد
                                </Button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعرف (ID)</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">الاسم الكامل</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">القطاع / الحي</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الأجر اليومي</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التحكم</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {workers.filter(w => {
                                        const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                                        return w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            areaName.toLowerCase().includes(searchTerm.toLowerCase());
                                    }).map((w) => {
                                        const areaName = areas.find(a => a.id === w.areaId)?.name || "غير محدد";
                                        return (
                                            <tr key={w.id} className="hover:bg-blue-50/30 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                                <td className="px-8 py-6">
                                                    <span className="bg-slate-100 text-slate-500 px-3.5 py-1 rounded-xl font-mono text-[10px] font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-500">
                                                        #{w.id}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="font-black text-slate-900 group-hover:text-blue-800 transition-colors text-sm">{w.name}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-100/50 font-black text-[10px] px-2.5 shadow-sm group-hover:shadow-md transition-all">
                                                        <MapPin className="h-3.5 w-3.5 ml-1.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
                                                        {areaName}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{w.dayValue} <span className="text-[10px] text-slate-400">د.أ</span></div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm transition-all duration-300"
                                                            onClick={() => setEditingItem({ type: 'worker', data: w })}
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                                                            onClick={() => handleDeleteWorker(w.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'attendance' && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="p-8 border-b border-slate-100/50 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gradient-to-r from-emerald-50/30 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-2xl text-emerald-600 shadow-inner">
                                    <FileText className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">سجلات الحضور المركزية</h3>
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Audit & Final Payroll Approval Center</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                <div className="relative w-full sm:w-72 group">
                                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                    <Input
                                        placeholder="بحث باسم العامل..."
                                        className="pr-12 h-12 bg-white/60 border-slate-200 focus:border-emerald-500 rounded-2xl shadow-sm text-sm font-bold"
                                        value={attendanceSearchTerm}
                                        onChange={e => setAttendanceSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="bg-white/80 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                                    <MonthYearPicker month={attendanceMonth} year={attendanceYear} onChange={(m, y) => { setAttendanceMonth(m); setAttendanceYear(y); }} />
                                </div>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الموظف / العامل</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">القطاع البنيوي</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">أيام العمل</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الإضافي التراكمي</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">مرحلة الاعتماد</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الإدارة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {workers.filter(w =>
                                        w.name.toLowerCase().includes(attendanceSearchTerm.toLowerCase()) ||
                                        w.id.includes(attendanceSearchTerm)
                                    ).map(worker => {
                                        const record = getWorkerAttendance(worker.id, attendanceMonth, attendanceYear);
                                        const areaName = areas.find(a => a.id === worker.areaId)?.name || 'غير محدد';

                                        return (
                                            <tr key={worker.id} className="hover:bg-emerald-50/20 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-all duration-500 shadow-sm">
                                                            {worker.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-slate-900 group-hover:text-emerald-800 transition-colors text-sm">{worker.name}</div>
                                                            <div className="text-[10px] text-slate-400 font-black font-mono tracking-tighter">#{worker.id}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-100/50 font-black text-[10px] px-2.5 shadow-sm group-hover:shadow-md transition-all">
                                                        <MapPin className="h-3.5 w-3.5 ml-1.5 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
                                                        {areaName}
                                                    </Badge>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <div className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">{record ? record.normalDays : '-'}</div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    {record ? (
                                                        <div className="flex flex-wrap gap-1.5 justify-center">
                                                            <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100 shadow-sm">ع {record.overtimeNormalDays}</span>
                                                            <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg border border-rose-100 shadow-sm">ط {record.overtimeHolidayDays}</span>
                                                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg border border-emerald-100 shadow-sm">أ {record.overtimeEidDays || 0}</span>
                                                        </div>
                                                    ) : <div className="text-center text-slate-300">-</div>}
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    {record ? (
                                                        <Badge className={`rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm ring-1 px-3 py-1 ${record.status === 'APPROVED' ? "bg-emerald-600 text-white ring-emerald-500" : "bg-slate-100 text-slate-600 ring-slate-200"} `}>
                                                            {record.status === 'APPROVED' ? 'معتمد نهائياً' :
                                                                record.status === 'PENDING_FINANCE' ? 'بانتظار الرواتب' :
                                                                    record.status === 'PENDING_HR' ? 'بانتظار الموارد' :
                                                                        record.status === 'PENDING_GS' ? 'بانتظار المراقب العام' :
                                                                            record.status === 'PENDING_SUPERVISOR' ? 'معاد للتصحيح' : 'غير معروف'}
                                                        </Badge>
                                                    ) : <span className="text-slate-300 font-black font-mono text-[10px] tracking-widest opacity-40">NO_DATA</span>}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-center">
                                                        {record && record.status === 'APPROVED' && (
                                                            <Button
                                                                variant="destructive"
                                                                className="text-[10px] h-9 px-5 rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100/50 transition-all shadow-sm hover:shadow-rose-200"
                                                                onClick={async () => {
                                                                    if (confirm('هل أنت متأكد من إلغاء الاعتماد النهائي لهذا السجل وإعادته لقسم الرواتب؟')) {
                                                                        try {
                                                                            await rejectAttendance(record.id, 'PENDING_FINANCE');
                                                                            showToast('تم إلغاء الاعتماد بنجاح');
                                                                        } catch {
                                                                            showToast('فشل العملية', 'حدث خطأ أثناء إلغاء الاعتماد', 'error');
                                                                        }
                                                                    }
                                                                }}
                                                            >
                                                                إلغاء الاعتماد نهائياً
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
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

                {activeTab === 'logs' && (
                    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                        <div className="p-8 border-b border-slate-100/50 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gradient-to-r from-slate-50/50 to-transparent">
                            <div className="flex items-center gap-6">
                                <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-2xl text-slate-600 shadow-inner">
                                    <History className="h-7 w-7" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">سجل الرقابة والنظام</h3>
                                    <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Full System Audit & Activity Tracking</p>
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                <div className="relative w-full sm:w-64">
                                    <Input
                                        placeholder="تصفية حسب المسئول..."
                                        className="h-12 bg-white/60 border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm text-sm font-bold"
                                        value={logSearchTerm}
                                        onChange={e => setLogSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="h-12 px-4 bg-white/60 border border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm text-sm font-bold text-slate-600 outline-none transition-all cursor-pointer"
                                    value={logActionFilter}
                                    onChange={e => setLogActionFilter(e.target.value)}
                                >
                                    <option value="ALL">جميع العمليات</option>
                                    <option value="INSERT">إضافة (INSERT)</option>
                                    <option value="UPDATE">تعديل (UPDATE)</option>
                                    <option value="DELETE">حذف (DELETE)</option>
                                </select>
                                <select
                                    className="h-12 px-4 bg-white/60 border border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm text-sm font-bold text-slate-600 outline-none transition-all cursor-pointer"
                                    value={logTableFilter}
                                    onChange={e => setLogTableFilter(e.target.value)}
                                >
                                    <option value="ALL">جميع الجداول</option>
                                    <option value="workers">العمال (Workers)</option>
                                    <option value="users">المستخدمين (Users)</option>
                                    <option value="attendance_records">الحضور (Attendance)</option>
                                    <option value="areas">القطاعات (Areas)</option>
                                </select>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التوقيت</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">العملية</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الجدول المتأثر</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التغييرات الجوهرية</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredLogs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                            <td className="px-8 py-6">
                                                <div className="text-[11px] font-black font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                                                    {new Date(log.changed_at).toLocaleString('ar-JO')}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm text-xs">
                                                        {log.changed_by?.charAt(0) || 'S'}
                                                    </div>
                                                    <span className="font-black text-slate-700 text-sm">{log.changed_by || 'نظام تلقائي'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg ${log.action === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                        'bg-rose-50 text-rose-700 border-rose-100'} `}>
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{log.table_name}</div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-mono text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 shadow-inner group-hover:bg-white group-hover:text-slate-600 transition-all">
                                                    {JSON.stringify(log.new_data)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="py-[10%] text-center text-slate-400 font-black italic text-lg opacity-20">
                                                لا توجد سجلات مطابقة
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Printable Area - Standardized Official Layout */}
            < div className="hidden print:block font-sans" >
                <div className="text-center mb-10 border-b-[6px] border-slate-900 pb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div className="text-right">
                            <h1 className="text-2xl font-bold mb-1">بيانات العمال والمستحقات الأساسية</h1>
                            <p className="text-gray-600">التاريخ: {new Date().toLocaleDateString('ar-JO')} | القطاع: جميع المناطق</p>
                            <p className="text-sm mt-1 text-red-600 font-bold uppercase">مركز إدارة النظام</p>
                        </div>
                        <Image src="/logo.png" alt="Logo" width={100} height={70} className="print-logo" priority />
                        <div className="text-left text-sm font-bold text-slate-500">
                            <p>التاريخ: {printMetadata.date}</p>
                            <p>الرقم: AD/{printMetadata.ref}</p>
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 mb-2">كشف بيانات القوى العاملة المعتمد</h1>
                    <div className="flex justify-center gap-12 mt-4 text-slate-600 font-black">
                        <p>عدد العمال: <span className="text-red-600">{workers.length}</span></p>
                        <p>تاريخ النسخة: <span className="text-red-600">{new Date().toLocaleDateString('ar-JO')}</span></p>
                    </div>
                </div>

                <table className="w-full border-collapse text-sm mb-12">
                    <thead>
                        <tr className="bg-slate-100 font-black border-2 border-slate-900">
                            <th className="border-2 border-slate-900 p-3 text-right">م</th>
                            <th className="border-2 border-slate-900 p-3 text-right">رقم العامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الاسم الكامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المنطقة</th>
                            <th className="border-2 border-slate-900 p-3 text-center">أجر اليوم</th>
                            <th className="border-2 border-slate-900 p-3 text-center">الراتب الأساسي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map((w, index) => {
                            const areaName = areas.find(a => a.id === w.areaId)?.name || w.areaId;
                            return (
                                <tr key={w.id} className="border-b-2 border-slate-400">
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{index + 1}</td>
                                    <td className="border-2 border-slate-900 p-3 font-mono">{w.id}</td>
                                    <td className="border-2 border-slate-900 p-3 font-black">{w.name}</td>
                                    <td className="border-2 border-slate-900 p-3">{areaName}</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{w.dayValue} د.أ</td>
                                    <td className="border-2 border-slate-900 p-3 text-center font-bold">{w.baseSalary} د.أ</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="grid grid-cols-3 gap-8 mt-20">
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">مدير النظام</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">تدقيق الموارد البشرية</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-xs">الاسم والتوقيع</p>
                    </div>
                    <div className="space-y-16 text-center">
                        <p className="font-black text-lg underline underline-offset-8 decoration-2 text-slate-800">اعتماد الإدارة العليا</p>
                        <div className="h-20" />
                        <p className="font-bold text-slate-400 text-[10px] border-2 border-dashed border-slate-200 rounded-full w-24 h-24 flex items-center justify-center mx-auto">ختم الإدارة</p>
                    </div>
                </div>
                <div className="mt-32 pt-8 border-t border-slate-200 text-center">
                    <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                        Admin Control Panel - Ref: {printMetadata.ref} - Date: {printMetadata.date}
                    </p>
                </div>
            </div>

            {/* Editing Modals / Forms */}
            <div className="print:hidden">
                {editingItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingItem(null)} />
                        <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className={`h-2 w-full ${editingItem.type === 'user' ? 'bg-indigo-500' : 'bg-blue-500'}`} />
                            <div className="p-8">
                                <h2 className="text-2xl font-black text-slate-900 mb-2">
                                    {editingItem.data.id === 'NEW' ? 'إضافة سجل جديد' : 'تعديل البيانات'}
                                </h2>
                                <p className="text-sm text-slate-500 font-bold mb-8">يرجى التحقق من صحة المعلومات المدخلة قبل الحفظ</p>

                                <form onSubmit={editingItem.type === 'user' ? handleSaveUser : handleSaveWorker} className="space-y-6">
                                    {editingItem.type === 'user' ? (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الاسم الكامل</label>
                                                    <Input
                                                        className="h-12 rounded-2xl bg-white border-slate-100 focus:border-rose-500 text-sm font-bold"
                                                        value={editingItem.data.name}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">اسم المستخدم</label>
                                                    <Input
                                                        className="h-12 rounded-2xl bg-white border-slate-100 focus:border-rose-500 text-sm font-bold"
                                                        value={editingItem.data.username}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, username: e.target.value } })}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">نوع الحساب / الصلاحيات</label>
                                                <Select
                                                    value={editingItem.data.role}
                                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value as UserRole } })}
                                                    className="h-12 rounded-2xl bg-white border-slate-100 font-black text-sm"
                                                >
                                                    <option value="SUPERVISOR">مراقب قطاع (Supervisor)</option>
                                                    <option value="GENERAL_SUPERVISOR">مراقب عام (GS)</option>
                                                    <option value="HR">موارد بشرية (HR)</option>
                                                    <option value="FINANCE">مالية (Finance)</option>
                                                    <option value="MAYOR">رئيس بلدية (Mayor)</option>
                                                    <option value="ADMIN">مدير نظام (Admin)</option>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">النطاق الجغرافي / القطاع</label>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-40 p-1">
                                                    <div
                                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center text-center text-[11px] font-black ${selectedAreaIds.includes('ALL')
                                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                                                            : 'bg-white text-slate-500 border-slate-100 hover:border-indigo-200'
                                                            }`}
                                                        onClick={() => {
                                                            const newIds = selectedAreaIds.includes('ALL') ? [] : ['ALL'];
                                                            setSelectedAreaIds(newIds);
                                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: newIds.join(',') } });
                                                        }}
                                                    >
                                                        كل المناطق
                                                    </div>
                                                    {areas.map(area => (
                                                        <div
                                                            key={area.id}
                                                            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-center text-center text-[11px] font-black ${selectedAreaIds.includes(area.id)
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-500 shadow-md'
                                                                : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                                                                }`}
                                                            onClick={() => {
                                                                let newIds = [...selectedAreaIds].filter(id => id !== 'ALL');
                                                                if (newIds.includes(area.id)) {
                                                                    newIds = newIds.filter(id => id !== area.id);
                                                                } else {
                                                                    newIds.push(area.id);
                                                                }
                                                                setSelectedAreaIds(newIds);
                                                                if (editingItem && editingItem.type === 'user') {
                                                                    setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: newIds.join(',') } });
                                                                }
                                                            }}
                                                        >
                                                            {area.name}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">اسم العامل</label>
                                                    <Input
                                                        className="h-12 rounded-2xl bg-white border-slate-100 focus:border-blue-500 text-sm font-bold"
                                                        value={editingItem.data.name}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الرقم الوظيفي</label>
                                                    <Input
                                                        className="h-12 rounded-2xl bg-white border-slate-100 focus:border-blue-500 text-sm font-bold font-mono"
                                                        value={editingItem.data.id}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, id: e.target.value } })}
                                                        disabled={editingItem.data.id !== 'NEW'}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">الأجر اليومي (د.أ)</label>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        className="h-12 rounded-2xl bg-white border-slate-100 focus:border-blue-500 text-sm font-bold"
                                                        value={editingItem.data.dayValue}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: parseFloat(e.target.value) } })}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">القطاع / الحي</label>
                                                    <Select
                                                        value={editingItem.data.areaId}
                                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } })}
                                                        className="h-12 rounded-2xl bg-white border-slate-100 font-black text-sm"
                                                    >
                                                        <option value="">اختر القطاع</option>
                                                        {areas.map(area => (
                                                            <option key={area.id} value={area.id}>{area.name}</option>
                                                        ))}
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <Button
                                            type="submit"
                                            className={`flex-1 h-14 rounded-2xl font-black text-white shadow-xl group transition-all ${editingItem.type === 'user' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                            disabled={isSaving}
                                        >
                                            {isSaving ? <Loader2 className="h-5 w-5 ml-2 animate-spin" /> : <Save className="h-5 w-5 ml-2 group-hover:scale-110 transition-transform" />}
                                            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            className="h-14 px-8 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all"
                                            onClick={() => setEditingItem(null)}
                                        >
                                            إلغاء
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};
