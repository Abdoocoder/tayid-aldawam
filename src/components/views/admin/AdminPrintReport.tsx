import React from 'react';
import { User, Worker, Area, AuditLog } from '@/context/AttendanceContext';
import { Shield, MapPin, HardHat, History } from 'lucide-react';

interface AdminPrintReportProps {
    type: 'users' | 'workers' | 'areas' | 'logs';
    data: {
        users?: User[];
        workers?: Worker[];
        areas?: Area[];
        logs?: AuditLog[];
    };
    month?: number;
    year?: number;
}

export function AdminPrintReport({ type, data, month, year }: AdminPrintReportProps) {
    const title = {
        users: 'تقرير مستخدمي النظام والصلاحيات',
        workers: 'سجل القوى العاملة الميدانية',
        areas: 'تقرير التقسيمات الإدارية والقطاعات',
        logs: 'سجل العمليات والرقابة الرقمية'
    }[type];

    const [reportId, setReportId] = React.useState('');
    const [reportDate, setReportDate] = React.useState('');
    const [reportTime, setReportTime] = React.useState('');

    React.useEffect(() => {
        setReportId(`ADM-${type.toUpperCase()}-${Date.now().toString().slice(-6)}`);
        setReportDate(new Date().toLocaleDateString('ar-JO'));
        setReportTime(new Date().toLocaleTimeString('ar-JO'));
    }, [type]);

    const icon = {
        users: <Shield className="h-10 w-10 text-slate-800" />,
        workers: <HardHat className="h-10 w-10 text-slate-800" />,
        areas: <MapPin className="h-10 w-10 text-slate-800" />,
        logs: <History className="h-10 w-10 text-slate-800" />
    }[type];

    return (
        <div className="hidden print:block p-10 bg-white text-slate-900 font-sans dir-rtl" style={{ direction: 'rtl' }}>
            {/* Municipality Header */}
            <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
                <div className="text-right space-y-2">
                    <h2 className="text-2xl font-black">المملكة الأردنية الهاشمية</h2>
                    <h2 className="text-xl font-black">بلدية الزرقاء</h2>
                    <h3 className="text-lg font-bold">دائرة الشؤون الصحية والبيئية</h3>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-2 border-2 border-slate-900">
                        {icon}
                    </div>
                    <span className="text-[10px] font-black tracking-widest uppercase">Admin Report</span>
                </div>
                <div className="text-left space-y-1 text-sm font-bold">
                    <p>التاريخ: {reportDate}</p>
                    <p>الوقت: {reportTime}</p>
                    <p>رقم التقرير: {reportId}</p>
                </div>
            </div>

            <div className="text-center mb-12">
                <h1 className="text-3xl font-black mb-4">{title}</h1>
                <p className="text-slate-500 font-bold underline underline-offset-8 decoration-2">
                    {month && year ? `للفترة: ${month} / ${year}` : 'حالة النظام اللحظية'}
                </p>
            </div>

            {/* Content Tables */}
            {type === 'users' && data.users && (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border-2 border-slate-900 p-3 text-right">#</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الاسم الكامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">اسم المستخدم</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الدور الوظيفي</th>
                            <th className="border-2 border-slate-900 p-3 text-right">النطاق الإشرافي</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.users.map((u, i) => (
                            <tr key={u.id}>
                                <td className="border border-slate-300 p-3 text-center font-bold">{i + 1}</td>
                                <td className="border border-slate-300 p-3 font-black">{u.name}</td>
                                <td className="border border-slate-300 p-3 font-mono">{u.username}</td>
                                <td className="border border-slate-300 p-3 font-bold">
                                    {{
                                        'SUPERVISOR': 'مراقب ميداني',
                                        'GENERAL_SUPERVISOR': 'مراقب عام',
                                        'HEALTH_DIRECTOR': 'مدير صحة',
                                        'HR': 'مدير الموارد البشرية',
                                        'INTERNAL_AUDIT': 'مدقق داخلي',
                                        'FINANCE': 'المدير المالي',
                                        'PAYROLL': 'قسم الرواتب',
                                        'MAYOR': 'رئيس بلدية',
                                        'ADMIN': 'مدير نظام'
                                    }[u.role] || u.role}
                                </td>
                                <td className="border border-slate-300 p-3 text-sm">
                                    {u.areaId === 'ALL'
                                        ? 'التحكم الكامل'
                                        : (u.areaId
                                            ? u.areaId.split(',').map(id => data.areas?.find(a => a.id === id)?.name || id).join('، ')
                                            : 'غير محدد')}
                                </td>
                                <td className="border border-slate-300 p-3 text-center">{u.isActive ? 'نشط' : 'معطل'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {type === 'workers' && data.workers && (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border-2 border-slate-900 p-3 text-right">#</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المعرف</th>
                            <th className="border-2 border-slate-900 p-3 text-right">الاسم الكامل</th>
                            <th className="border-2 border-slate-900 p-3 text-right">القطاع</th>
                            <th className="border-2 border-slate-900 p-3 text-center">الأجر اليومي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.workers.map((w, i) => (
                            <tr key={w.id}>
                                <td className="border border-slate-300 p-3 text-center font-bold">{i + 1}</td>
                                <td className="border border-slate-300 p-3 font-mono text-xs">{w.id}</td>
                                <td className="border border-slate-300 p-3 font-black">{w.name}</td>
                                <td className="border border-slate-300 p-3">{data.areas?.find(a => a.id === w.areaId)?.name || 'غير محدد'}</td>
                                <td className="border border-slate-300 p-3 text-center font-bold">{w.dayValue} JOD</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {type === 'areas' && data.areas && (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border-2 border-slate-900 p-3 text-right">#</th>
                            <th className="border-2 border-slate-900 p-3 text-right">اسم القطاع</th>
                            <th className="border-2 border-slate-900 p-3 text-center">عدد العمال</th>
                            <th className="border-2 border-slate-900 p-3 text-right">المعرف الرقمي</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.areas.map((a, i) => (
                            <tr key={a.id}>
                                <td className="border border-slate-300 p-3 text-center font-bold">{i + 1}</td>
                                <td className="border border-slate-300 p-3 font-black">{a.name}</td>
                                <td className="border border-slate-300 p-3 text-center font-bold">
                                    {data.workers?.filter(w => w.areaId === a.id).length || 0}
                                </td>
                                <td className="border border-slate-300 p-3 font-mono text-xs">{a.id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {type === 'logs' && data.logs && (
                <table className="w-full border-collapse text-xs">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border-2 border-slate-900 p-2 text-right">التوقيت</th>
                            <th className="border-2 border-slate-900 p-2 text-right">المستخدم</th>
                            <th className="border-2 border-slate-900 p-2 text-right">الجدول</th>
                            <th className="border-2 border-slate-900 p-2 text-right">العملية</th>
                            <th className="border-2 border-slate-900 p-2 text-right">التفاصيل</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.logs.slice(0, 100).map((l) => (
                            <tr key={l.id}>
                                <td className="border border-slate-300 p-2">{new Date(l.changed_at).toLocaleString('ar-JO')}</td>
                                <td className="border border-slate-300 p-2 font-bold">{l.changed_by}</td>
                                <td className="border border-slate-300 p-2">{l.table_name}</td>
                                <td className="border border-slate-300 p-2">{l.action}</td>
                                <td className="border border-slate-300 p-2 truncate max-w-xs">{JSON.stringify(l.new_data || l.old_data)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Signature Section */}
            <div className="grid grid-cols-2 gap-20 mt-24">
                <div className="text-center space-y-16">
                    <p className="font-black border-b-2 border-slate-900 pb-2 inline-block px-12 text-lg">مدير النظام (Admin)</p>
                    <p className="text-slate-400 font-bold">الختم والتوقيع</p>
                </div>
                <div className="text-center space-y-16">
                    <p className="font-black border-b-2 border-slate-900 pb-2 inline-block px-12 text-lg">مدير الدائرة الصحية</p>
                    <p className="text-slate-400 font-bold">الاسم والتوقيع</p>
                </div>
            </div>

            <div className="mt-32 pt-8 border-t-2 border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">
                    TAYID-ALDAWAM SMART SYSTEM - OFFICIAL ADMINISTRATION REPORT
                </p>
            </div>
        </div>
    );
}
