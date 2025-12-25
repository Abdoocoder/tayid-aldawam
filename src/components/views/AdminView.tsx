"use client";

import React, { useState } from 'react';
import { useAttendance, User, Worker, UserRole } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/ui/button';
import {
    Users,
    HardHat,
    History,
    ShieldCheck,
    Plus,
    Edit2,
    Trash2,
    UserPlus,
    Activity,
    Loader2,
    LayoutDashboard,
    Save,
    Search,
    MapPin,
    Printer,
    Download
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MonthYearPicker } from "../ui/month-year-picker";
import { FileText } from "lucide-react";
import { Select } from "@/components/ui/select";

interface WorkerEditingData extends Partial<Worker> {
    id: string;
    id_entered?: string;
}

export const AdminView = () => {
    const { workers, attendanceRecords, users, auditLogs, areas, isLoading, addWorker, updateWorker, deleteWorker, updateUser, deleteUser, rejectAttendance, getWorkerAttendance } = useAttendance();
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
        <div className="space-y-8 pb-24 animate-in fade-in duration-700">
            {/* Executive Admin Header - Sticky & Rose Glass */}
            <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-rose-600 to-red-600 p-2.5 rounded-2xl text-white shadow-lg shadow-rose-500/20">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">إدارة النظام المركزية</h2>
                                <Badge className="bg-rose-50 text-rose-700 border-rose-100 text-[10px] font-black uppercase tracking-tighter">Root Access</Badge>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تحكم شامل بالمستخدمين والبيانات والسجلات</p>
                        </div>
                    </div>

                    <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner w-full md:w-auto overflow-x-auto no-scrollbar">
                        {[
                            { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
                            { id: 'users', label: 'المستخدمين', icon: Users },
                            { id: 'workers', label: 'العمال', icon: HardHat },
                            { id: 'attendance', label: 'إدارة الحضور', icon: FileText },
                            { id: 'logs', label: 'السجلات', icon: History },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                className={`flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-black transition-all duration-300 whitespace-nowrap ${activeTab === tab.id
                                    ? 'bg-white text-rose-600 shadow-md ring-1 ring-slate-100'
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-white/50'
                                    }`}
                            >
                                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-rose-600' : 'text-slate-400'}`} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'إجمالي العمال', value: workers.length, unit: 'عامل', icon: HardHat, color: 'rose', trend: 'القوى العاملة' },
                            { label: 'المستخدمين النشطين', value: users.length, unit: 'حساب', icon: Users, color: 'blue', trend: 'صلاحيات النظام' },
                            { label: 'سجلات الحضور', value: attendanceRecords.length, unit: 'سجل', icon: FileText, color: 'emerald', trend: 'قاعدة البيانات' },
                            { label: 'إجمالي العمليات', value: auditLogs.length, unit: 'عملية', icon: History, color: 'indigo', trend: 'سجل التدقيق' }
                        ].map((stat, i) => (
                            <div key={i} className="group relative transition-all duration-500 hover:-translate-y-1">
                                <div className="bg-white/60 backdrop-blur-xl p-5 rounded-[2rem] border border-white/40 shadow-xl shadow-slate-200/50 group-hover:shadow-2xl transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl bg-gradient-to-br from-${stat.color}-50 to-${stat.color}-100/50 text-${stat.color}-600 ring-1 ring-${stat.color}-100 shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                            <stat.icon className="h-6 w-6" />
                                        </div>
                                        <div className={`text-[9px] font-black px-2 py-1 rounded-full bg-${stat.color}-50 text-${stat.color}-700 uppercase tracking-tighter shadow-sm`}>
                                            {stat.trend}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-slate-500 text-[11px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                                        <div className="flex items-baseline gap-1.5">
                                            <span className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</span>
                                            <span className="text-xs font-bold text-slate-400 uppercase">{stat.unit}</span>
                                        </div>
                                    </div>
                                    <div className={`absolute -right-4 -bottom-4 w-20 h-20 bg-${stat.color}-50 rounded-full opacity-0 group-hover:opacity-40 transition-opacity duration-700 blur-2xl`}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Users Card */}
                        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-white/60">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">أحدث المستخدمين</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">المسؤولون والمراقبون المضافون</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {users.slice(0, 5).map((u) => (
                                    <div key={u.id} className="flex items-center justify-between p-4 rounded-3xl bg-white/60 hover:bg-white transition-all duration-300 border border-transparent hover:border-slate-100 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-black text-slate-600 group-hover:from-rose-50 group-hover:to-rose-100 group-hover:text-rose-600 transition-all">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 text-sm">{u.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{u.role}</p>
                                            </div>
                                        </div>
                                        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'
                                            }`}>
                                            {u.role}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full mt-6 h-12 rounded-2xl text-rose-600 hover:bg-rose-50 font-black text-xs gap-2 border border-rose-100/30"
                                onClick={() => setActiveTab('users')}
                            >
                                عرض جميع المستخدمين
                                <Activity className="h-3 w-3" />
                            </Button>
                        </div>

                        {/* Recent Activity Card */}
                        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-white/60">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight">آخر التحريرات</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">سجل العمليات الأخيرة في النظام</p>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400">
                                    <History className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {auditLogs.slice(0, 5).map((log) => (
                                    <div key={log.id} className="relative p-4 rounded-3xl bg-white/60 hover:bg-white transition-all duration-300 border-r-4 border-rose-500">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[9px] font-black uppercase">
                                                {log.action}
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-mono font-bold">
                                                {new Date(log.changed_at).toLocaleTimeString('ar-JO')}
                                            </span>
                                        </div>
                                        <p className="text-sm font-black text-slate-800 mb-1">
                                            تعديل في جدول {log.table_name}
                                        </p>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                                            <ShieldCheck className="h-3 w-3" />
                                            بواسطة: {log.changed_by || 'نظام'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full mt-6 h-12 rounded-2xl text-indigo-600 hover:bg-indigo-50 font-black text-xs gap-2 border border-indigo-100/30"
                                onClick={() => setActiveTab('logs')}
                            >
                                عرض السجل الكامل
                                <History className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Search Center - Floating Glassmorph */}
            {(activeTab === 'users' || activeTab === 'workers') && (
                <div className="relative group max-w-2xl mx-auto w-full px-1 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <Search className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-rose-600 transition-colors" />
                    <Input
                        placeholder="ابحث بالاسم، الرقم الوظيفي، أو القطاع..."
                        className="pr-14 h-14 bg-white/60 backdrop-blur-md border border-white/40 focus:border-rose-500 rounded-[2rem] shadow-xl shadow-slate-200/50 text-lg transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {activeTab === 'users' && (
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 border-b border-white/40 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-rose-50/50 to-transparent">
                        <div className="flex items-center gap-5">
                            <div className="bg-rose-100 p-4 rounded-[1.5rem] text-rose-600 shadow-inner">
                                <UserPlus className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">إدارة المستخدمين</h3>
                                <p className="text-xs text-slate-500 font-bold">إضافة وتعديل صلاحيات الوصول والمراقبين</p>
                            </div>
                        </div>
                        <Button
                            className="bg-rose-600 hover:bg-rose-700 text-white shadow-xl shadow-rose-200 h-12 px-8 rounded-2xl font-black text-sm gap-3 group transition-all"
                            onClick={() => setEditingItem({ type: 'user', data: { id: 'NEW', name: '', username: '', role: 'SUPERVISOR', areaId: '' } })}
                        >
                            <UserPlus className="h-5 w-5 group-hover:scale-110 transition-transform" />
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
                                        <tr key={u.id} className="hover:bg-rose-50/20 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-rose-100 group-hover:text-rose-600 transition-colors">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 group-hover:text-rose-700 transition-colors text-sm">{u.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold font-mono uppercase">{u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-tighter ring-1 ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-700 ring-rose-100 border-rose-200' : 'bg-slate-50 text-slate-600 ring-slate-100'
                                                    }`}>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                                                    <MapPin className="h-3 w-3 text-slate-300" />
                                                    {areaName}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${u.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                                                    {u.isActive ? 'نشط' : 'معطل'}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
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
                                                        className={`h-9 w-9 rounded-xl transition-all ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'
                                                            }`}
                                                        onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 border-b border-white/40 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-blue-50/50 to-transparent">
                        <div className="flex items-center gap-5">
                            <div className="bg-blue-100 p-4 rounded-[1.5rem] text-blue-600 shadow-inner">
                                <HardHat className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">إدارة الكوادر العمالية</h3>
                                <p className="text-xs text-slate-500 font-bold">قائمة شاملة بجميع العمال والقطاعات المسجلة</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs gap-2"
                                onClick={() => window.print()}
                            >
                                <Printer className="h-4 w-4" />
                                نسخة ورقية
                            </Button>
                            <Button
                                className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 h-12 px-8 rounded-2xl font-black text-sm gap-3 group transition-all"
                                onClick={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}
                            >
                                <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
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
                                        <tr key={w.id} className="hover:bg-blue-50/20 transition-all group">
                                            <td className="px-8 py-5">
                                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg font-mono text-[10px] font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    #{w.id}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="font-black text-slate-900 group-hover:text-blue-700 transition-colors text-sm">{w.name}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-100 font-bold text-[10px]">
                                                    <MapPin className="h-3 w-3 ml-1 text-blue-400" />
                                                    {areaName}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="text-sm font-black text-slate-900">{w.dayValue} <span className="text-[10px] text-slate-400">د.أ</span></div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                                        onClick={() => setEditingItem({ type: 'worker', data: w })}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
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
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 border-b border-white/40 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gradient-to-r from-emerald-50/50 to-transparent">
                        <div className="flex items-center gap-5">
                            <div className="bg-emerald-100 p-4 rounded-[1.5rem] text-emerald-600 shadow-inner">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">إدارة السجلات المركزية</h3>
                                <p className="text-xs text-slate-500 font-bold">مراجعة واعتماد كشوف الحضور لجميع القطاعات</p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                            <div className="relative w-full sm:w-64 group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                                <Input
                                    placeholder="بحث باسم العامل..."
                                    className="pr-12 h-11 bg-white/60 border-white/40 rounded-xl shadow-sm text-sm"
                                    value={attendanceSearchTerm}
                                    onChange={e => setAttendanceSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="bg-white/60 p-1.5 rounded-xl border border-white/40 shadow-sm">
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
                                        <tr key={worker.id} className="hover:bg-emerald-50/20 transition-all group">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                                                        {worker.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900 group-hover:text-emerald-700 transition-colors text-sm">{worker.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold font-mono">#{worker.id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-100 font-bold text-[10px]">
                                                    <MapPin className="h-3 w-3 ml-1 text-emerald-400" />
                                                    {areaName}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="text-sm font-black text-slate-900">{record ? record.normalDays : '-'}</div>
                                            </td>
                                            <td className="px-8 py-5">
                                                {record ? (
                                                    <div className="flex flex-wrap gap-1 justify-center">
                                                        <span className="text-[9px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full border border-amber-100">ع {record.overtimeNormalDays}</span>
                                                        <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">ط {record.overtimeHolidayDays}</span>
                                                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">أ {record.overtimeEidDays || 0}</span>
                                                    </div>
                                                ) : <div className="text-center text-slate-300">-</div>}
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                {record ? (
                                                    <Badge className={`rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-sm ring-1 ${record.status === 'APPROVED' ? "bg-emerald-600 text-white ring-emerald-500" : "bg-slate-100 text-slate-600 ring-slate-200"
                                                        }`}>
                                                        {record.status === 'APPROVED' ? 'معتمد نهائياً' :
                                                            record.status === 'PENDING_FINANCE' ? 'بانتظار الرواتب' :
                                                                record.status === 'PENDING_HR' ? 'بانتظار الموارد' :
                                                                    record.status === 'PENDING_GS' ? 'بانتظار المراقب العام' :
                                                                        record.status === 'PENDING_SUPERVISOR' ? 'معاد للتصحيح' : 'غير معروف'}
                                                    </Badge>
                                                ) : <span className="text-slate-300 font-mono text-[10px]">NO_DATA</span>}
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex justify-center">
                                                    {record && record.status === 'APPROVED' && (
                                                        <Button
                                                            variant="destructive"
                                                            className="text-[10px] h-8 px-4 rounded-xl font-black bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white border border-rose-100 transition-all shadow-sm"
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
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 shadow-2xl shadow-slate-200/50 overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
                    <div className="p-8 border-b border-white/40 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gradient-to-r from-indigo-50/50 to-transparent">
                        <div className="flex items-center gap-5">
                            <div className="bg-indigo-100 p-4 rounded-[1.5rem] text-indigo-600 shadow-inner">
                                <History className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 tracking-tight">سجل الرقابة الكامل</h3>
                                <p className="text-xs text-slate-500 font-bold">تتبع كل عملية تغيير أو حذف في النظام بدقة</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="relative flex-1 min-w-[150px]">
                                <Search className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="بحث بالمستخدم..."
                                    className="pr-8 h-8 text-xs"
                                    value={logSearchTerm}
                                    onChange={e => setLogSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select
                                value={logTableFilter}
                                onChange={e => setLogTableFilter(e.target.value)}
                                className="w-[140px] h-11 bg-white/60 border-white/40 rounded-xl font-black text-xs"
                            >
                                <option value="ALL">جميع الجداول</option>
                                <option value="workers">العمال (Workers)</option>
                                <option value="users">المستخدمين (Users)</option>
                                <option value="attendance">الحضور (Attendance)</option>
                                <option value="areas">القطاعات (Areas)</option>
                            </Select>
                            <Select
                                value={logActionFilter}
                                onChange={e => setLogActionFilter(e.target.value)}
                                className="w-[140px] h-11 bg-white/60 border-white/40 rounded-xl font-black text-xs"
                            >
                                <option value="ALL">جميع العمليات</option>
                                <option value="INSERT">إضافة (+)</option>
                                <option value="UPDATE">تعديل (∆)</option>
                                <option value="DELETE">حذف (×)</option>
                            </Select>
                            <Button
                                variant="outline"
                                className="h-11 px-6 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs gap-2"
                                onClick={() => {
                                    const csvRows = [
                                        ['العملية', 'الجدول', 'التاريخ', 'بواسطة', 'البيانات القديمة', 'البيانات الجديدة'],
                                        ...filteredLogs.map(log => [
                                            log.action,
                                            log.table_name,
                                            new Date(log.changed_at).toLocaleString('ar-JO'),
                                            log.changed_by || 'نظام',
                                            JSON.stringify(log.old_data),
                                            JSON.stringify(log.new_data)
                                        ])
                                    ];
                                    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(e => e.join(",")).join("\n");
                                    const encodedUri = encodeURI(csvContent);
                                    const link = document.createElement("a");
                                    link.setAttribute("href", encodedUri);
                                    link.setAttribute("download", `audit_logs_${new Date().toISOString()}.csv`);
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }}
                            >
                                <Download className="h-4 w-4" />
                                تصدير للسجل
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100/50">
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">النوع</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الجدول المتأثر</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التغييرات الجوهرية</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التوقيت</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredLogs.length > 0 ? (
                                    filteredLogs.slice(0, 100).map((log) => (
                                        <tr key={log.id} className="hover:bg-indigo-50/20 transition-all group">
                                            <td className="px-8 py-5 text-center">
                                                <Badge
                                                    className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm ${log.action === 'INSERT' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                                                        log.action === 'UPDATE' ? 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-100' :
                                                            'bg-rose-50 text-rose-700 ring-1 ring-rose-100'
                                                        }`}
                                                >
                                                    {log.action}
                                                </Badge>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                                                    <Activity className="h-3.5 w-3.5 text-slate-400" />
                                                    {log.table_name}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="max-w-xs overflow-hidden">
                                                    <div className="text-[10px] font-mono font-bold text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl group-hover:bg-white transition-colors">
                                                        {JSON.stringify(log.new_data || log.old_data)}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-[10px]">
                                                        {(log.changed_by || 'A').charAt(0)}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-600">{log.changed_by || 'نظام الرقابة'}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="text-[10px] font-bold text-slate-400 font-mono">
                                                    {new Date(log.changed_at).toLocaleString('ar-JO')}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="py-[15%] text-center text-slate-400 font-black italic text-lg opacity-20">
                                            سجل النشاطات فارغ حالياً
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* Printable Area - Hidden by default */}
            <div className="hidden print:block print:m-0 print:p-0">
                <div className="text-center mb-6 border-b-2 pb-4">
                    <h1 className="text-2xl font-bold mb-1">قائمة بيانات العمال والأسعار</h1>
                    <p className="text-gray-600">
                        التاريخ: {new Date().toLocaleDateString('ar-JO')} | القطاع: جميع العمال
                    </p>
                    <p className="text-sm mt-1 text-red-600 font-bold uppercase">لوحة إدارة النظام</p>
                </div>

                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right">الرقم</th>
                            <th className="border border-gray-300 p-2 text-right">الاسم</th>
                            <th className="border border-gray-300 p-2 text-right">المنطقة</th>
                            <th className="border border-gray-300 p-2 text-center">أجر اليوم (د.أ)</th>
                            <th className="border border-gray-300 p-2 text-center">الراتب الأساسي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers.map(w => {
                            const areaName = areas.find(a => a.id === w.areaId)?.name || w.areaId;
                            return (
                                <tr key={w.id}>
                                    <td className="border border-gray-300 p-2 font-mono">{w.id}</td>
                                    <td className="border border-gray-300 p-2 font-bold">{w.name}</td>
                                    <td className="border border-gray-300 p-2">{areaName}</td>
                                    <td className="border border-gray-300 p-2 text-center">{w.dayValue}</td>
                                    <td className="border border-gray-300 p-2 text-center">{w.baseSalary}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                <div className="mt-8 text-center no-print">
                    <div className="border-t border-black pt-2 font-bold inline-block px-12">اعتماد الإدارة العليا</div>
                </div>

                <div className="mt-12 text-[10px] text-gray-400 text-center">
                    تم استخراج هذه القائمة بتاريخ {new Date().toLocaleDateString('ar-JO')}
                </div>
            </div>

            {/* Editing Modals / Forms */}
            {editingItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setEditingItem(null)} />
                    <div className="relative w-full max-w-xl bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/50 overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className={`h-2 w-full ${editingItem.type === 'user' ? 'bg-rose-500' : 'bg-blue-500'}`} />
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
                                                        ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-200'
                                                        : 'bg-white text-slate-500 border-slate-100 hover:border-rose-200'
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
                                                            ? 'bg-rose-50 text-white border-rose-500 shadow-md'
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
                                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: newIds.join(',') } });
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
                                        className={`flex-1 h-14 rounded-2xl font-black text-white shadow-xl group transition-all ${editingItem.type === 'user' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
                                            }`}
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
    );
};
