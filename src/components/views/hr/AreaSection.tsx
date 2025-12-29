"use client";

import React from "react";
import { Edit2, Trash2, Save, Loader2, MapPin } from "lucide-react";
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Form Column */}
            <div className="lg:col-span-4 space-y-6">
                <Card className="border-none shadow-xl shadow-purple-900/5 bg-white/80 backdrop-blur-sm sticky top-28">
                    <CardHeader className="border-b border-gray-100 p-6 bg-gradient-to-r from-purple-50/50 to-transparent">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-purple-600 p-2 rounded-lg text-white">
                                <MapPin className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-xl font-black text-gray-900">
                                {areaForm.id ? 'تعديل المنطقة' : 'إضافة منطقة جديدة'}
                            </CardTitle>
                        </div>
                        <CardDescription className="text-gray-500 font-medium font-arabic">إضافة قطاعات جديدة لتنظيم توزيع العمال والمراقبين</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <form onSubmit={onSave} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="area-name" className="text-sm font-bold text-gray-700 block">اسم المنطقة / القطاع</label>
                                <Input
                                    id="area-name"
                                    name="areaName"
                                    value={areaForm.name}
                                    onChange={e => onFormChange({ ...areaForm, name: e.target.value })}
                                    placeholder="مثلاً: مخيم الكرامة، منطقة السوق..."
                                    required
                                    className="bg-gray-50 border-gray-200 h-12 text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all rounded-xl"
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700 h-12 rounded-xl shadow-lg shadow-purple-200 font-bold" disabled={isSaving}>
                                    {isSaving ? <Loader2 className="h-5 w-5 animate-spin ml-2" /> : <Save className="h-5 w-5 ml-2" />}
                                    {areaForm.id ? 'تحديث البيانات' : 'حفظ المنطقة الجديدة'}
                                </Button>
                                {areaForm.id && (
                                    <Button type="button" variant="outline" className="h-12 rounded-xl border-gray-200" onClick={() => onFormChange({ name: '' })}>إلغاء</Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Info Card */}
                <Card className="border-none shadow-sm bg-gradient-to-br from-blue-600 to-indigo-700 text-white overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <CardContent className="p-6 relative z-10">
                        <h4 className="font-bold mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            نظام الأقسام الذكي
                        </h4>
                        <p className="text-xs text-blue-100 leading-relaxed font-arabic">
                            يساعدك النظام على تقسيم العمل إلى قطاعات جغرافية أو إدارية ليسهل على المراقبين ترحيل الحضور يومياً بدقة عالية.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* List Column */}
            <div className="lg:col-span-8">
                <Card className="border-none shadow-xl shadow-purple-900/5 bg-white overflow-hidden rounded-3xl">
                    <CardHeader className="bg-white border-b border-gray-50 p-6 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-xl font-black text-gray-900">قائمة المناطق والقطاعات</CardTitle>
                            <CardDescription className="font-medium">إجمالي عدد المناطق المسجلة: {areas.length}</CardDescription>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 border-none px-4 py-1.5 font-bold">
                            {filteredAreas.length} نتائج
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-right border-collapse">
                            <thead className="bg-gray-50/50 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
                                <tr>
                                    <th className="p-5 border-b">المنطقة / القطاع</th>
                                    <th className="p-5 border-b text-center">القوة العاملة</th>
                                    <th className="p-5 border-b text-center">الحالة</th>
                                    <th className="p-5 border-b text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filteredAreas.map((a, index) => {
                                    const workerCount = workers.filter(w => w.areaId === a.id).length;
                                    return (
                                        <tr key={a.id} className="hover:bg-purple-50/30 transition-all group">
                                            <td className="p-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-bold text-gray-900 text-lg group-hover:text-purple-700 transition-colors">
                                                        {a.name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-center">
                                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 font-bold">
                                                    {workerCount} عمال
                                                </Badge>
                                            </td>
                                            <td className="p-5 text-center">
                                                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-green-600">
                                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                    نشط
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 w-10 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-xl"
                                                        onClick={() => onFormChange({ id: a.id, name: a.name })}
                                                        title="تعديل"
                                                    >
                                                        <Edit2 className="h-5 w-5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-10 w-10 text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl"
                                                        onClick={() => onDelete(a.id, workerCount)}
                                                        title="حذف"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredAreas.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-3 text-gray-400">
                                                <MapPin className="h-12 w-12 opacity-20" />
                                                <p className="font-bold">لا يوجد مناطق بهذا الاسم</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
