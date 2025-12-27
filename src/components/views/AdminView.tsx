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
    ShieldCheck,
    Loader2,
    Save,
    Activity
} from 'lucide-react';
import { Badge } from '../ui/badge';

// Sub Components
import { UsersTab } from './admin/UsersTab';
import { WorkersTab } from './admin/WorkersTab';
import { LogsTab } from './admin/LogsTab';

import { Input } from '../ui/input';
import { MonthYearPicker } from "../ui/month-year-picker";
import { Search, MapPin } from "lucide-react";

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


    if (isLoading) {
        return <div className="flex justify-center p-20">جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <>
            <div className="space-y-8 pb-24 animate-in fade-in duration-700 print:hidden">
                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500 print:hidden">
                    <div className="max-w-7xl mx-auto flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-2.5 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-black text-slate-900 tracking-tight">الإدارة المركزية</h2>
                                        <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100/50 text-[10px] font-black uppercase tracking-widest px-2 py-0">Root</Badge>
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">System Governance & Control</p>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Tabs - Scrollable on mobile */}
                        <div className="flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm overflow-x-auto no-scrollbar">
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
                                    className={`flex-1 px-3 py-2 rounded-xl text-[11px] md:text-xs font-black transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap min-w-fit ${activeTab === tab.id
                                        ? 'bg-white text-indigo-700 shadow-md shadow-indigo-900/5'
                                        : 'text-slate-500 hover:text-slate-900 hover:bg-white/50'
                                        }`}
                                >
                                    <tab.icon className={`h-3.5 w-3.5 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                                    <span className="inline">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content based on active tab */}
                <div className="animate-in fade-in zoom-in-95 duration-500 delay-200 print:hidden">
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            {/* Stats Grid - Responsive & Premium */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                {[
                                    { label: 'إجمالي العمال', value: workers.length, unit: 'عامل', icon: HardHat, color: 'indigo', gradient: 'from-indigo-50 to-indigo-100/30', text: 'indigo', border: 'indigo' },
                                    { label: 'المستخدمين', value: users.length, unit: 'حساب', icon: Users, color: 'violet', gradient: 'from-violet-50 to-violet-100/30', text: 'violet', border: 'violet' },
                                    { label: 'سجلات الحضور', value: attendanceRecords.length, unit: 'سجل', icon: FileText, color: 'blue', gradient: 'from-blue-50 to-blue-100/30', text: 'blue', border: 'blue' },
                                    { label: 'العمليات', value: auditLogs.length, unit: 'عملية', icon: History, color: 'slate', gradient: 'from-slate-50 to-slate-100/30', text: 'slate', border: 'slate' }
                                ].map((stat, i) => (
                                    <div key={i} className={`border-none shadow-sm bg-gradient-to-br ${stat.gradient} ring-1 ring-${stat.border}-100 rounded-2xl overflow-hidden group p-4 flex flex-col items-center text-center gap-2`}>
                                        <div className={`bg-white p-2.5 rounded-xl text-${stat.text}-600 shadow-sm border border-${stat.border}-50 group-hover:scale-110 transition-transform`}>
                                            <stat.icon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className={`text-[10px] text-${stat.text}-600 font-black uppercase tracking-tight`}>{stat.label}</p>
                                            <p className={`text-2xl font-black text-${stat.text}-900 leading-tight`}>{stat.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Recent Users Card */}
                                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/60 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">أحدث المستخدمين</h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-xs"
                                            onClick={() => setActiveTab('users')}
                                        >
                                            عرض الكل
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {users.slice(0, 5).map((u) => (
                                            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-white/50 hover:bg-white transition-all duration-300 border border-transparent hover:border-slate-100 group shadow-sm hover:shadow-md">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200/50 flex items-center justify-center font-black text-slate-600 group-hover:from-indigo-50 group-hover:to-indigo-100 group-hover:text-indigo-600 transition-all">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 text-xs">{u.name}</p>
                                                        <p className="text-[9px] text-slate-400 font-black uppercase">{u.role}</p>
                                                    </div>
                                                </div>
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-500 text-[9px]">
                                                    {u.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Recent Activity Card */}
                                <div className="bg-white/60 backdrop-blur-xl rounded-2xl p-5 border border-white/60 shadow-sm">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-lg font-black text-slate-900 tracking-tight">آخر التحريرات</h3>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 rounded-lg text-indigo-600 hover:bg-indigo-50 font-bold text-xs"
                                            onClick={() => setActiveTab('logs')}
                                        >
                                            السجل الكامل
                                        </Button>
                                    </div>
                                    <div className="space-y-3">
                                        {auditLogs.slice(0, 5).map((log) => (
                                            <div key={log.id} className="relative p-3 rounded-xl bg-white/50 hover:bg-white transition-all duration-300 border-r-2 border-indigo-500 shadow-sm hover:shadow-md">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-wider">
                                                        {log.action}
                                                    </span>
                                                    <span className="text-[9px] text-slate-400 font-bold font-mono">
                                                        {new Date(log.changed_at).toLocaleTimeString('ar-JO')}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-700">
                                                    تعديل في {log.table_name}
                                                </p>
                                            </div>
                                        ))}
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
            </div>

            {/* Modals - Kept in parent to share state easily for now, or could be extracted too */}
            {(editingItem?.type === 'worker') && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] w-full max-w-lg shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900">
                                {editingItem.data.id === 'NEW' ? 'إضافة عامل جديد' : 'تعديل بيانات عامل'}
                            </h3>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setEditingItem(null)}>✕</Button>
                        </div>
                        <form onSubmit={handleSaveWorker} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">الرقم الوظيفي</label>
                                <Input
                                    required
                                    disabled={editingItem.data.id !== 'NEW'}
                                    value={editingItem.data.id === 'NEW' ? editingItem.data.id_entered || '' : editingItem.data.id}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, id_entered: e.target.value } })}
                                    className="font-mono text-left"
                                    placeholder="مثال: 1024"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">الاسم الكامل</label>
                                <Input
                                    required
                                    value={editingItem.data.name}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">القطاع / الحي</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-sm font-bold text-right"
                                    value={editingItem.data.areaId}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } })}
                                >
                                    <option value="">اختر القطاع...</option>
                                    {areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">قيمة اليوم (دينار)</label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    min="0"
                                    required
                                    value={editingItem.data.dayValue}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: parseFloat(e.target.value) } })}
                                    className="text-left font-mono"
                                />
                            </div>
                            <div className="pt-4 flex gap-3">
                                <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-bold">
                                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="ml-2 h-4 w-4" /> حفظ البيانات</>}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-12 rounded-xl font-bold">إلغاء</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {(editingItem?.type === 'user') && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] w-full max-w-lg shadow-2xl border border-white/50 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-xl font-black text-slate-900">
                                {editingItem.data.id === 'NEW' ? 'إضافة مستخدم جديد' : 'تعديل بيانات مستخدم'}
                            </h3>
                            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setEditingItem(null)}>✕</Button>
                        </div>
                        <form onSubmit={handleSaveUser} className="p-6 space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">اسم المستخدم (للدخول)</label>
                                <Input
                                    required
                                    disabled={editingItem.data.id !== 'NEW'}
                                    value={editingItem.data.username}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, username: e.target.value } })}
                                    className="font-mono text-left"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">الاسم الظاهر</label>
                                <Input
                                    required
                                    value={editingItem.data.name}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                    className="text-right"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">الدور الوظيفي</label>
                                <select
                                    className="w-full h-10 rounded-xl border border-slate-200 px-3 bg-white text-sm font-bold text-right"
                                    value={editingItem.data.role}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value as UserRole } })}
                                >
                                    <option value="SUPERVISOR">مراقب ميداني</option>
                                    <option value="GENERAL_SUPERVISOR">مراقب عام</option>
                                    <option value="HEALTH_DIRECTOR">مدير صحة وبيئة</option>
                                    <option value="HR">موارد بشرية</option>
                                    <option value="FINANCE">مالية</option>
                                    <option value="ADMIN">مدير نظام</option>
                                    <option value="MAYOR">رئيس البلدية</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-600">النطاق الإشرافي</label>
                                <div className="border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto bg-white/50">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
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
                                                className="rounded border-slate-300"
                                            />
                                            <span className="text-xs font-bold text-indigo-600">تحديد الكل</span>
                                        </label>
                                        {areas.map(area => (
                                            <label key={area.id} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-slate-50 rounded">
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
                                                    className="rounded border-slate-300"
                                                />
                                                <span className="text-xs font-medium">{area.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">يمكن اختيار أكثر من منطقة للمراقبين</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button type="submit" disabled={isSaving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white h-12 rounded-xl font-bold">
                                    {isSaving ? <Loader2 className="animate-spin" /> : <><Save className="ml-2 h-4 w-4" /> حفظ البيانات</>}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)} className="h-12 rounded-xl font-bold">إلغاء</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};
