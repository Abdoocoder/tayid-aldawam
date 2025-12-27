import React, { useState, useMemo } from "react";
import {
    Users,
    MapPin,
    Save,
    Loader2,
    HardHat,
    ShieldCheck,
    AlertCircle,
    X,
    FileText,
    TrendingUp,
    Search,
    Menu
} from "lucide-react";
import { useAttendance, User, Worker, UserRole } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { MobileNav, NavItem } from "../ui/mobile-nav";

// Modular Components
import { WorkerSection } from "./hr/WorkerSection";
import { SupervisorSection } from "./hr/SupervisorSection";
import { AreaSection } from "./hr/AreaSection";
import { AttendanceReports } from "./hr/AttendanceReports";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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

    const { signUp, appUser } = useAuth();
    const { showToast } = useToast();

    // UI State
    const [activeTab, setActiveTab] = useState<'reports' | 'supervisors' | 'workers' | 'areas'>('reports');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
    const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>([]);
    const [areaForm, setAreaForm] = useState<{ id?: string, name: string }>({ name: '' });
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Filter states for reports
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [reportSearchTerm, setReportSearchTerm] = useState('');
    const [reportAreaFilter, setReportAreaFilter] = useState('ALL');
    const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'PENDING_GS' | 'PENDING_HEALTH' | 'PENDING_HR' | 'PENDING_FINANCE' | 'APPROVED'>('PENDING_HR');

    const filteredUsers = useMemo(() => users.filter(u => u.role !== 'ADMIN'), [users]);

    // Stats calculations
    const totalWorkersCount = workers.length;
    const activeUsersCount = filteredUsers.length;
    const totalSectorsCount = areas.length;

    // Completion rate for current month
    const completionRate = useMemo(() => {
        if (workers.length === 0) return 0;
        const currentMonthEntries = workers.filter((w: Worker) => !!getWorkerAttendance(w.id, month, year)).length;
        return totalWorkersCount > 0 ? Math.round((currentMonthEntries / totalWorkersCount) * 100) : 0;
    }, [workers, month, year, getWorkerAttendance, totalWorkersCount]);

    const navItems: NavItem<'reports' | 'supervisors' | 'workers' | 'areas'>[] = [
        { id: 'reports', label: 'التقارير والاستحقاقات', icon: FileText },
        { id: 'supervisors', label: 'إدارة المراقبين', icon: ShieldCheck },
        { id: 'workers', label: 'قاعدة بيانات العمال', icon: HardHat },
        { id: 'areas', label: 'توزيع القطاعات', icon: MapPin },
    ];

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
                    data.role || 'SUPERVISOR',
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
        if (appUser?.id === id) {
            showToast('تنبيه', 'لا يمكنك حذف حسابك الشخصي', 'warning');
            return;
        }
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
        const headers = ["الرقم", "الاسم", "القطاع", "أيام عادية", "إضافي عادي (x0.5)", "إضافي عطل (x1.0)", "أيام الأعياد (x1.0)", "الإجمالي"];
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
        <>
            <MobileNav<'reports' | 'supervisors' | 'workers' | 'areas'>
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                items={navItems}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                user={{ name: appUser?.name || "مسؤول HR", role: "موظف الموارد البشرية" }}
            />

            <div className="space-y-6 pb-24">
                {/* Header section - Sticky & Premium Glass */}
                <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-white/60 backdrop-blur-xl border-b border-white/40 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="max-w-7xl mx-auto flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg shadow-purple-500/20">
                                <Users className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight">إدارة الموارد البشرية</h2>
                                    <Badge className="bg-purple-50 text-purple-700 border-purple-100 text-[9px] font-black uppercase tracking-tighter">Certified</Badge>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">نظام تأييد الدوام الذكي</p>
                            </div>
                        </div>

                        {/* Navigation Tabs - Desktop */}
                        <div className="hidden md:flex items-center bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50 backdrop-blur-sm shadow-inner">
                            {navItems.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as 'reports' | 'supervisors' | 'workers' | 'areas')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${activeTab === tab.id
                                        ? "bg-white text-purple-700 shadow-sm ring-1 ring-slate-200/50"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-white/50"
                                        }`}
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* Mobile Menu Trigger */}
                        <button
                            onClick={() => setIsMobileNavOpen(true)}
                            className="md:hidden p-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 shadow-sm active:scale-95 transition-all"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

                {/* Tab-Specific Global Search Bar - Refined for mobile */}
                {activeTab !== 'reports' && (
                    <div className="relative w-full px-1 animate-in fade-in slide-in-from-bottom-2 duration-700 print:hidden">
                        <div className="relative group">
                            <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-purple-600 transition-colors" />
                            <Input
                                placeholder={`بحث في ${activeTab === 'workers' ? 'العمال' : activeTab === 'supervisors' ? 'المستخدمين' : 'المناطق'}...`}
                                className="pr-12 h-12 bg-white/60 backdrop-blur-md border-slate-100 focus:border-purple-500 rounded-2xl shadow-sm shadow-purple-900/5 text-base"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {/* Quick Stats Grid - Responsive & Premium */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 px-1 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both print:hidden">
                    {[
                        {
                            label: 'إجمالي العمال',
                            value: totalWorkersCount,
                            unit: 'عامل',
                            icon: Users,
                            gradient: 'from-blue-600 to-blue-700',
                            desc: 'قاعدة البيانات الكلية'
                        },
                        {
                            label: 'المستخدمين',
                            value: activeUsersCount,
                            unit: 'حساب',
                            icon: ShieldCheck,
                            gradient: 'from-purple-600 to-purple-700',
                            desc: 'الطاقم الإداري والرقابي'
                        },
                        {
                            label: 'القطاعات',
                            value: totalSectorsCount,
                            unit: 'منطقة',
                            icon: MapPin,
                            gradient: 'from-amber-600 to-amber-700',
                            desc: 'توزيع العمل الميداني'
                        },
                        {
                            label: 'الإنجاز الشهرى',
                            value: completionRate,
                            unit: '%',
                            icon: TrendingUp,
                            gradient: 'from-emerald-600 to-emerald-700',
                            desc: 'نسبة التغطية الحالية'
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

                {/* Editing/Adding Form Overlay (Simple inline version) */}
                {editingItem && (
                    <Card className="border-2 border-purple-200 shadow-lg animate-in zoom-in-95 duration-200 print:hidden">
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
                                                <option value="HEALTH_DIRECTOR">مدير الدائرة الصحية</option>
                                                <option value="HR">الموارد البشرية</option>
                                                <option value="FINANCE">المالية</option>
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


                <div className="animate-in fade-in zoom-in-95 duration-500 delay-200 print:contents">
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

                <div className="animate-in fade-in zoom-in-95 duration-500 delay-200 print:hidden">
                    {activeTab === 'supervisors' && (
                        <SupervisorSection
                            supervisors={filteredUsers}
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

                <div className="animate-in fade-in zoom-in-95 duration-500 delay-200 print:hidden">
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

                <div className="animate-in fade-in zoom-in-95 duration-500 delay-200 print:hidden">
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
        </>
    );
};

export default HRView;
