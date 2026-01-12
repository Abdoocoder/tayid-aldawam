import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { User, Area } from "@/types";
import { Edit2, ShieldCheck, Trash2, UserPlus, Plus, MapPin } from "lucide-react";

interface UsersTabProps {
    users: User[];
    areas: Area[];
    searchTerm: string;
    onEditUser: (user: User) => void;
    onDeleteUser: (id: string) => void;
    onToggleActive: (id: string, currentStatus: boolean) => void;
    onAddUser: () => void;
}

export function UsersTab({ users, areas, searchTerm, onEditUser, onDeleteUser, onToggleActive, onAddUser }: UsersTabProps) {
    return (
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl shadow-indigo-500/10 overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
            <div className="p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                <div className="relative z-10 flex items-center gap-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 -rotate-3 group-hover:rotate-0 transition-transform duration-700">
                        <UserPlus className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">إدارة الصلاحيات</h3>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Access Control & Team Management</p>
                        </div>
                    </div>
                </div>
                <Button
                    className="relative z-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/30 h-16 px-12 rounded-[1.5rem] font-black text-sm gap-5 group transition-all duration-500 hover:-translate-y-1 hover:scale-105 active:scale-95"
                    onClick={onAddUser}
                >
                    <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Plus className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
                    <span className="relative">إضافة مستخدم جديد</span>
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-white/10">
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">المستخدم</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الدور المخصص</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">النطاق الإشرافي</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الحالة</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {users.filter(u =>
                            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.username.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((u) => {
                            const areaNames = u.areaId === 'ALL'
                                ? 'التحكم الكامل'
                                : (u.areaId
                                    ? u.areaId.split(',').map(id => areas.find(a => a.id === id)?.name || id).join('، ')
                                    : "غير محدد");
                            return (
                                <tr key={u.id} className="hover:bg-indigo-50/20 transition-all duration-700 group border-b border-white/5 last:border-0 font-bold">
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-6">
                                            <div className="relative">
                                                <div className={`absolute -inset-1 blur opacity-20 group-hover:opacity-40 transition-opacity duration-1000 ${u.isActive ? 'bg-indigo-500' : 'bg-slate-500'}`} />
                                                <div className="relative w-14 h-14 rounded-2xl bg-white flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-700 shadow-xl border border-white/20 text-lg">
                                                    {u.name.charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 group-hover:text-indigo-900 transition-colors text-base leading-tight">{u.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black font-mono uppercase tracking-[0.1em] mt-1.5 bg-slate-100/50 px-2 py-0.5 rounded-md inline-block">{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <Badge variant="outline" className={`font-black text-[10px] uppercase tracking-widest ring-1 border-none px-4 py-1.5 rounded-xl shadow-sm ${u.role === 'ADMIN' ? 'bg-indigo-600 text-white ring-indigo-500' : 'bg-white text-slate-600 ring-slate-200'} `}>
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
                                        </Badge>
                                        {u.role === 'HR' && u.handledNationality && u.handledNationality !== 'ALL' && (
                                            <div className="mt-2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                                                الجنسية: {u.handledNationality}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex items-center gap-3 text-xs font-black text-slate-500 group-hover:text-indigo-600 transition-colors">
                                            <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-100 transition-colors">
                                                <MapPin className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                            </div>
                                            {areaNames}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl text-[10px] font-black tracking-widest shadow-inner ${u.isActive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-100'} `}>
                                            <div className={`w-2 h-2 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} `}></div>
                                            {u.isActive ? 'نشط بالنظام' : 'حساب معطل'}
                                        </div>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex justify-center items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10 border border-transparent hover:border-white/40 transition-all duration-500"
                                                onClick={() => onEditUser(u)}
                                            >
                                                <Edit2 className="h-4.5 w-4.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-12 w-12 rounded-2xl border border-transparent hover:border-white/40 shadow-sm transition-all duration-500 ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-white hover:shadow-amber-500/10' : 'text-emerald-500 hover:bg-white hover:shadow-emerald-500/10'} `}
                                                onClick={() => onToggleActive(u.id, u.isActive)}
                                            >
                                                <ShieldCheck className="h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-500/10 border border-transparent hover:border-white/40 transition-all duration-500"
                                                onClick={() => onDeleteUser(u.id)}
                                            >
                                                <Trash2 className="h-4.5 w-4.5" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div >
        </div >
    );
}
