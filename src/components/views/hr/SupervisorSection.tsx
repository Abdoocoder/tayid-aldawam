"use client";

import React from "react";
import { Users, Plus, MapPin, Edit2, Trash2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Area } from "@/context/AttendanceContext";
import { EmptyState } from "@/components/ui/empty-state";

interface SupervisorSectionProps {
    supervisors: User[];
    areas: Area[];
    searchTerm: string;
    onEdit: (supervisor: User) => void;
    onDelete: (id: string) => void;
    onActivate?: (id: string) => void;
    onAdd: () => void;
}

export function SupervisorSection({ supervisors, areas, searchTerm, onEdit, onDelete, onActivate, onAdd }: SupervisorSectionProps) {
    const filteredSupervisors = supervisors.filter(s => {
        const areaName = s.areaId === 'ALL' ? 'كل المناطق' : (areas.find(a => a.id === s.areaId)?.name || "");
        const roleLabel = {
            'SUPERVISOR': 'مراقب ميداني',
            'GENERAL_SUPERVISOR': 'مراقب عام',
            'HEALTH_DIRECTOR': 'مدير الدائرة الصحية',
            'HR': 'موارد بشرية',
            'FINANCE': 'مالية',
            'MAYOR': 'رئيس بلدية',
            'ADMIN': 'مدير نظام'
        }[s.role] || s.role;

        return s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            roleLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
            areaName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 bg-white p-6">
                <div>
                    <CardTitle className="text-lg font-bold">إدارة حسابات المستخدمين</CardTitle>
                    <CardDescription>التحكم في أدوار الموظفين وصلاحيات الوصول للنظام</CardDescription>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-100" onClick={onAdd}>
                    <Plus className="h-4 w-4 ml-2" />
                    مستخدم جديد
                </Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
                {filteredSupervisors.length === 0 ? (
                    <EmptyState
                        icon={Users}
                        title="لا يوجد مستخدمين"
                        description={searchTerm ? "لم نجد مستخدمين يطابقون بحثك" : "ابدأ بإضافة أول مستخدم للنظام"}
                        action={!searchTerm && (
                            <Button variant="outline" onClick={onAdd}>
                                إضافة أول مستخدم
                            </Button>
                        )}
                    />
                ) : (
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4 border-b">اسم الموظف</th>
                                <th className="p-4 border-b">الدور الوظيفي</th>
                                <th className="p-4 border-b">اسم المستخدم</th>
                                <th className="p-4 border-b">نطاق الإشراف</th>
                                <th className="p-4 border-b text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredSupervisors.map(s => {
                                const roleConfig = {
                                    'SUPERVISOR': { label: 'مراقب ميداني', color: 'blue' },
                                    'GENERAL_SUPERVISOR': { label: 'مراقب عام', color: 'indigo' },
                                    'HEALTH_DIRECTOR': { label: 'مدير الدائرة الصحية', color: 'emerald' },
                                    'HR': { label: 'موارد بشرية', color: 'purple' },
                                    'FINANCE': { label: 'مالية', color: 'emerald' },
                                    'MAYOR': { label: 'رئيس بلدية', color: 'amber' },
                                    'ADMIN': { label: 'مدير نظام', color: 'red' }
                                }[s.role] || { label: s.role, color: 'gray' };

                                return (
                                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{s.name}</td>
                                        <td className="p-4">
                                            <Badge variant="secondary" className={`bg-${roleConfig.color}-50 text-${roleConfig.color}-700 border-${roleConfig.color}-100 font-bold`}>
                                                {roleConfig.label}
                                            </Badge>
                                        </td>
                                        <td className="p-4 text-sm text-gray-500 font-mono italic">{s.username}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1.5">
                                                {s.areaId === 'ALL' ? (
                                                    <Badge variant="outline" className="flex items-center gap-1 w-fit bg-red-50/50 text-red-700 border-red-100">
                                                        <MapPin className="h-3 w-3" />
                                                        كل المناطق
                                                    </Badge>
                                                ) : (
                                                    <>
                                                        {s.areaId && (
                                                            <Badge variant="outline" className="flex items-center gap-1 w-fit bg-blue-50/50 text-blue-700 border-blue-100">
                                                                <MapPin className="h-3 w-3" />
                                                                {areas.find(a => a.id === s.areaId)?.name || s.areaId}
                                                            </Badge>
                                                        )}
                                                        {s.areas?.map(area => (
                                                            <Badge key={area.id} variant="outline" className="flex items-center gap-1 w-fit bg-purple-50/50 text-purple-700 border-purple-100">
                                                                <MapPin className="h-3 w-3" />
                                                                {area.name}
                                                            </Badge>
                                                        ))}
                                                        {(!s.areaId && (!s.areas || s.areas.length === 0)) && (
                                                            <span className="text-gray-400 text-xs italic">غير محدد</span>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                {!s.isActive && (
                                                    <Button variant="ghost" size="sm" className="h-8 px-2 text-green-600 hover:bg-green-50 text-xs font-bold" onClick={() => onActivate?.(s.id)}>
                                                        تفعيل
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50" onClick={() => onEdit(s)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50" onClick={() => onDelete(s.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    );
}
