"use client";

import React, { useState } from "react";
import { useAttendance, User, Worker, UserRole } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
interface SupervisorEditingData extends Partial<User> {
    id: string;
    username?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    areaId?: string;
}

import { MonthYearPicker } from "../ui/month-year-picker";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
    FileText,
    Users,
    HardHat,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    AlertCircle,
    Search,
    MapPin,
    DollarSign,
    Save,
    X,
    Download
} from "lucide-react";

export function HRView() {
    const {
        workers,
        users,
        getWorkerAttendance,
        isLoading,
        error,
        addWorker,
        updateWorker,
        deleteWorker,
        updateUser,
        deleteUser
    } = useAttendance();
    const { signUp } = useAuth();

    const [activeTab, setActiveTab] = useState<'reports' | 'supervisors' | 'workers'>('reports');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Management states
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<{ type: 'worker', data: Worker | (Partial<Worker> & { id: 'NEW' }) } | { type: 'supervisor', data: SupervisorEditingData } | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Filter supervisors (users with SUPERVISOR role)
    const supervisors = users.filter(u => u.role === 'SUPERVISOR');

    // Filtered lists for search
    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.areaId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredSupervisors = supervisors.filter(s =>
        s.name.includes(searchTerm) || s.username.includes(searchTerm) || (s.areaId || "").includes(searchTerm)
    );

    const handleSaveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'worker') return;

        setIsSaving(true);
        try {
            if (editingItem.data.id !== 'NEW') {
                await updateWorker(editingItem.data.id, editingItem.data as Partial<Worker>);
            } else {
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

    const handleSaveSupervisor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'supervisor') return;

        setIsSaving(true);
        try {
            if (editingItem.data.id === 'NEW') {
                const data = editingItem.data;
                if (!data.password || !data.username || !data.name) {
                    alert('يرجى إدخال جميع البيانات المطلوبة للمراقب الجديد');
                    return;
                }
                await signUp(
                    data.username.trim(),
                    data.password.trim(),
                    data.name.trim(),
                    'SUPERVISOR',
                    data.areaId?.trim()
                );
            } else {
                await updateUser(editingItem.data.id, editingItem.data as Partial<User>);
            }
            setEditingItem(null);
        } catch (err: any) {
            console.error(err);
            alert('فشل حفظ البيانات: ' + (err.message || 'خطأ غير معروف'));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSupervisor = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المراقب؟')) return;
        try {
            await deleteUser(id);
        } catch (err) {
            console.error(err);
            alert('فشل حذف المراقب');
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

    const handleExportCSV = () => {
        const headers = ["الرقم", "الاسم", "القطاع", "أيام عادية", "إضافي عادي", "إضافي عطلة", "الإجمالي"];
        const rows = workers.map(worker => {
            const record = getWorkerAttendance(worker.id, month, year);
            return [
                worker.id,
                worker.name,
                worker.areaId,
                record ? record.normalDays : 0,
                record ? record.overtimeNormalDays : 0,
                record ? record.overtimeHolidayDays : 0,
                record ? record.totalCalculatedDays : 0
            ];
        });

        const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `attendance_report_${month}_${year}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center space-y-3">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-600 mx-auto" />
                    <p className="text-gray-500">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    // Show error state
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
        <div className="space-y-6">
            {/* Header with Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-purple-600" />
                        لوحة الموارد البشرية
                    </h2>
                    <p className="text-gray-500 text-sm">إدارة العمال والمراقبين والتقارير</p>
                </div>

                <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'reports' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        التقارير
                    </button>
                    <button
                        onClick={() => setActiveTab('supervisors')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'supervisors' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        المراقبين
                    </button>
                    <button
                        onClick={() => setActiveTab('workers')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'workers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        العمال
                    </button>
                </div>
            </div>

            {/* Editing/Adding Form Overlay (Simple inline version) */}
            {editingItem && (
                <Card className="border-2 border-purple-200 shadow-lg animate-in zoom-in-95 duration-200">
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
                        <form onSubmit={editingItem.type === 'worker' ? handleSaveWorker : handleSaveSupervisor} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">الاسم</label>
                                <Input
                                    value={editingItem.data.name}
                                    onChange={e => {
                                        if (editingItem.type === 'worker') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } });
                                        } else if (editingItem.type === 'supervisor') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } });
                                        }
                                    }}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500">المنطقة / القطاع</label>
                                <Input
                                    value={editingItem.data.areaId || ''}
                                    onChange={e => {
                                        if (editingItem.type === 'worker') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } });
                                        } else if (editingItem.type === 'supervisor') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } });
                                        }
                                    }}
                                    required
                                />
                            </div>
                            {editingItem.type === 'worker' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الأجر اليومي (د.ل)</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editingItem.type === 'worker' ? editingItem.data.dayValue : 0}
                                            onChange={e => {
                                                if (editingItem.type === 'worker') {
                                                    setEditingItem({ ...editingItem, data: { ...editingItem.data, dayValue: parseFloat(e.target.value) } });
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الراتب الأساسي</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={editingItem.type === 'worker' ? editingItem.data.baseSalary : 0}
                                            onChange={e => {
                                                if (editingItem.type === 'worker') {
                                                    setEditingItem({ ...editingItem, data: { ...editingItem.data, baseSalary: parseFloat(e.target.value) } });
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                </>
                            )}
                            {editingItem.type === 'supervisor' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">اسم المستخدم (للتسجيل)</label>
                                        <Input
                                            value={editingItem.type === 'supervisor' ? (editingItem.data.username || '') : ''}
                                            onChange={e => {
                                                if (editingItem.type === 'supervisor') {
                                                    setEditingItem({ ...editingItem, data: { ...editingItem.data, username: e.target.value } });
                                                }
                                            }}
                                            readOnly={editingItem.data.id !== 'NEW'}
                                            className={editingItem.data.id !== 'NEW' ? "bg-gray-50" : ""}
                                            placeholder="مثلاً: ahmed.ali"
                                            required
                                        />
                                    </div>
                                    {editingItem.data.id === 'NEW' && (
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-gray-500">كلمة المرور</label>
                                            <Input
                                                type="password"
                                                value={editingItem.type === 'supervisor' ? (editingItem.data.password || '') : ''}
                                                onChange={e => {
                                                    if (editingItem.type === 'supervisor') {
                                                        setEditingItem({ ...editingItem, data: { ...editingItem.data, password: e.target.value } });
                                                    }
                                                }}
                                                required
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            <div className="col-span-full flex justify-end gap-2 mt-2">
                                <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>إلغاء</Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                                    حفظ التغييرات
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search Bar (Invisible in Reports) */}
            {activeTab !== 'reports' && (
                <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="بحث عن طريق الاسم أو المنطقة..."
                        className="pr-10 bg-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                    </div>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>سجل الحضور - {month} / {year}</CardTitle>
                            <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                                <Download className="h-4 w-4" />
                                تصدير CSV
                            </Button>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 text-gray-700 font-medium">
                                    <tr>
                                        <th className="p-4 border-b">الاسم</th>
                                        <th className="p-4 border-b">المنطقة</th>
                                        <th className="p-4 border-b text-center">أيام العمل</th>
                                        <th className="p-4 border-b text-center">إضافي (عادي)</th>
                                        <th className="p-4 border-b text-center">إضافي (عطل)</th>
                                        <th className="p-4 border-b text-center bg-gray-100">المجموع</th>
                                        <th className="p-4 border-b text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {workers.map((worker) => {
                                        const record = getWorkerAttendance(worker.id, month, year);
                                        return (
                                            <tr key={worker.id} className="hover:bg-gray-50/50">
                                                <td className="p-4 font-medium">{worker.name}</td>
                                                <td className="p-4 text-gray-500">{worker.areaId}</td>
                                                <td className="p-4 text-center">{record ? record.normalDays : "-"}</td>
                                                <td className="p-4 text-center">{record ? record.overtimeNormalDays : "-"}</td>
                                                <td className="p-4 text-center">{record ? record.overtimeHolidayDays : "-"}</td>
                                                <td className="p-4 text-center font-bold bg-gray-50">{record ? record.totalCalculatedDays : "-"}</td>
                                                <td className="p-4 text-center">
                                                    {record ? <Badge variant="success">معتمد</Badge> : <Badge variant="secondary">غير مدخل</Badge>}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Supervisors Tab */}
            {activeTab === 'supervisors' && (
                <Card>
                    <CardHeader>
                        <div>
                            <CardTitle>إدارة المراقبين</CardTitle>
                            <CardDescription>إضافة وتعديل وحذف المراقبين ومناطق إشرافهم</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setEditingItem({ type: 'supervisor', data: { id: 'NEW', name: '', username: '', areaId: '', password: '' } })}>
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة مراقب
                            </Button>
                            <Users className="h-5 w-5 text-gray-400 self-center" />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-gray-50 border-b text-gray-500 text-xs font-bold">
                                    <th className="p-4">الاسم</th>
                                    <th className="p-4">اسم المستخدم</th>
                                    <th className="p-4">منطقة الإشراف</th>
                                    <th className="p-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSupervisors.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 font-medium">{s.name}</td>
                                        <td className="p-4 text-sm text-gray-500">{s.username}</td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                <MapPin className="h-3 w-3" />
                                                {s.areaId || 'غير محدد'}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600" onClick={() => setEditingItem({ type: 'supervisor', data: s })}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteSupervisor(s.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Workers Tab */}
            {activeTab === 'workers' && (
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle>إدارة العمال</CardTitle>
                                <CardDescription>التحكم في بيانات العمال والأجور اليومية</CardDescription>
                            </div>
                            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}>
                                <Plus className="h-4 w-4 ml-2" />
                                إضافة عامل جديد
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-gray-50 border-b text-gray-500 text-xs font-bold">
                                    <th className="p-4">ID</th>
                                    <th className="p-4">الاسم</th>
                                    <th className="p-4">القطاع / المنطقة</th>
                                    <th className="p-4">الأجر اليومي</th>
                                    <th className="p-4 text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredWorkers.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-xs font-mono text-gray-400">{w.id}</td>
                                        <td className="p-4 font-medium">{w.name}</td>
                                        <td className="p-4">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none">
                                                {w.areaId}
                                            </Badge>
                                        </td>
                                        <td className="p-4 font-bold text-green-700">
                                            {w.dayValue} <span className="text-[10px] font-normal text-gray-500">د.ل / يوم</span>
                                        </td>
                                        <td className="p-4">
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
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
