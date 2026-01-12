import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { Area, Worker, User } from "@/types";
import { MapPin, Plus, Trash2, Edit2, Users, HardHat } from "lucide-react";

interface AreasTabProps {
    areas: Area[];
    workers: Worker[];
    users: User[];
    onEditArea: (area: Area) => void;
    onDeleteArea: (id: string) => void;
    onAddArea: () => void;
}

export function AreasTab({ areas, workers, users, onEditArea, onDeleteArea, onAddArea }: AreasTabProps) {
    return (
        <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] border border-white/20 shadow-2xl shadow-indigo-500/10 overflow-hidden animate-in slide-in-from-bottom-12 duration-1000">
            <div className="p-10 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-8 bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full -mr-32 -mt-32 blur-3xl" />

                <div className="relative z-10 flex items-center gap-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 rotate-3 group-hover:rotate-0 transition-transform duration-700">
                        <MapPin className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">إدارة القطاعات</h3>
                        <div className="flex items-center gap-2 mt-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                            <p className="text-[11px] text-slate-500 font-black uppercase tracking-[0.2em]">Organizational Boundaries & Area Management</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl shadow-indigo-500/30 h-16 px-10 rounded-[1.5rem] font-black text-sm gap-5 group transition-all duration-500 hover:-translate-y-1 hover:scale-105 active:scale-95"
                        onClick={onAddArea}
                    >
                        <div className="absolute inset-0 bg-white/20 rounded-[1.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus className="h-6 w-6 group-hover:rotate-180 transition-transform duration-700" />
                        إضافة قطاع جديد
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-10">
                {areas.map((area) => {
                    const areaWorkers = workers.filter(w => w.areaId === area.id);
                    const areaSupervisors = users.filter(u => u.areaId === area.id || u.areas?.some(a => a.id === area.id));

                    return (
                        <div key={area.id} className="bg-white/60 backdrop-blur-md border border-white/80 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-indigo-500/10 transition-colors" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="bg-indigo-50 text-indigo-600 p-3 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-sm">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all"
                                            onClick={() => onEditArea(area)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-white shadow-sm transition-all"
                                            onClick={() => onDeleteArea(area.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <h4 className="text-xl font-black text-slate-900 mb-6 truncate">{area.name}</h4>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 group-hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <HardHat className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">العمال</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-700">{areaWorkers.length}</p>
                                    </div>
                                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100/50 group-hover:bg-white transition-colors">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Users className="h-3.5 w-3.5 text-violet-500" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">الإشراف</span>
                                        </div>
                                        <p className="text-xl font-black text-slate-700">{areaSupervisors.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sector Code</span>
                                <Badge variant="outline" className="font-mono text-[10px] border-slate-200 text-slate-400 bg-slate-50 rounded-lg">
                                    {area.id.substring(0, 8)}
                                </Badge>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
