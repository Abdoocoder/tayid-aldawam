import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/context/AttendanceContext";
import { History } from "lucide-react";
import { Input } from "@/components/ui/input";

interface LogsTabProps {
    logs: AuditLog[];
    searchTerm: string;
    onSearchChange: (value: string) => void;
    tableFilter: string;
    onTableFilterChange: (value: string) => void;
    actionFilter: string;
    onActionFilterChange: (value: string) => void;
}

export function LogsTab({ logs, searchTerm, onSearchChange, tableFilter, onTableFilterChange, actionFilter, onActionFilterChange }: LogsTabProps) {
    const filteredLogs = logs.filter(log => {
        const matchesSearch = !searchTerm || (log.changed_by || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesTable = tableFilter === 'ALL' || log.table_name === tableFilter;
        const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
        return matchesSearch && matchesTable && matchesAction;
    });

    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
            <div className="p-8 border-b border-slate-100/50 flex flex-col lg:flex-row justify-between items-center gap-6 bg-gradient-to-r from-slate-50/50 to-transparent">
                <div className="flex items-center gap-6">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 p-4 rounded-2xl text-slate-600 shadow-inner">
                        <History className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">سجل الرقابة والنظام</h3>
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Full System Audit & Activity Tracking</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Input
                            placeholder="تصفية حسب المسئول..."
                            className="h-12 bg-white/60 border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm text-sm font-bold"
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                    <select
                        className="h-12 px-4 bg-white/60 border border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm text-sm font-bold text-slate-600 outline-none transition-all cursor-pointer"
                        value={actionFilter}
                        onChange={e => onActionFilterChange(e.target.value)}
                    >
                        <option value="ALL">جميع العمليات</option>
                        <option value="INSERT">إضافة (INSERT)</option>
                        <option value="UPDATE">تعديل (UPDATE)</option>
                        <option value="DELETE">حذف (DELETE)</option>
                    </select>
                    <select
                        className="h-12 px-4 bg-white/60 border border-slate-200 focus:border-indigo-500 rounded-2xl shadow-sm text-sm font-bold text-slate-600 outline-none transition-all cursor-pointer"
                        value={tableFilter}
                        onChange={e => onTableFilterChange(e.target.value)}
                    >
                        <option value="ALL">جميع الجداول</option>
                        <option value="workers">العمال (Workers)</option>
                        <option value="users">المستخدمين (Users)</option>
                        <option value="attendance_records">الحضور (Attendance)</option>
                        <option value="areas">القطاعات (Areas)</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التوقيت</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">العملية</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الجدول المتأثر</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التغييرات الجوهرية</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                <td className="px-8 py-6">
                                    <div className="text-[11px] font-black font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                                        {new Date(log.changed_at).toLocaleString('ar-JO')}
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm text-xs">
                                            {log.changed_by?.charAt(0) || 'S'}
                                        </div>
                                        <span className="font-black text-slate-700 text-sm">{log.changed_by || 'نظام تلقائي'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg ${log.action === 'INSERT' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        log.action === 'UPDATE' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            'bg-rose-50 text-rose-700 border-rose-100'} `}>
                                        {log.action}
                                    </Badge>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{log.table_name}</div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-[10px] font-mono text-slate-400 bg-slate-50 p-2.5 rounded-xl border border-slate-100/50 shadow-inner group-hover:bg-white group-hover:text-slate-600 transition-all">
                                        {JSON.stringify(log.new_data)}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-[10%] text-center text-slate-400 font-black italic text-lg opacity-20">
                                    لا توجد سجلات مطابقة
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
