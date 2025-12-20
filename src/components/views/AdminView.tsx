"use client";

import React, { useState } from 'react';
import { useAttendance } from '@/context/AttendanceContext';
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
    Save
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export const AdminView = () => {
    const { workers, attendanceRecords, users, auditLogs, isLoading, addWorker, updateWorker, deleteWorker, updateUser } = useAttendance();
    const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'workers' | 'logs'>('overview');

    // Management states
    const [editingItem, setEditingItem] = useState<{ type: 'worker' | 'user', data: any } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setIsSaving(true);
        try {
            if (editingItem.data.id && editingItem.data.id !== 'NEW') {
                await updateWorker(editingItem.data.id, editingItem.data);
            } else {
                await addWorker(editingItem.data);
            }
            setEditingItem(null);
        } catch (err) {
            alert('فشل حفظ البيانات');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem) return;
        setIsSaving(true);
        try {
            await updateUser(editingItem.data.id, editingItem.data);
            setEditingItem(null);
        } catch (err) {
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
        <div className="space-y-6">
            {/* Header section with tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="bg-red-600 p-2 rounded-lg">
                        <ShieldCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">لوحة تحكم مدير النظام</h2>
                        <p className="text-sm text-gray-500">إدارة المستخدمين والعمال والإعدادات العامة</p>
                    </div>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200 overflow-x-auto">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        نظرة عامة
                    </button>
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        المستخدمين
                    </button>
                    <button
                        onClick={() => setActiveTab('workers')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'workers' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        العمال
                    </button>
                    <button
                        onClick={() => setActiveTab('logs')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        السجلات
                    </button>
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
                                    value={editingItem.data.name}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">المنطقة / القطاع</label>
                                <Input
                                    value={editingItem.data.areaId || ''}
                                    onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } })}
                                />
                            </div>
                            {editingItem.type === 'worker' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الأجر اليومي (د.ل)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editingItem.data.dayValue}
                                            onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: parseFloat(e.target.value) } })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الراتب الأساسي</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editingItem.data.baseSalary}
                                            onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, baseSalary: parseFloat(e.target.value) } })}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            {editingItem.type === 'user' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">الدور</label>
                                    <select
                                        className="w-full p-2 border rounded-md text-sm"
                                        value={editingItem.data.role}
                                        onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value } })}
                                    >
                                        <option value="SUPERVISOR">SUPERVISOR</option>
                                        <option value="HR">HR</option>
                                        <option value="FINANCE">FINANCE</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </div>
                            )}
                            <div className="col-span-full flex justify-end gap-2 mt-2 font-sans" dir="rtl">
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>إلغاء</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
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
                        {stats.map((stat, idx) => (
                            <Card key={idx} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                                            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                        </div>
                                        <div className={`${stat.bg} p-3 rounded-xl`}>
                                            <stat.icon className={`h-6 w-6 ${stat.color}`} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
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

            {activeTab === 'users' && (
                <Card className="animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>إدارة المستخدمين</CardTitle>
                            <CardDescription>إضافة وتعديل صلاحيات المستخدمين في النظام</CardDescription>
                        </div>
                        <Button className="bg-blue-600" onClick={() => setEditingItem({ type: 'user', data: { id: 'NEW', name: '', username: '', role: 'SUPERVISOR', areaId: '' } })}>
                            <UserPlus className="h-4 w-4 ml-2" />
                            مستخدم جديد
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b text-gray-500 text-sm">
                                        <th className="pb-3 pr-4 font-medium">الاسم</th>
                                        <th className="pb-3 px-4 font-medium">اسم المستخدم</th>
                                        <th className="pb-3 px-4 font-medium">الدور</th>
                                        <th className="pb-3 px-4 font-medium">المنطقة</th>
                                        <th className="pb-3 pl-4 font-medium text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((u) => (
                                        <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pr-4 text-sm font-medium">{u.name}</td>
                                            <td className="py-4 px-4 text-sm text-gray-600">{u.username}</td>
                                            <td className="py-4 px-4">
                                                <Badge variant={u.role === 'ADMIN' ? 'default' : 'outline'}>
                                                    {u.role}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-sm text-gray-500">{u.areaId || 'الكل'}</td>
                                            <td className="py-4 pl-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" onClick={() => setEditingItem({ type: 'user', data: u })}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {activeTab === 'workers' && (
                <Card className="animate-in slide-in-from-bottom-4 duration-500">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle>إدارة العمال</CardTitle>
                            <CardDescription>قائمة بجميع العمال المسجلين في النظام عبر كافة القطاعات</CardDescription>
                        </div>
                        <Button className="bg-green-600" onClick={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة عامل
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="border-b text-gray-500 text-sm">
                                        <th className="pb-3 pr-4 font-medium">ID</th>
                                        <th className="pb-3 px-4 font-medium">الاسم</th>
                                        <th className="pb-3 px-4 font-medium">القطاع</th>
                                        <th className="pb-3 px-4 font-medium">قيمة اليوم</th>
                                        <th className="pb-3 pl-4 font-medium text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {workers.map((w) => (
                                        <tr key={w.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pr-4 text-sm text-gray-500 font-mono">{w.id}</td>
                                            <td className="py-4 px-4 text-sm font-medium">{w.name}</td>
                                            <td className="py-4 px-4 text-sm">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                                                    {w.areaId}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-sm font-bold">{w.dayValue} د.ل</td>
                                            <td className="py-4 pl-4">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" onClick={() => setEditingItem({ type: 'worker', data: w })}>
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteWorker(w.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
