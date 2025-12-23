"use client";

import React from "react";
import { MapPin, Plus, Edit2, Trash2, Save, X, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Area, Worker } from "@/context/AttendanceContext";

interface AreaSectionProps {
    areas: Area[];
    workers: Worker[];
    searchTerm: string;
    isSaving: boolean;
    areaForm: { id?: string; name: string };
    onFormChange: (form: { id?: string; name: string }) => void;
    onSave: (e: React.FormEvent) => void;
    onDelete: (id: string, workerCount: number) => void;
}

export function AreaSection({
    areas,
    workers,
    searchTerm,
    isSaving,
    areaForm,
    onFormChange,
    onSave,
    onDelete
}: AreaSectionProps) {
    const filteredAreas = areas.filter(a =>
        a.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 h-fit border-none shadow-sm">
                <CardHeader className="bg-white border-b border-gray-100 p-6">
                    <CardTitle className="text-lg font-bold">{areaForm.id ? 'تعديل منطقة' : 'إضافة منطقة جديدة'}</CardTitle>
                    <CardDescription>تعريف قطاعات العمل الجديدة في النظام</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                    <form onSubmit={onSave} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400">اسم المنطقة / القطاع</label>
                            <Input
                                value={areaForm.name}
                                onChange={e => onFormChange({ ...areaForm, name: e.target.value })}
                                placeholder="مثلاً: القطاع الشمالي"
                                required
                                className="bg-gray-50/50"
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700" disabled={isSaving}>
                                {isSaving ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : <Save className="h-4 w-4 ml-2" />}
                                حفظ المنطقة
                            </Button>
                            {areaForm.id && (
                                <Button type="button" variant="outline" onClick={() => onFormChange({ name: '' })}>إلغاء</Button>
                            )}
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100 p-6">
                    <CardTitle className="text-lg font-bold">قائمة المناطق والقطاعات</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead className="bg-gray-50/80 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th className="p-4 border-b">اسم المنطقة</th>
                                <th className="p-4 border-b">عدد العمال</th>
                                <th className="p-4 border-b text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {filteredAreas.map(a => {
                                const workerCount = workers.filter(w => w.areaId === a.id).length;
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="p-4 font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                            {a.name}
                                        </td>
                                        <td className="p-4">
                                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                                                {workerCount} عامل
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50"
                                                    onClick={() => onFormChange({ id: a.id, name: a.name })}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                                                    onClick={() => onDelete(a.id, workerCount)}
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
                </CardContent>
            </Card>
        </div>
    );
}
