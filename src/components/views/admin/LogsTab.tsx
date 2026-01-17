import { Badge } from "@/components/ui/badge";
import { AuditLog } from "@/types";
import { History, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { exportToExcel, formatAuditLogsForExport } from "@/lib/export-utils";

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
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl shadow-slate-500/10 overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
            <div className="p-10 border-b border-white/10 flex flex-col lg:flex-row justify-between items-center gap-8 bg-gradient-to-br from-slate-600/10 via-transparent to-transparent relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                <div className="relative z-10 flex items-center gap-8">
                    <div className="bg-gradient-to-br from-slate-700 to-slate-900 p-5 rounded-[2rem] text-white shadow-xl shadow-slate-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                        <History className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">سجل الرقابة والنظام</h3>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 rounded-full bg-slate-600 animate-pulse" />
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Full System Audit & Activity Tracking</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 relative z-10">
                    <Button
                        variant="outline"
                        className="h-14 px-6 rounded-2xl border-slate-200 bg-white/40 backdrop-blur-md text-slate-600 hover:bg-slate-800 hover:text-white font-black text-xs gap-3 transition-all duration-500 hover:shadow-xl group"
                        onClick={() => {
                            const formatted = formatAuditLogsForExport(filteredLogs);
                            exportToExcel(formatted, 'سجل_رقابة_النظام', 'AuditLogs');
                        }}
                    >
                        <FileSpreadsheet className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        تصدير السجل
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto relative z-10">
                    <div className="relative w-full sm:w-64 group">
                        <Input
                            placeholder="تصفية حسب المسئول..."
                            className="h-14 bg-white/40 border-white/20 focus:border-indigo-500 shadow-xl rounded-2xl text-sm font-black transition-all duration-500 backdrop-blur-md"
                            value={searchTerm}
                            onChange={e => onSearchChange(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select
                            className="h-14 px-6 bg-white/40 border border-white/20 focus:border-indigo-500 rounded-2xl shadow-xl text-xs font-black text-slate-600 outline-none transition-all cursor-pointer backdrop-blur-md appearance-none"
                            value={actionFilter}
                            onChange={e => onActionFilterChange(e.target.value)}
                        >
                            <option value="ALL">جميع العمليات</option>
                            <option value="INSERT">إضافة (INSERT)</option>
                            <option value="UPDATE">تعديل (UPDATE)</option>
                            <option value="DELETE">حذف (DELETE)</option>
                        </select>
                        <select
                            className="h-14 px-6 bg-white/40 border border-white/20 focus:border-indigo-500 rounded-2xl shadow-xl text-xs font-black text-slate-600 outline-none transition-all cursor-pointer backdrop-blur-md appearance-none"
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
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-white/10">
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">التوقيت</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">المستخدم</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">العملية</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">الجدول المتأثر</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">التغييرات الجوهرية</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {filteredLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/20 transition-all duration-700 group border-b border-white/5 last:border-0 font-bold">
                                <td className="px-10 py-8">
                                    <div className="text-[11px] font-black font-mono text-slate-400 group-hover:text-slate-600 transition-colors bg-slate-100/50 px-3 py-1.5 rounded-xl border border-transparent group-hover:border-slate-200 inline-block">
                                        {new Date(log.changed_at).toLocaleString('ar-JO')}
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-[1.25rem] bg-white flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 shadow-xl border border-white/20 text-sm">
                                            {log.changed_by?.charAt(0) || 'S'}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-black text-slate-800 text-sm leading-tight">{log.changed_by || 'نظام تلقائي'}</span>
                                            <span className="text-[9px] text-slate-400 font-black uppercase mt-1">System Operator</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-center text-center">
                                    <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-widest px-4 py-2 rounded-2xl border-none ring-1 shadow-sm ${log.action === 'INSERT' ? 'bg-emerald-600 text-white ring-emerald-500' :
                                        log.action === 'UPDATE' ? 'bg-indigo-600 text-white ring-indigo-500' :
                                            'bg-rose-600 text-white ring-rose-500'} `}>
                                        {log.action}
                                    </Badge>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors" />
                                        {log.table_name}
                                    </div>
                                </td>
                                <td className="px-10 py-8">
                                    <div className="max-w-md overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-mono text-slate-400 bg-slate-900/5 p-4 rounded-2xl border border-white/20 shadow-inner group-hover:bg-white group-hover:text-slate-600 transition-all duration-700">
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
