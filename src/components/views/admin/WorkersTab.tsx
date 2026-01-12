import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Worker, Area } from "@/types";
import { Edit2, HardHat, Plus, Trash2, Printer, MapPin } from "lucide-react";

interface WorkersTabProps {
    workers: Worker[];
    areas: Area[];
    searchTerm: string;
    nationalityFilter: string;
    onNationalityFilterChange: (val: string) => void;
    onEditWorker: (worker: Worker) => void;
    onDeleteWorker: (id: string) => void;
    onAddWorker: () => void;
}

export function WorkersTab({ workers, areas, searchTerm, nationalityFilter, onNationalityFilterChange, onEditWorker, onDeleteWorker, onAddWorker }: WorkersTabProps) {
    return (
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl shadow-blue-500/10 overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
            <div className="p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 bg-gradient-to-br from-blue-600/10 via-transparent to-transparent relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                <div className="relative z-10 flex items-center gap-8">
                    <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                        <HardHat className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">الكوادر العمالية</h3>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Workforce Management & Area Assignment</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <Button
                        variant="outline"
                        className="h-14 px-8 rounded-2xl border-white/40 bg-white/40 backdrop-blur-md text-slate-600 hover:bg-white hover:text-blue-600 font-black text-xs gap-3 transition-all duration-500 hover:shadow-xl shadow-blue-500/5 group"
                        onClick={() => window.print()}
                    >
                        <Printer className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        نسخة ورقية
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-2xl shadow-blue-500/30 h-16 px-10 rounded-[1.5rem] font-black text-sm gap-5 group transition-all duration-500 hover:-translate-y-1 hover:scale-105 active:scale-95"
                        onClick={onAddWorker}
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
                        إضافة عامل جديد
                    </Button>
                </div>
            </div>

            <div className="px-10 py-4 bg-slate-50/50 border-b border-white/10 flex justify-end">
                <div className="w-48">
                    <select
                        id="admin-worker-nationality-filter"
                        name="adminWorkerNationalityFilter"
                        aria-label="تصفية عمال النظام حسب الجنسية"
                        className="w-full h-10 bg-white border border-slate-200 rounded-xl px-3 text-sm font-black text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={nationalityFilter}
                        onChange={(e) => onNationalityFilterChange(e.target.value)}
                    >
                        <option value="ALL">جميع الجنسيات</option>
                        <option value="أردني">أردني</option>
                        <option value="مصري">مصري</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right">
                    <thead>
                        <tr className="bg-slate-50/30 border-b border-white/10">
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">المعرف (ID)</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">الاسم الكامل</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">القطاع / الحي</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الأجر اليومي</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">الجنسية</th>
                            <th className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">التحكم</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {workers.filter(w => {
                            const areaName = areas.find(a => a.id === w.areaId)?.name || "";
                            return (w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                areaName.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                (nationalityFilter === "ALL" || w.nationality === nationalityFilter);
                        }).map((w) => {
                            const areaName = areas.find(a => a.id === w.areaId)?.name || "غير محدد";
                            return (
                                <tr key={w.id} className="hover:bg-blue-50/20 transition-all duration-700 group border-b border-white/5 last:border-0 font-bold">
                                    <td className="px-10 py-8">
                                        <span className="bg-white/60 text-slate-500 px-4 py-1.5 rounded-xl font-mono text-[11px] font-black group-hover:bg-blue-600 group-hover:text-white transition-all duration-700 shadow-sm border border-white/20 group-hover:shadow-blue-500/20">
                                            #{w.id}
                                        </span>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="font-black text-slate-900 group-hover:text-blue-900 transition-colors text-base leading-tight">{w.name}</div>
                                        <div className="text-[10px] text-slate-400 font-bold mt-1 bg-slate-100/50 px-2 py-0.5 rounded-md inline-block">عامل ميداني</div>
                                    </td>
                                    <td className="px-10 py-8 text-right">
                                        <Badge variant="secondary" className="bg-white/80 text-slate-600 border border-white ring-1 ring-slate-100 font-black text-[10px] px-3 py-1.5 shadow-sm group-hover:shadow-xl group-hover:shadow-blue-500/10 group-hover:ring-blue-100 transition-all duration-500">
                                            <MapPin className="h-4 w-4 ml-2 text-blue-400 group-hover:text-blue-600 transition-colors" />
                                            {areaName}
                                        </Badge>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <div className="text-lg font-black text-slate-900 group-hover:text-blue-800 transition-colors flex items-center justify-center gap-2">
                                            <span>{w.dayValue}</span>
                                            <span className="text-[11px] text-slate-400 opacity-60">JOD / DAY</span>
                                        </div>
                                    </td>
                                    <td className="px-10 py-8 text-center">
                                        <Badge variant="outline" className={`font-black text-[10px] px-3 py-1.5 ${w.nationality === 'أردني' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                            {w.nationality}
                                        </Badge>
                                    </td>
                                    <td className="px-10 py-8">
                                        <div className="flex justify-center items-center gap-3">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-xl hover:shadow-blue-500/10 border border-transparent hover:border-white/40 transition-all duration-500"
                                                onClick={() => onEditWorker(w)}
                                            >
                                                <Edit2 className="h-4.5 w-4.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-12 w-12 rounded-2xl text-slate-400 hover:text-rose-600 hover:bg-white hover:shadow-xl hover:shadow-rose-500/10 border border-transparent hover:border-white/40 transition-all duration-500"
                                                onClick={() => onDeleteWorker(w.id)}
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
            </div>
        </div>
    );
}
