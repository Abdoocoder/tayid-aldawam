"use client";

import React from "react";
import { HardHat, Plus, MapPin, Edit2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Worker, Area } from "@/context/AttendanceContext";
import { EmptyState } from "@/components/ui/empty-state";

interface WorkerSectionProps {
    workers: Worker[];
    areas: Area[];
    searchTerm: string;
    onEdit: (worker: Worker | (Partial<Worker> & { id: 'NEW' })) => void;
    onDelete: (id: string) => void;
}

export function WorkerSection({ workers, areas, searchTerm, onEdit, onDelete }: WorkerSectionProps) {
    const filteredWorkers = workers.filter(w => {
        const areaName = areas.find(a => a.id === w.areaId)?.name || "";
        return w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            w.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            areaName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                <div>
                    <CardTitle className="text-lg font-bold">سجل القوى العاملة</CardTitle>
                    <CardDescription>إدارة بيانات العمال الميدانيين وتفاصيل الأجور</CardDescription>
                </div>
                <Button
                    className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100"
                    onClick={() => onEdit({ id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 })}
                >
                    <Plus className="h-4 w-4 ml-2" />
                    إضافة عامل جديد
                </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                {filteredWorkers.length === 0 ? (
                    <EmptyState
                        icon={HardHat}
                        title="لا يوجد عمال"
                        description={searchTerm ? "لم نجد عمالاً يطابقون بحثك" : "قم بإضافة العمال لبدء تسجيل الحضور"}
                        action={!searchTerm && (
                            <Button variant="outline" onClick={() => onEdit({ id: 'NEW', name: '', areaId: '', dayValue: 0, baseSalary: 0 })}>
                                إضافة أول عامل
                            </Button>
                        )}
                    />
                ) : (
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4 border-b">الرقم التعريفي</th>
                                <th className="p-4 border-b">اسم العامل</th>
                                <th className="p-4 border-b">القطاع / المنطقة</th>
                                <th className="p-4 border-b text-center">الأجر اليومي</th>
                                <th className="p-4 border-b text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredWorkers.map(w => (
                                <tr key={w.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="p-4 font-mono text-[11px] text-gray-400 font-bold tracking-tighter">#{w.id}</td>
                                    <td className="p-4 font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{w.name}</td>
                                    <td className="p-4">
                                        <Badge variant="outline" className="bg-blue-50/30 text-blue-700 border-blue-100/50">
                                            <MapPin className="h-3 w-3 ml-1 text-blue-300" />
                                            {areas.find(a => a.id === w.areaId)?.name || w.areaId}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="font-black text-green-700 font-mono">{w.dayValue}</span>
                                            <span className="text-[9px] text-gray-400 font-bold uppercase">د.أ / يوم</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => onEdit(w)}>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => onDelete(w.id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}
