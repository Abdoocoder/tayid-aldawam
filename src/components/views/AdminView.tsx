"use client";

import React, { useState, useEffect } from 'react';
import { useAttendance, User, UserRole } from '@/context/AttendanceContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Button } from '../ui/button';
import {
    Users,
    History,
    Loader2,
    Save,
    Menu,
    Shield
} from 'lucide-react';
import { Badge } from '../ui/badge';

// Sub Components
import { UsersTab } from './admin/UsersTab';

import { Input } from '../ui/input';
import { Search } from "lucide-react";
import { MobileNav, NavItem } from "../ui/mobile-nav";

export const AdminView = () => {
    const { workers, attendanceRecords, users, auditLogs, areas, isLoading, updateUser, deleteUser } = useAttendance();
    const { appUser } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'logs'>('overview');

    // Management states
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<{ type: 'user', data: User | (Partial<User> & { id: 'NEW' }) } | null>(null);
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


    const navItems: NavItem<'overview' | 'users' | 'logs'>[] = [
        { id: 'overview', label: 'نظرة عامة', icon: Users },
        { id: 'users', label: 'المستخدمين', icon: Users },
        { id: 'logs', label: 'السجلات', icon: History },
    ];

    if (isLoading) {
        return <div className="flex justify-center p-20">جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <>
            <MobileNav<'overview' | 'users' | 'logs'>
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={{ name: appUser?.name || "مدير النظام", role: "الإدارة التقنية (IT Admin)" }}
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
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">إدارة النظام</h2>
                                    <div className="flex items-center bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full scale-90">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse mr-1.5" />
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">Technical Admin</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1.5">System Maintenance & User Access</p>
                            </div>
                        </div>

                        {/* Navigation Tabs - Desktop */}
                        <div className="hidden md:flex bg-slate-100/40 p-1.5 rounded-[1.5rem] border border-slate-200/40 backdrop-blur-md shadow-inner">
                            {navItems.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'overview' | 'users' | 'logs')}
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
                                                        {{
                                                            'SUPERVISOR': 'مراقب ميداني',
                                                            'GENERAL_SUPERVISOR': 'مراقب عام',
                                                            'HEALTH_DIRECTOR': 'مدير صحة',
                                                            'HR': 'موارد بشرية',
                                                            'INTERNAL_AUDIT': 'رقابة داخلية',
                                                            'FINANCE': 'مالية',
                                                            'PAYROLL': 'رواتب',
                                                            'MAYOR': 'رئيس بلدية',
                                                            'ADMIN': 'مدير نظام'
                                                        }[u.role] || u.role}
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

                </div>
            </div>

            {/* User Modal - Modern & Responsive */}
            {(editingItem?.type === 'user' && editingItem.data) && (
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
                                        <option value="HR">مدير الموارد البشرية</option>
                                        <option value="INTERNAL_AUDIT">مدقق داخلي</option>
                                        <option value="FINANCE">المدير المالي</option>
                                        <option value="PAYROLL">قسم الرواتب</option>
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
            )}
        </>
    );
};
