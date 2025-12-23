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
import { Select } from "../ui/select";
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
    Download,
    LayoutDashboard,
    TrendingUp,
    ShieldCheck,
    Briefcase,
    CheckCircle,
    Clock,
    Printer
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
        deleteUser,
        areas,
        addArea,
        updateArea,
        deleteArea
    } = useAttendance();
    const { signUp } = useAuth();

    const [activeTab, setActiveTab] = useState<'reports' | 'supervisors' | 'workers' | 'areas'>('reports');
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());

    // Management states
    const [searchTerm, setSearchTerm] = useState("");
    const [editingItem, setEditingItem] = useState<{ type: 'worker', data: Worker | (Partial<Worker> & { id: 'NEW' }) } | { type: 'supervisor', data: SupervisorEditingData } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
    const [areaInput, setAreaInput] = useState("");
    const [editingArea, setEditingArea] = useState<Partial<Worker> | null>(null); // Reusing logic for areas
    const [areaForm, setAreaForm] = useState<{ id?: string, name: string }>({ name: '' });

    // Reports filtering
    const [reportSearchTerm, setReportSearchTerm] = useState("");
    const [reportAreaFilter, setReportAreaFilter] = useState<string>("ALL");

    // Filter supervisors (users with SUPERVISOR role)
    const supervisors = users.filter(u => u.role === 'SUPERVISOR');

    // Filtered lists for search
    const filteredWorkers = workers.filter(w => {
        const areaName = areas.find(a => a.id === w.areaId)?.name || "";
        return w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            areaName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredSupervisors = supervisors.filter(s => {
        const areaName = s.areaId === 'ALL' ? 'كل المناطق' : (areas.find(a => a.id === s.areaId)?.name || "");
        return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            areaName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const filteredAreas = areas.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Global Statistics Calculations
    const totalWorkersCount = workers.length;
    const activeSupervisorsCount = supervisors.length;
    const totalSectorsCount = areas.length;

    const currentMonthEntries = workers.filter(w => !!getWorkerAttendance(w.id, month, year)).length;
    const completionRate = totalWorkersCount > 0 ? Math.round((currentMonthEntries / totalWorkersCount) * 100) : 0;

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
                    setIsSaving(false);
                    return;
                }
                const username = data.username.trim();
                await signUp(
                    username,
                    data.password.trim(),
                    data.name.trim(),
                    'SUPERVISOR',
                    data.areaId?.trim()
                );
                // Also link areas
                if (selectedAreaIds.length > 0) {
                    const newUser = users.find(u => u.username === username);
                    if (newUser) {
                        await updateUser(newUser.id, {}, selectedAreaIds);
                    }
                }
            } else {
                await updateUser(editingItem.data.id, editingItem.data as Partial<User>, selectedAreaIds);
            }
            setEditingItem(null);
            setSelectedAreaIds([]);
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
        const headers = ["الرقم", "الاسم", "القطاع", "أيام عادية", "إضافي عادي", "إضافي عطلة", "أيام الأعياد", "الإجمالي"];
        const rows = workers.map(worker => {
            const record = getWorkerAttendance(worker.id, month, year);
            const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;
            return [
                worker.id,
                worker.name,
                areaName,
                record ? record.normalDays : 0,
                record ? record.overtimeNormalDays : 0,
                record ? record.overtimeHolidayDays : 0,
                record ? (record.overtimeEidDays || 0) : 0,
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
        <div className="space-y-6 pb-20">
            {/* Header section */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="bg-purple-600 p-3 rounded-xl text-white shadow-lg shadow-purple-100">
                        <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 leading-tight">لوحة الموارد البشرية</h2>
                        <p className="text-gray-500 text-sm">مراقبة الحضور وإدارة الكوادر البشرية</p>
                    </div>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full lg:w-auto">
                    {[
                        { id: 'reports', label: 'التقارير', icon: FileText },
                        { id: 'supervisors', label: 'المراقبين', icon: Users },
                        { id: 'workers', label: 'العمال', icon: HardHat },
                        { id: 'areas', label: 'المناطق', icon: MapPin }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 lg:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50/50'
                                }`}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none shadow-sm bg-blue-50/50 overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-blue-900">
                        <HardHat className="h-24 w-24" />
                    </div>
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                            <Users className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-bold mb-0.5">إجمالي العمال</p>
                            <p className="text-2xl font-black text-blue-900">{totalWorkersCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-purple-50/50 overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-purple-900">
                        <Users className="h-24 w-24" />
                    </div>
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                        <div className="bg-purple-100 p-2.5 rounded-xl text-purple-600">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-bold mb-0.5">المراقبين النشطين</p>
                            <p className="text-2xl font-black text-purple-900">{activeSupervisorsCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-amber-50/50 overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-amber-900">
                        <MapPin className="h-24 w-24" />
                    </div>
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                        <div className="bg-amber-100 p-2.5 rounded-xl text-amber-600">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 font-bold mb-0.5">إجمالي القطاعات</p>
                            <p className="text-2xl font-black text-amber-900">{totalSectorsCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-green-50/50 overflow-hidden relative">
                    <div className="absolute -right-4 -bottom-4 opacity-10 text-green-900">
                        <TrendingUp className="h-24 w-24" />
                    </div>
                    <CardContent className="p-5 flex items-center gap-4 relative z-10">
                        <div className="bg-green-100 p-2.5 rounded-xl text-green-600">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-green-600 font-bold mb-0.5">نسبة الإنجاز ({month}/{year})</p>
                            <div className="flex items-center gap-2">
                                <p className="text-2xl font-black text-green-900">{completionRate}%</p>
                                <div className="flex-1 h-2 bg-green-200/50 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${completionRate}%` }} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
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
                                <Select
                                    value={editingItem.data.areaId || ''}
                                    onChange={e => {
                                        if (editingItem.type === 'worker') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } });
                                        } else if (editingItem.type === 'supervisor') {
                                            setEditingItem({ ...editingItem, data: { ...editingItem.data, areaId: e.target.value } });
                                        }
                                    }}
                                    required
                                >
                                    <option value="">اختر المنطقة...</option>
                                    {areas.map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                    {editingItem.type === 'supervisor' && <option value="ALL">كل المناطق (ADMIN)</option>}
                                </Select>
                            </div>
                            {editingItem.type === 'worker' && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الأجر اليومي (د.أ)</label>
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
                                    <div className="col-span-full space-y-2 border-t pt-4 mt-2">
                                        <label className="text-sm font-bold text-gray-700 block">تخصيص مناطق إضافية (اختياري)</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-lg border">
                                            {areas.map(area => (
                                                <label key={area.id} className="flex items-center gap-2 text-sm p-1 hover:bg-gray-100 rounded cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedAreaIds.includes(area.id)}
                                                        onChange={e => {
                                                            if (e.target.checked) {
                                                                setSelectedAreaIds(prev => [...prev, area.id]);
                                                            } else {
                                                                setSelectedAreaIds(prev => prev.filter(id => id !== area.id));
                                                            }
                                                        }}
                                                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-600"
                                                    />
                                                    {area.name}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
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
                        placeholder="بحث عن طريق الاسم، الرقم التعريفي، أو المنطقة..."
                        className="pr-10 bg-white"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-end gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
                            <div className="relative flex-1 w-full">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="بحث باسم العامل..."
                                    className="pr-10 bg-gray-50/50 border-gray-200"
                                    value={reportSearchTerm}
                                    onChange={e => setReportSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select
                                className="bg-gray-50/50 border-gray-200 min-w-[180px]"
                                value={reportAreaFilter}
                                onChange={e => setReportAreaFilter(e.target.value)}
                            >
                                <option value="ALL">جميع المناطق</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <MonthYearPicker month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
                        </div>
                    </div>

                    <Card className="border-none shadow-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                            <div>
                                <CardTitle className="text-lg font-bold">سجل الحضور الشهري</CardTitle>
                                <CardDescription>كشف حضور عمال {reportAreaFilter === 'ALL' ? 'كافة القطاعات' : areas.find(a => a.id === reportAreaFilter)?.name} لشهر {month}/{year}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.print()}
                                    className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                    <Printer className="h-4 w-4" />
                                    نسخة ورقية
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2 border-purple-100 text-purple-600 hover:bg-purple-50">
                                    <Download className="h-4 w-4" />
                                    تصدير CSV
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="overflow-x-auto p-0">
                            <table className="w-full text-sm text-right border-collapse">
                                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="p-4 border-b text-right">الاسم / الرقم</th>
                                        <th className="p-4 border-b text-right">المنطقة</th>
                                        <th className="p-4 border-b text-center">أيام العمل</th>
                                        <th className="p-4 border-b text-center">إضافي (عادي)</th>
                                        <th className="p-4 border-b text-center">إضافي (عطل)</th>
                                        <th className="p-4 border-b text-center">أيام الأعياد</th>
                                        <th className="p-4 border-b text-center bg-purple-50/30 text-purple-700">المجموع</th>
                                        <th className="p-4 border-b text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {workers
                                        .filter(w => {
                                            const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                                            const matchesSearch =
                                                w.name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
                                                w.id.includes(reportSearchTerm) ||
                                                areaName.toLowerCase().includes(reportSearchTerm.toLowerCase());
                                            const matchesArea = reportAreaFilter === 'ALL' || w.areaId === reportAreaFilter;
                                            return matchesSearch && matchesArea;
                                        })
                                        .map((worker) => {
                                            const record = getWorkerAttendance(worker.id, month, year);
                                            const isFilled = !!record;
                                            const areaName = areas.find(a => a.id === worker.areaId)?.name || "غير محدد";

                                            return (
                                                <tr key={worker.id} className="hover:bg-gray-50/50 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{worker.name}</div>
                                                        <div className="text-[10px] text-gray-400">ID: {worker.id}</div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-1.5 text-gray-600">
                                                            <MapPin className="h-3 w-3 text-gray-300" />
                                                            {areaName}
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-center font-mono font-medium">{record ? record.normalDays : "—"}</td>
                                                    <td className="p-4 text-center font-mono font-medium text-amber-600">{record ? record.overtimeNormalDays : "—"}</td>
                                                    <td className="p-4 text-center font-mono font-medium text-red-600">{record ? record.overtimeHolidayDays : "—"}</td>
                                                    <td className="p-4 text-center font-mono font-medium text-green-600">{record ? (record.overtimeEidDays || 0) : "—"}</td>
                                                    <td className="p-4 text-center bg-purple-50/10">
                                                        <Badge variant={isFilled ? "success" : "secondary"} className="font-black font-mono">
                                                            {record ? record.totalCalculatedDays : "0"}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex justify-center">
                                                            {isFilled ? (
                                                                <div className="flex items-center gap-1 text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                                    <CheckCircle className="h-3 w-3" />
                                                                    مكتمل
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                                                                    <Clock className="h-3 w-3" />
                                                                    معلق
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                </tbody>
                            </table>
                            {workers.filter(w => {
                                const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                                const matchesSearch =
                                    w.name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
                                    w.id.includes(reportSearchTerm) ||
                                    areaName.toLowerCase().includes(reportSearchTerm.toLowerCase());
                                const matchesArea = reportAreaFilter === 'ALL' || w.areaId === reportAreaFilter;
                                return matchesSearch && matchesArea;
                            }).length === 0 && (
                                    <div className="py-20 text-center">
                                        <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                        <h3 className="text-gray-900 font-bold">لا توجد نتائج</h3>
                                        <p className="text-gray-500 text-sm">لم نجد أي عامل يطابق معايير البحث الحالية</p>
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Supervisors Tab */}
            {activeTab === 'supervisors' && (
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <CardTitle className="text-lg font-bold">إدارة المراقبين</CardTitle>
                            <CardDescription>التحكم في حسابات المراقبين وصلاحيات الوصول للمناطق</CardDescription>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100" onClick={() => {
                            setEditingItem({ type: 'supervisor', data: { id: 'NEW', name: '', username: '', areaId: '', password: '' } });
                            setSelectedAreaIds([]);
                        }}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة مراقب
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-4 border-b">اسم المراقب</th>
                                    <th className="p-4 border-b">اسم المستخدم</th>
                                    <th className="p-4 border-b">نطاق الإشراف</th>
                                    <th className="p-4 border-b text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredSupervisors.map(s => (
                                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{s.name}</td>
                                        <td className="p-4 text-sm text-gray-500 font-mono italic">{s.username}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.areaId && (
                                                    <Badge variant="outline" className="flex items-center gap-1 w-fit bg-blue-50/50 text-blue-700 border-blue-100">
                                                        <MapPin className="h-3 w-3" />
                                                        {areas.find(a => a.id === s.areaId)?.name || s.areaId}
                                                    </Badge>
                                                )}
                                                {s.areas?.map(area => (
                                                    <Badge key={area.id} variant="outline" className="flex items-center gap-1 w-fit bg-purple-50/50 text-purple-700 border-purple-100">
                                                        <MapPin className="h-3 w-3" />
                                                        {area.name}
                                                    </Badge>
                                                ))}
                                                {(!s.areaId && (!s.areas || s.areas.length === 0)) && (
                                                    <span className="text-gray-400 text-xs italic">لا توجد مناطق محددة</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => {
                                                    setEditingItem({ type: 'supervisor', data: s });
                                                    setSelectedAreaIds(s.areas?.map(a => a.id) || []);
                                                }}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => handleDeleteSupervisor(s.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredSupervisors.length === 0 && (
                            <div className="py-20 text-center">
                                <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-gray-900 font-bold">لا يوجد مراقبين</h3>
                                <p className="text-gray-500 text-sm">ابدأ بإضافة أول مراقب للنظام</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Workers Tab */}
            {activeTab === 'workers' && (
                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                        <div>
                            <CardTitle className="text-lg font-bold">سجل القوى العاملة</CardTitle>
                            <CardDescription>إدارة بيانات العمال الميدانيين وتفاصيل الأجور</CardDescription>
                        </div>
                        <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100" onClick={() => setEditingItem({ type: 'worker', data: { id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 } })}>
                            <Plus className="h-4 w-4 ml-2" />
                            إضافة عامل جديد
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="p-4 border-b">الرقم التعريفي</th>
                                    <th className="p-4 border-b">اسم العامل</th>
                                    <th className="p-4 border-b">القطاع / المنطقة</th>
                                    <th className="p-4 border-b text-center">الأجر اليومي</th>
                                    <th className="p-4 border-b text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredWorkers.map(w => (
                                    <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 font-mono text-[11px] text-gray-400 font-bold tracking-tighter">#{w.id}</td>
                                        <td className="p-4 font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{w.name}</td>
                                        <td className="p-4">
                                            <Badge variant="outline" className="bg-blue-50/30 text-blue-700 border-blue-100/50">
                                                <MapPin className="h-3 w-3 ml-1 text-blue-300" />
                                                {areas.find(a => a.id === w.areaId)?.name || w.areaId}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-green-700 font-mono">{w.dayValue}</span>
                                                <span className="text-[9px] text-gray-400 font-bold uppercase">د.أ / يوم</span>
                                            </div>
                                        </td>
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
                                ))}
                            </tbody>
                        </table>
                        {filteredWorkers.length === 0 && (
                            <div className="py-20 text-center">
                                <HardHat className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                <h3 className="text-gray-900 font-bold">لا يوجد عمال</h3>
                                <p className="text-gray-500 text-sm">قم بإضافة العمال لبدء تسجيل الحضور</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            {/* Areas Tab */}
            {activeTab === 'areas' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 h-fit border-none shadow-sm">
                        <CardHeader className="bg-white border-b border-gray-100 p-6">
                            <CardTitle className="text-lg font-bold">{areaForm.id ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}</CardTitle>
                            <CardDescription>تعريف قطاعات العمل الجديدة في النظام</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                setIsSaving(true);
                                try {
                                    const trimmedName = areaForm.name.trim();

                                    // Check for duplicates (case insensitive and trimmed)
                                    const isDuplicate = areas.some(a =>
                                        a.name.trim().toLowerCase() === trimmedName.toLowerCase() && a.id !== areaForm.id
                                    );

                                    if (isDuplicate) {
                                        alert('تنبيه: هذا الاسم موجود بالفعل! يرجى اختيار اسم فريد.');
                                        setIsSaving(false);
                                        return;
                                    }

                                    if (areaForm.id) {
                                        await updateArea(areaForm.id, trimmedName);
                                    } else {
                                        await addArea(trimmedName);
                                    }
                                    setAreaForm({ name: '' });
                                } catch (err) {
                                    console.error(err);
                                } finally {
                                    setIsSaving(false);
                                }
                            }} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400">اسم المنطقة / القطاع</label>
                                    <Input
                                        value={areaForm.name}
                                        onChange={e => setAreaForm({ ...areaForm, name: e.target.value })}
                                        placeholder="مثلاً: القطاع الشمالي"
                                        required
                                        className="bg-gray-50/50"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isSaving}>
                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                                        حفظ المنطقة
                                    </Button>
                                    {areaForm.id && (
                                        <Button type="button" variant="outline" onClick={() => setAreaForm({ name: '' })}>إلغاء</Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                        <CardHeader className="bg-white border-b border-gray-100 p-6">
                            <CardTitle className="text-lg font-bold">قائمة المناطق والقطاعات</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                    <tr>
                                        <th className="p-4 border-b">اسم المنطقة</th>
                                        <th className="p-4 border-b">عدد العمال</th>
                                        <th className="p-4 border-b text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {filteredAreas.map(a => {
                                        const workerCount = workers.filter(w => w.areaId === a.id).length;
                                        return (
                                            <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="p-4 font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                    {a.name}
                                                    {a.name !== a.name.trim() && (
                                                        <Badge variant="outline" className="mr-2 text-[8px] border-amber-200 text-amber-600 bg-amber-50">
                                                            يحتوي على مسافات زائدة
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                        {workerCount} عامل
                                                    </Badge>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex justify-center gap-2">
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => setAreaForm({ id: a.id, name: a.name })}>
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={async () => {
                                                            if (workerCount > 0) {
                                                                alert('لا يمكن حذف منطقة تحتوي على عمال. يرجى نقل العمال أولاً.');
                                                                return;
                                                            }
                                                            if (window.confirm('هل أنت متأكد من حذف هذه المنطقة؟')) {
                                                                await deleteArea(a.id);
                                                            }
                                                        }}>
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
                </div>
            )}
            {/* Printable Area - Hidden by default */}
            <div className="hidden print:block print:m-0 print:p-0">
                <div className="text-center mb-6 border-b-2 pb-4">
                    <h1 className="text-2xl font-bold mb-1">تقرير الحضور الشهري العام</h1>
                    <p className="text-gray-600">
                        الشهر: {month} / {year} | القطاع: {reportAreaFilter === "ALL" ? "جميع المناطق" : areas.find(a => a.id === reportAreaFilter)?.name}
                    </p>
                    <p className="text-sm mt-1 text-purple-600 font-bold">إدارة الموارد البشرية</p>
                </div>

                <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2 text-right">رقم العامل</th>
                            <th className="border border-gray-300 p-2 text-right">الاسم الكامل</th>
                            <th className="border border-gray-300 p-2 text-right">المنطقة</th>
                            <th className="border border-gray-300 p-2 text-center">عادي</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي 0.5</th>
                            <th className="border border-gray-300 p-2 text-center">إضافي 1.0</th>
                            <th className="border border-gray-300 p-2 text-center">أعياد 1.0</th>
                            <th className="border border-gray-300 p-2 text-center font-bold">الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {workers
                            .filter(w => {
                                const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                                const matchesSearch =
                                    w.name.toLowerCase().includes(reportSearchTerm.toLowerCase()) ||
                                    w.id.includes(reportSearchTerm) ||
                                    areaName.toLowerCase().includes(reportSearchTerm.toLowerCase());
                                const matchesArea = reportAreaFilter === 'ALL' || w.areaId === reportAreaFilter;
                                return matchesSearch && matchesArea;
                            })
                            .map((worker) => {
                                const record = getWorkerAttendance(worker.id, month, year);
                                const areaName = areas.find(a => a.id === worker.areaId)?.name || worker.areaId;
                                return (
                                    <tr key={worker.id}>
                                        <td className="border border-gray-300 p-2">{worker.id}</td>
                                        <td className="border border-gray-300 p-2 font-bold">{worker.name}</td>
                                        <td className="border border-gray-300 p-2 text-right">{areaName}</td>
                                        <td className="border border-gray-300 p-2 text-center">{record ? record.normalDays : "0"}</td>
                                        <td className="border border-gray-300 p-2 text-center">{record ? record.overtimeNormalDays : "0"}</td>
                                        <td className="border border-gray-300 p-2 text-center">{record ? record.overtimeHolidayDays : "0"}</td>
                                        <td className="border border-gray-300 p-2 text-center">{record ? (record.overtimeEidDays || 0) : "0"}</td>
                                        <td className="border border-gray-300 p-2 text-center font-bold italic">{record ? record.totalCalculatedDays : "0"}</td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>

                <div className="mt-8 grid grid-cols-2 gap-8 text-center no-print">
                    <div className="border-t border-black pt-2 font-bold">إعداد الموارد البشرية</div>
                    <div className="border-t border-black pt-2 font-bold">توقيع المدير العام</div>
                </div>

                <div className="mt-12 text-[10px] text-gray-400 text-center">
                    تم استخراج هذا التقرير بتاريخ {new Date().toLocaleDateString('ar-LY')} من لوحة الموارد البشرية
                </div>
            </div>
        </div>
    );
}
