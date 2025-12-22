"use client";

import React, { useState } from 'react';
import { useAttendance, User, Worker, UserRole } from '@/context/AttendanceContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    HardHat,
    History,
    Settings,
    ShieldCheck,
    TrendingUp,
    AlertTriangle,
    Plus,
    Edit2,
    Trash2,
    UserPlus,
    Activity,
    X,
    Loader2,
    LayoutDashboard,
    Save,
    Search,
    MapPin
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const AdminView = () => {
    const { workers, attendanceRecords, users, auditLogs, areas, isLoading, addWorker, updateWorker, deleteWorker, updateUser } = useAttendance();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workers' | 'logs'>('overview');

    // Management states
    const [searchTerm, setSearchTerm] = useState("");
    const [areaFilter, setAreaFilter] = useState("ALL");
    const [editingItem, setEditingItem] = useState<{ type: 'worker', data: Worker | (Partial<Worker> & { id: 'NEW' }) } | { type: 'user', data: User | (Partial<User> & { id: 'NEW' }) } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);

    const handleSaveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'worker') return;
        setIsSaving(true);
        try {
            if (editingItem.data.id !== 'NEW') {
                await updateWorker(editingItem.data.id, editingItem.data as Partial<Worker>);
            } else {
                // For NEW worker, editingItem.data is Partial<Worker> & { id: 'NEW' }
                // addWorker takes Omit<Worker, "id">
                const { id, ...workerWithoutId } = editingItem.data;
                await addWorker(workerWithoutId as Omit<Worker, "id">);
            }
            setEditingItem(null);
        } catch (err) {
            console.error(err);
            alert('فشل حفظ البيانات');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'user') return;
        setIsSaving(true);
        try {
            if (editingItem.data.id !== 'NEW') {
                await updateUser(editingItem.data.id, editingItem.data as Partial<User>);
            }
            setEditingItem(null);
        } catch (err) {
            console.error(err);
            alert('فشل حفظ البيانات');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorker = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا العامل؟')) return;
        try {
            await deleteWorker(id);
        } catch (err) {
            console.error(err);
            alert('فشل حذف العامل');
        }
    };

    const stats = [
        { title: 'إجمالي العمال', value: workers.length, icon: HardHat, color: 'text-blue-600', bg: 'bg-blue-100' },
        { title: 'المستخدمين النشطين', value: users.length, icon: Users, color: 'text-purple-600', bg: 'bg-purple-100' },
        { title: 'سجلات الحضور', value: attendanceRecords.length, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
        { title: 'العمليات الأخيرة', value: auditLogs.length, icon: History, color: 'text-orange-600', bg: 'bg-orange-100' },
    ];

    if (isLoading) {
        return <div className="flex justify-center p-20">جاري تحميل لوحة التحكم...</div>;
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header section with tabs */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-red-600 p-3 rounded-xl text-white shadow-lg shadow-red-100">
                        <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">لوحة تحكم مدير النظام</h2>
                        <p className="text-gray-500 text-sm font-medium">إدارة المستخدمين والعمال والإعدادات العامة</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full lg:w-auto overflow-x-auto">
                    {[
                        { id: 'overview', label: 'نظرة عامة', icon: LayoutDashboard },
                        { id: 'users', label: 'المستخدمين', icon: Users },
                        { id: 'workers', label: 'العمال', icon: HardHat },
                        { id: 'logs', label: 'السجلات', icon: History },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-red-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editing/Adding Form Overlay */}
            {editingItem && (activeTab === 'users' || activeTab === 'workers') && (
                <Card className="border-2 border-blue-200 shadow-xl animate-in zoom-in-95 duration-200">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>{editingItem.data.id === 'NEW' ? 'إضافة جديد' : 'تعديل البيانات'}</CardTitle>
                            <CardDescription>أدخل البيانات المطلوبة واضغط حفظ</CardDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setEditingItem(null)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={editingItem.type === 'worker' ? handleSaveWorker : handleSaveUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">الاسم</label>
                                <Input
                                    className="bg-gray-50/50 border-gray-200"
                                    value={editingItem.data.name}
                                    onChange={e => {
                                        if (editingItem.type === 'worker') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } });
                                        } else if (editingItem.type === 'user') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } });
                                        }
                                    }}
                                    required
                                />
                            </div>

                            {/* Conditional Area Selection for Workers */}
                            {editingItem.type === 'worker' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">المنطقة / القطاع</label>
                                    <select
                                        className="w-full p-2 border rounded-md text-sm bg-gray-50/50 border-gray-200"
                                        value={editingItem.data.areaId || ''}
                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } })}
                                        required
                                    >
                                        <option value="">اختر المنطقة...</option>
                                        {areas.map(a => (
                                            <option key={a.id} value={a.id}>{a.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Global Role Selection for Users */}
                            {editingItem.type === 'user' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">الدور</label>
                                    <select
                                        className="w-full p-2 border rounded-md text-sm bg-gray-50/50 border-gray-200"
                                        value={(editingItem.data as any).role || 'SUPERVISOR'}
                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value as UserRole } })}
                                    >
                                        <option value="SUPERVISOR">SUPERVISOR</option>
                                        <option value="HR">HR</option>
                                        <option value="FINANCE">FINANCE</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                            )}
                            {editingItem.type === 'worker' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الأجر اليومي (د.ل)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="bg-gray-50/50 border-gray-200"
                                            value={(editingItem.data as Worker).dayValue || 0}
                                            onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: parseFloat(e.target.value) } })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الراتب الأساسي</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            className="bg-gray-50/50 border-gray-200"
                                            value={(editingItem.data as Worker).baseSalary || 0}
                                            onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, baseSalary: parseFloat(e.target.value) } })}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            {/* Multi-Area Selection for Supervisors */}
                            {editingItem.type === 'user' && (editingItem.data as User).role === 'SUPERVISOR' && (
                                <div className="col-span-full border-t border-gray-100 mt-4 pt-4">
                                    <label className="text-xs font-bold text-gray-700 block mb-2">تحديد مناطق الإشراف (للمراقبين فقط)</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-3 bg-gray-50 rounded-xl border border-gray-200">
                                        {areas.map(area => (
                                            <label key={area.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500"
                                                    checked={selectedAreaIds.includes(area.id)}
                                                    onChange={(e) => {
                                                        const newIds = e.target.checked
                                                            ? [...selectedAreaIds, area.id]
                                                            : selectedAreaIds.filter(id => id !== area.id);
                                                        setSelectedAreaIds(newIds);
                                                        setEditingItem({
                                                            ...editingItem,
                                                            data: { ...editingItem.data, areaId: newIds.join(',') }
                                                        });
                                                    }}
                                                />
                                                <span className="text-xs font-medium text-gray-700">{area.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="col-span-full flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 font-sans" dir="rtl">
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>إلغاء</Button>
                                <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                                    حفظ التغييرات
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Content based on active tab */}
            {activeTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-none shadow-sm bg-blue-50/50 overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-blue-900">
                                <HardHat className="h-24 w-24" />
                            </div>
                            <CardContent className="p-5 flex items-center gap-4 relative z-10">
                                <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600 shadow-sm">
                                    <Users className="h-5 w-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-blue-600 font-bold mb-0.5">إجمالي العمال</p>
                                    <p className="text-2xl font-black text-blue-900">{workers.length}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-purple-50/50 overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-purple-900">
                                <Users className="h-24 w-24" />
                            </div>
                            <CardContent className="p-5 flex items-center gap-4 relative z-10">
                                <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600 shadow-sm">
                                    <ShieldCheck className="h-5 w-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-purple-600 font-bold mb-0.5">المستخدمين النشطين</p>
                                    <p className="text-2xl font-black text-purple-900">{users.length}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-green-50/50 overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-green-900">
                                <Activity className="h-24 w-24" />
                            </div>
                            <CardContent className="p-5 flex items-center gap-4 relative z-10">
                                <div className="bg-green-100 p-2.5 rounded-xl text-green-600 shadow-sm">
                                    <Activity className="h-5 w-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-green-600 font-bold mb-0.5">سجلات الحضور</p>
                                    <p className="text-2xl font-black text-green-900">{attendanceRecords.length}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-sm bg-orange-50/50 overflow-hidden relative">
                            <div className="absolute -right-4 -bottom-4 opacity-10 text-orange-900">
                                <History className="h-24 w-24" />
                            </div>
                            <CardContent className="p-5 flex items-center gap-4 relative z-10">
                                <div className="bg-orange-100 p-2.5 rounded-xl text-orange-600 shadow-sm">
                                    <History className="h-5 w-5" />
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-orange-600 font-bold mb-0.5">العمليات الأخيرة</p>
                                    <p className="text-2xl font-black text-orange-900">{auditLogs.length}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Recent Users */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">أحدث المستخدمين</CardTitle>
                                    <CardDescription>المسؤولون والمراقبون المضافون مؤخراً</CardDescription>
                                </div>
                                <Users className="h-5 w-5 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {users.slice(0, 5).map((u) => (
                                        <div key={u.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-gray-100 p-2 rounded-full font-bold text-gray-600">
                                                    {u.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-sm">{u.name}</p>
                                                    <p className="text-xs text-gray-500">{u.role}</p>
                                                </div>
                                            </div>
                                            <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                                                {u.role}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="ghost" className="w-full mt-4 text-sm text-blue-600" onClick={() => setActiveTab('users')}>
                                    عرض جميع المستخدمين
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">آخر التحريرات</CardTitle>
                                    <CardDescription>سجل العمليات الأخيرة في النظام</CardDescription>
                                </div>
                                <History className="h-5 w-5 text-gray-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {auditLogs.slice(0, 5).map((log) => (
                                        <div key={log.id} className="flex items-start gap-3 p-3 border-r-2 border-blue-500 bg-blue-50/30 rounded-l-lg">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Badge className="text-[10px] py-0">{log.action}</Badge>
                                                    <span className="text-xs text-gray-400">{new Date(log.changed_at).toLocaleString('ar-EG')}</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">
                                                    تعديل في جدول {log.table_name}
                                                </p>
                                                <p className="text-xs text-gray-500">بواسطة: {log.changed_by || 'نظام'}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button variant="ghost" className="w-full mt-4 text-sm text-blue-600" onClick={() => setActiveTab('logs')}>
                                    عرض السجل الكامل
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}

            {/* Search Bar (Visible in Users and Workers) */}
            {(activeTab === 'users' || activeTab === 'workers') && (
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="بحث عن طريق الاسم أو اسم المستخدم..."
                            className="pr-10 bg-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            )}

            {activeTab === 'users' && (
                <Card className="border-none shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <CardTitle className="text-lg font-bold">إدارة المستخدمين</CardTitle>
                            <CardDescription>إضافة وتعديل صلاحيات المستخدمين في النظام</CardDescription>
                        </div>
                        <Button className="bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100" onClick={() => setEditingItem({ type: 'user', data: { id: 'NEW', name: '', username: '', role: 'SUPERVISOR', areaId: '' } })}>
                            <UserPlus className="h-4 w-4 ml-2" />
                            مستخدم جديد
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-4 border-b">الاسم</th>
                                    <th className="p-4 border-b">اسم المستخدم</th>
                                    <th className="p-4 border-b">الدور</th>
                                    <th className="p-4 border-b">المنطقة</th>
                                    <th className="p-4 border-b text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {users.filter(u =>
                                    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    u.username.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map((u) => {
                                    const areaName = u.areaId === 'ALL' ? 'كل المناطق' : (areas.find(a => a.id === u.areaId)?.name || "غير محدد");
                                    return (
                                        <tr key={u.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 group-hover:text-red-600 transition-colors">{u.name}</div>
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">{u.username}</td>
                                            <td className="p-4">
                                                <Badge variant={u.role === 'ADMIN' ? 'default' : 'outline'} className={u.role === 'ADMIN' ? "bg-red-600" : ""}>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-gray-500">
                                                <div className="flex items-center gap-1.5">
                                                    <MapPin className="h-3 w-3 text-gray-300" />
                                                    {areaName}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => {
                                                        setEditingItem({ type: 'user', data: u });
                                                        setSelectedAreaIds(u.areaId ? u.areaId.split(',') : []);
                                                    }}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'workers' && (
                <Card className="border-none shadow-sm overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <CardTitle className="text-lg font-bold">إدارة العمال</CardTitle>
                            <CardDescription>قائمة بجميع العمال المسجلين في النظام عبر كافة القطاعات</CardDescription>
                        </div>
                        <Button className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100" onClick={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة عامل
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-4 border-b">ID</th>
                                    <th className="p-4 border-b">الاسم</th>
                                    <th className="p-4 border-b">القطاع</th>
                                    <th className="p-4 border-b">قيمة اليوم</th>
                                    <th className="p-4 border-b text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {workers.filter(w => {
                                    const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                                    return w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                        areaName.toLowerCase().includes(searchTerm.toLowerCase());
                                }).map((w) => {
                                    const areaName = areas.find(a => a.id === w.areaId)?.name || "غير محدد";
                                    return (
                                        <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-4 text-xs text-gray-400 font-mono">#{w.id}</td>
                                            <td className="p-4">
                                                <div className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{w.name}</div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                                    <MapPin className="h-3 w-3 ml-1" />
                                                    {areaName}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm font-black text-gray-700 text-center">{w.dayValue} د.ل</td>
                                            <td className="p-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => setEditingItem({ type: 'worker', data: w })}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleDeleteWorker(w.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'logs' && (
                <Card className="animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader>
                        <CardTitle>سجل النشاطات الكامل</CardTitle>
                        <CardDescription>تتبع جميع التغييرات التي تمت على البيانات في النظام</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {auditLogs.map((log) => (
                                <div key={log.id} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${log.action === 'INSERT' ? 'bg-green-100 text-green-600' :
                                                log.action === 'UPDATE' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                <Activity className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {log.action === 'INSERT' ? 'إضافة سجل جديد' :
                                                        log.action === 'UPDATE' ? 'تحديث سجل' : 'حذف سجل'}
                                                </p>
                                                <p className="text-xs text-gray-500">في جدول {log.table_name} • معرف السجل: {log.record_id}</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-medium text-gray-700">{log.changed_by || 'نظام آلي'}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(log.changed_at).toLocaleString('ar-EG')}</span>
                                        </div>
                                    </div>

                                    {/* Data Diff (Optional preview) */}
                                    {log.new_data && (
                                        <div className="mt-3 p-2 bg-gray-50 rounded text-[10px] font-mono overflow-x-auto hidden group-hover:block">
                                            {JSON.stringify(log.new_data, null, 2)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};
