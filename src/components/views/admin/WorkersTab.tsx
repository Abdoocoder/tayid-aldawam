import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Worker, Area } from "@/context/AttendanceContext";
import { Edit2, HardHat, Plus, Trash2, Printer, MapPin } from "lucide-react";

interface WorkersTabProps {
    workers: Worker[];
    areas: Area[];
    searchTerm: string;
    onEditWorker: (worker: Worker) => void;
    onDeleteWorker: (id: string) => void;
    onAddWorker: () => void;
}

export function WorkersTab({ workers, areas, searchTerm, onEditWorker, onDeleteWorker, onAddWorker }: WorkersTabProps) {
    return (
        <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-2xl shadow-slate-200/40 overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
            <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row justify-between items-center gap-6 bg-gradient-to-r from-blue-50/30 to-transparent">
                <div className="flex items-center gap-6">
                    <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-4 rounded-2xl text-blue-600 shadow-inner">
                        <HardHat className="h-7 w-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">الكوادر العمالية</h3>
                        <p className="text-xs text-slate-500 font-black uppercase tracking-widest mt-1">Workforce Management & Area Assignment</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="h-12 px-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50 font-black text-xs gap-2.5 transition-all"
                        onClick={() => window.print()}
                    >
                        <Printer className="h-4 w-4" />
                        نسخة ورقية
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 h-12 px-8 rounded-2xl font-black text-sm gap-3 group transition-all duration-500 hover:-translate-y-0.5"
                        onClick={onAddWorker}
                    >
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        إضافة عامل جديد
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100/50">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">المعرف (ID)</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">الاسم الكامل</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">القطاع / الحي</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">الأجر اليومي</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">التحكم</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {workers.filter(w => {
                            const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                            return w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                areaName.toLowerCase().includes(searchTerm.toLowerCase());
                        }).map((w) => {
                            const areaName = areas.find(a => a.id === w.areaId)?.name || "غير محدد";
                            return (
                                <tr key={w.id} className="hover:bg-blue-50/30 transition-all duration-500 group border-b border-slate-50 last:border-0 font-bold">
                                    <td className="px-8 py-6">
                                        <span className="bg-slate-100 text-slate-500 px-3.5 py-1 rounded-xl font-mono text-[10px] font-black group-hover:bg-blue-100 group-hover:text-blue-600 transition-all duration-500">
                                            #{w.id}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="font-black text-slate-900 group-hover:text-blue-800 transition-colors text-sm">{w.name}</div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <Badge variant="secondary" className="bg-white text-slate-600 border border-slate-100/50 font-black text-[10px] px-2.5 shadow-sm group-hover:shadow-md transition-all">
                                            <MapPin className="h-3.5 w-3.5 ml-1.5 text-blue-400 group-hover:text-blue-600 transition-colors" />
                                            {areaName}
                                        </Badge>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className="text-sm font-black text-slate-900 group-hover:text-blue-700 transition-colors">{w.dayValue} <span className="text-[10px] text-slate-400">د.أ</span></div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex justify-center items-center gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 hover:shadow-sm transition-all duration-300"
                                                onClick={() => onEditWorker(w)}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                                                onClick={() => onDeleteWorker(w.id)}
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
