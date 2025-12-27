import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Area } from "@/context/AttendanceContext";
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
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
            <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-indigo-50/30 to-transparent">
                <div className="flex items-center gap-6">
                    <div className="bg-gradient-to-br from-indigo-100 to-violet-100 p-4 rounded-2xl text-indigo-600 shadow-inner">
                        <UserPlus className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">إدارة الصلاحيات</h3>
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Access Control & Team Management</p>
                    </div>
                </div>
                <Button
                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-200 h-14 px-10 rounded-2xl font-black text-sm gap-4 group transition-all duration-500 hover:-translate-y-0.5"
                    onClick={onAddUser}
                >
                    <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                    إضافة مستخدم جديد
                </Button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المستخدم</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الدور</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">النطاق الإشرافي</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الحالة</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التحكم</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {users.filter(u =>
                            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.username.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((u) => {
                            const areaName = u.areaId === 'ALL' ? 'التحكم الكامل' : (areas.find(a => a.id === u.areaId)?.name || "غير محدد");
                            return (
                                <tr key={u.id} className="hover:bg-indigo-50/30 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all duration-500 shadow-sm">
                                                {u.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-900 group-hover:text-indigo-800 transition-colors text-sm">{u.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black font-mono uppercase tracking-tighter">{u.username}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <Badge variant="outline" className={`font-black text-[9px] uppercase tracking-widest ring-1 px-2.5 py-0.5 ${u.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-700 ring-indigo-100/50 border-indigo-200' : 'bg-slate-50 text-slate-600 ring-slate-100'} `}>
                                            {u.role}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2.5 text-[11px] font-black text-slate-500 group-hover:text-indigo-600 transition-colors">
                                            <MapPin className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                            {areaName}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-black tracking-widest ${u.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' : 'bg-amber-50 text-amber-700 border border-amber-100/50'} `}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'} `}></span>
                                            {u.isActive ? 'نشط' : 'معطل'}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:shadow-sm transition-all duration-300"
                                                onClick={() => onEditUser(u)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className={`h-10 w-10 rounded-xl transition-all duration-300 ${u.isActive ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50' : 'text-emerald-500 hover:bg-emerald-50'} `}
                                                onClick={() => onToggleActive(u.id, u.isActive)}
                                            >
                                                <ShieldCheck className="h-4.5 w-4.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                                                onClick={() => onDeleteUser(u.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
