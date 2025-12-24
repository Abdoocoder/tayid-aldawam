import React, { useState, useMemo } from "react";
import {
    LayoutDashboard,
    Users,
    MapPin,
    Save,
    Loader2,
    HardHat,
    Briefcase,
    ShieldCheck,
    AlertCircle,
    X,
    FileText,
    TrendingUp,
    Search
} from "lucide-react";
import { useAttendance, User, Worker, UserRole } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// Modular Components
import { WorkerSection } from "./hr/WorkerSection";
import { SupervisorSection } from "./hr/SupervisorSection";
import { AreaSection } from "./hr/AreaSection";
import { AttendanceReports } from "./hr/AttendanceReports";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

interface WorkerEditingData extends Partial<Worker> {
    id: string; // 'NEW' or existing ID
    id_entered?: string;
}

interface SupervisorEditingData extends Partial<User> {
    id: string;
    username?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    areaId?: string;
}

type EditingItem =
    | { type: 'worker', data: WorkerEditingData }
    | { type: 'supervisor', data: SupervisorEditingData };

export function HRView() {
    const {
        workers,
        users,
        getWorkerAttendance,
        approveAttendance,
        rejectAttendance,
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
    const { showToast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<'reports' | 'supervisors' | 'workers' | 'areas'>('reports');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
    const [areaForm, setAreaForm] = useState<{ id?: string, name: string }>({ name: '' });

    // Filter states for reports
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportSearchTerm, setReportSearchTerm] = useState('');
    const [reportAreaFilter, setReportAreaFilter] = useState('ALL');
    const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED'>('PENDING_HR');

    // Filter supervisors, general supervisors and mayors
    const supervisors = useMemo(() => users.filter((u: User) => u.role === 'SUPERVISOR' || u.role === 'GENERAL_SUPERVISOR' || u.role === 'MAYOR'), [users]);

    // Stats calculations
    const totalWorkersCount = workers.length;
    const activeSupervisorsCount = supervisors.length;
    const totalSectorsCount = areas.length;

    // Completion rate for current month
    const completionRate = useMemo(() => {
        if (workers.length === 0) return 0;
        const currentMonthEntries = workers.filter((w: Worker) => !!getWorkerAttendance(w.id, month, year)).length;
        return totalWorkersCount > 0 ? Math.round((currentMonthEntries / totalWorkersCount) * 100) : 0;
    }, [workers, month, year, getWorkerAttendance, totalWorkersCount]);

    const handleSaveWorker = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'worker') return;

        const data = editingItem.data;

        // Basic Validations
        if (!data.name || data.name.trim().length < 2) {
            showToast('خطأ في البيانات', 'يجب أن يكون اسم العامل حرفين على الأقل', 'warning');
            return;
        }

        if (data.dayValue === undefined || data.dayValue < 0) {
            showToast('خطأ في البيانات', 'قيمة اليوم يجب أن تكون صفر أو أكثر', 'warning');
            return;
        }

        if (data.baseSalary === undefined || data.baseSalary < 0) {
            showToast('خطأ في البيانات', 'الراتب الأساسي يجب أن يكون صفر أو أكثر', 'warning');
            return;
        }

        setIsSaving(true);
        try {
            if (editingItem.data.id !== 'NEW') {
                await updateWorker(editingItem.data.id, editingItem.data as Partial<Worker>);
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
            }
            setEditingItem(null);
            showToast('تم حفظ بيانات العامل بنجاح');
        } catch (err) {
            console.error(err);
            showToast('فشل حفظ البيانات', 'يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSaveSupervisor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingItem || editingItem.type !== 'supervisor') return;

        const data = editingItem.data;

        // Validations
        if (!data.name || data.name.trim().length < 2) {
            showToast('خطأ في البيانات', 'يجب أن يكون اسم المراقب حرفين على الأقل', 'warning');
            return;
        }

        if (editingItem.data.id === 'NEW') {
            if (!data.username || data.username.trim().length < 4) {
                showToast('خطأ في البيانات', 'اسم المستخدم يجب أن يكون 4 أحرف على الأقل', 'warning');
                return;
            }
            if (!data.password || data.password.trim().length < 6) {
                showToast('خطأ في البيانات', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'warning');
                return;
            }
        }

        setIsSaving(true);
        try {
            if (editingItem.data.id === 'NEW') {
                const data = editingItem.data;
                const username = data.username!.trim();
                await signUp(
                    username,
                    data.password!.trim(),
                    data.name!.trim(),
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
                showToast('تم إضافة المراقب بنجاح');
            } else {
                await updateUser(editingItem.data.id, editingItem.data as Partial<User>, selectedAreaIds);
                showToast('تم تحديث بيانات المراقب بنجاح');
            }
            setEditingItem(null);
            setSelectedAreaIds([]);
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : 'خطأ غير معروف';
            showToast('فشل حفظ البيانات', message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteSupervisor = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذا المراقب؟')) return;
        try {
            await deleteUser(id);
            showToast('تم حذف المراقب بنجاح');
        } catch (err) {
            console.error(err);
            showToast('فشل حذف المراقب', 'يرجى المحاولة مرة أخرى', 'error');
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

    const handleBulkApprove = async () => {
        const pendingRecords = workers
            .map((w: Worker) => getWorkerAttendance(w.id, month, year))
            .filter((r) => r && r.status === 'PENDING_HR');

        if (pendingRecords.length === 0) return;

        if (!window.confirm(`هل أنت متأكد من اعتماد ${pendingRecords.length} سجلات وتحويلها لقسم الرواتب؟`)) return;

        setIsSaving(true);
        try {
            for (const record of pendingRecords) {
                if (record) await approveAttendance(record.id, 'PENDING_FINANCE');
            }
            showToast(`تم اعتماد ${pendingRecords.length} سجلات بنجاح`);
        } catch (err) {
            console.error(err);
            showToast('خطأ في الاعتماد الجماعي', 'يرجى المحاولة مرة أخرى', 'error');
        } finally {
            setIsSaving(false);
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
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 backdrop-blur-md p-4 md:p-6 rounded-3xl shadow-lg shadow-purple-900/5 border border-white/20 sticky top-4 z-20 transition-all duration-300">
                <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-3.5 rounded-2xl text-white shadow-lg shadow-purple-500/30 transform hover:scale-105 transition-transform duration-300">
                        <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 leading-tight">لوحة الموارد البشرية</h2>
                        <p className="text-gray-500 text-sm font-medium">نظام إدارة الكوادر الذكي</p>
                    </div>
                </div>

                <div className="flex bg-gray-100/50 p-1.5 rounded-2xl border border-gray-200/50 w-full lg:w-auto overflow-x-auto no-scrollbar backdrop-blur-sm">
                    {[
                        { id: 'reports', label: 'التقارير', icon: FileText },
                        { id: 'supervisors', label: 'المراقبين', icon: Users },
                        { id: 'workers', label: 'العمال', icon: HardHat },
                        { id: 'areas', label: 'المناطق', icon: MapPin }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`flex-1 lg:flex-none px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-white text-purple-700 shadow-md shadow-purple-900/5 scale-100'
                                : 'text-gray-500 hover:text-gray-900 hover:bg-white/50 scale-95 hover:scale-100'
                                }`}
                        >
                            <tab.icon className={`h-4 w-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Global Search Bar (Only for management tabs) */}
            {activeTab !== 'reports' && (
                <div className="relative max-w-md mx-auto w-full px-4">
                    <Search className="absolute right-7 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="بحث في القائمة الحالية..."
                        className="pr-10 bg-white rounded-xl shadow-sm border-gray-100"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100 fill-mode-both">
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 overflow-hidden relative hover:shadow-md transition-shadow duration-300">
                    <div className="absolute -right-6 -bottom-6 opacity-10 text-blue-600 rotate-12 transform scale-150">
                        <HardHat className="h-32 w-32" />
                    </div>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4 relative z-10">
                        <div className="bg-white p-3 rounded-2xl text-blue-600 shadow-sm ring-1 ring-blue-100">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-blue-600 font-bold mb-1 uppercase tracking-wider">إجمالي العمال</p>
                            <p className="text-3xl font-black text-blue-900">{totalWorkersCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100/50 overflow-hidden relative hover:shadow-md transition-shadow duration-300">
                    <div className="absolute -right-6 -bottom-6 opacity-10 text-purple-600 rotate-12 transform scale-150">
                        <Users className="h-32 w-32" />
                    </div>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4 relative z-10">
                        <div className="bg-white p-3 rounded-2xl text-purple-600 shadow-sm ring-1 ring-purple-100">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-purple-600 font-bold mb-1 uppercase tracking-wider">المراقبين النشطين</p>
                            <p className="text-3xl font-black text-purple-900">{activeSupervisorsCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-amber-50 to-amber-100/50 overflow-hidden relative hover:shadow-md transition-shadow duration-300">
                    <div className="absolute -right-6 -bottom-6 opacity-10 text-amber-600 rotate-12 transform scale-150">
                        <MapPin className="h-32 w-32" />
                    </div>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4 relative z-10">
                        <div className="bg-white p-3 rounded-2xl text-amber-600 shadow-sm ring-1 ring-amber-100">
                            <Briefcase className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-amber-600 font-bold mb-1 uppercase tracking-wider">إجمالي القطاعات</p>
                            <p className="text-3xl font-black text-amber-900">{totalSectorsCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100/50 overflow-hidden relative hover:shadow-md transition-shadow duration-300">
                    <div className="absolute -right-6 -bottom-6 opacity-10 text-green-600 rotate-12 transform scale-150">
                        <TrendingUp className="h-32 w-32" />
                    </div>
                    <CardContent className="p-4 md:p-6 flex items-center gap-4 relative z-10">
                        <div className="bg-white p-3 rounded-2xl text-green-600 shadow-sm ring-1 ring-green-100">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-green-600 font-bold mb-1 uppercase tracking-wider">نسبة الإنجاز ({month}/{year})</p>
                            <div className="flex items-center gap-3">
                                <p className="text-3xl font-black text-green-900">{completionRate}%</p>
                                <div className="flex-1 h-2.5 bg-green-200/50 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionRate}%` }} />
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
                            {editingItem.type === 'worker' && (
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500">الرقم الوظيفي (البلدية)</label>
                                    <Input
                                        value={editingItem.data.id === 'NEW' ? ((editingItem.data as WorkerEditingData).id_entered || '') : editingItem.data.id}
                                        onChange={e => {
                                            if (editingItem.data.id === 'NEW') {
                                                setEditingItem({ ...editingItem, data: { ...editingItem.data, id_entered: e.target.value } });
                                            }
                                        }}
                                        readOnly={editingItem.data.id !== 'NEW'}
                                        placeholder="الرقم في نظام البلدية"
                                        className={editingItem.data.id !== 'NEW' ? "bg-gray-100 font-mono" : "font-mono border-purple-200 focus:border-purple-500"}
                                        required
                                    />
                                </div>
                            )}
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
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-500">الدور الوظيفي</label>
                                        <Select
                                            value={editingItem.data.role || 'SUPERVISOR'}
                                            onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, role: e.target.value as UserRole } })}
                                            required
                                        >
                                            <option value="SUPERVISOR">مراقب ميداني</option>
                                            <option value="GENERAL_SUPERVISOR">مراقب عام</option>
                                            <option value="MAYOR">رئيس البلدية</option>
                                        </Select>
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


            <div className="animate-in fade-in zoom-in-95 duration-500 delay-200">
                {activeTab === 'reports' && (
                    <AttendanceReports
                        workers={workers}
                        areas={areas}
                        month={month}
                        year={year}
                        reportSearchTerm={reportSearchTerm}
                        reportAreaFilter={reportAreaFilter}
                        reportStatusFilter={reportStatusFilter}
                        getWorkerAttendance={getWorkerAttendance}
                        approveAttendance={async (id, status) => {
                            await approveAttendance(id, status);
                            showToast('تم اعتماد السجل بنجاح');
                        }}
                        onReject={async (id) => {
                            if (!confirm('هل أنت متأكد من رفض السجل وإعادته للمراقب العام؟')) return;
                            try {
                                await rejectAttendance(id, 'PENDING_GS');
                                showToast('تم رفض السجل وإعادته للمراقب العام');
                            } catch (err) {
                                console.error(err);
                                showToast('فشل في رفض السجل', '', 'error');
                            }
                        }}
                        onMonthChange={(m, y) => { setMonth(m); setYear(y); }}
                        onSearchChange={setReportSearchTerm}
                        onAreaFilterChange={setReportAreaFilter}
                        onStatusFilterChange={setReportStatusFilter}
                        onExportCSV={handleExportCSV}
                        onBulkApprove={handleBulkApprove}
                    />
                )}
            </div>

            <div className="animate-in fade-in zoom-in-95 duration-500 delay-200">
                {activeTab === 'supervisors' && (
                    <SupervisorSection
                        supervisors={supervisors}
                        areas={areas}
                        searchTerm={searchTerm}
                        onEdit={(s) => {
                            setEditingItem({ type: 'supervisor', data: s });
                            setSelectedAreaIds(s.areas?.map(a => a.id) || []);
                        }}
                        onDelete={handleDeleteSupervisor}
                        onActivate={async (id: string) => {
                            try {
                                await updateUser(id, { isActive: true });
                                showToast('تم تفعيل الحساب بنجاح');
                            } catch (err) {
                                console.error(err);
                                showToast('فشل تفعيل الحساب', '', 'error');
                            }
                        }}
                        onAdd={() => setEditingItem({ type: 'supervisor', data: { id: 'NEW', name: '', username: '', password: '', role: 'SUPERVISOR', areaId: '' } })}
                    />
                )}
            </div>

            <div className="animate-in fade-in zoom-in-95 duration-500 delay-200">
                {activeTab === 'workers' && (
                    <WorkerSection
                        workers={workers}
                        areas={areas}
                        searchTerm={searchTerm}
                        onEdit={(w) => setEditingItem({ type: 'worker', data: w })}
                        onDelete={handleDeleteWorker}
                    />
                )}
            </div>

            <div className="animate-in fade-in zoom-in-95 duration-500 delay-200">
                {activeTab === 'areas' && (
                    <AreaSection
                        areas={areas}
                        workers={workers}
                        searchTerm={searchTerm}
                        isSaving={isSaving}
                        areaForm={areaForm}
                        onFormChange={setAreaForm}
                        onSave={async (e) => {
                            e.preventDefault();
                            setIsSaving(true);
                            try {
                                const trimmedName = areaForm.name.trim();

                                const isDuplicate = areas.some(a =>
                                    a.name.trim().toLowerCase() === trimmedName.toLowerCase() && a.id !== areaForm.id
                                );

                                if (isDuplicate) {
                                    showToast('تنبيه', 'هذا الاسم موجود بالفعل! يرجى اختيار اسم فريد.', 'warning');
                                    setIsSaving(false);
                                    return;
                                }

                                if (areaForm.id) {
                                    await updateArea(areaForm.id, trimmedName);
                                    showToast('تم تحديث المنطقة بنجاح');
                                } else {
                                    await addArea(trimmedName);
                                    showToast('تم إضافة المنطقة بنجاح');
                                }
                                setAreaForm({ name: '' });
                            } catch (err) {
                                console.error(err);
                                showToast('فشل حفظ المنطقة', '', 'error');
                            } finally {
                                setIsSaving(false);
                            }
                        }}
                        onDelete={async (id, count) => {
                            if (count > 0) {
                                showToast('لا يمكن حذف المنطقة', 'تحتوي على عمال. يرجى نقلهم أولاً.', 'error');
                                return;
                            }
                            if (window.confirm('هل أنت متأكد من حذف هذه المنطقة؟')) {
                                try {
                                    await deleteArea(id);
                                    showToast('تم حذف المنطقة بنجاح');
                                } catch (err) {
                                    console.error(err);
                                    showToast('فشل حذف المنطقة', '', 'error');
                                }
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default HRView;
