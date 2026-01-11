import React, { useState, useMemo } from 'react';
import { type Worker, type AttendanceRecord, type Area, useAttendance } from '@/context/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Loader2, AlertTriangle, Filter, CheckCircle } from 'lucide-react';
import { resolveAreaNames } from '@/lib/utils';

// If toast doesn't exist, I will gracefully handle it or check if UI lib has it. I'll check common deps.
// I'll stick to simple alerts or just button state changes if unsure.

interface BatchEntryTableProps {
    month: number;
    year: number;
    workers: Worker[];
    attendanceRecords: AttendanceRecord[];
    areas: Area[];
    responsibleAreasIds: string[]; // IDs of areas the GS is responsible for
    unsupervisedAreaIds: string[]; // IDs of areas specifically without a supervisor
}

export function BatchEntryTable({
    month,
    year,
    workers,
    attendanceRecords,
    areas,
    responsibleAreasIds,
    unsupervisedAreaIds
}: BatchEntryTableProps) {
    const { saveAttendance } = useAttendance();
    const [filterType, setFilterType] = useState<'all' | 'unsupervised'>('unsupervised');
    const [searchTerm, setSearchTerm] = useState('');
    const [savingIds, setSavingIds] = useState<Set<string>>(new Set());
    const [edits, setEdits] = useState<Record<string, {
        normalDays: number;
        otNormal: number;
        otHoliday: number;
        otEid: number;
    }>>({});

    const daysInMonth = new Date(year, month, 0).getDate();

    const filteredWorkers = useMemo(() => {
        return workers.filter(w => {
            // Must be in a responsible area
            if (!responsibleAreasIds.includes(w.areaId)) return false;

            // Filter by type
            if (filterType === 'unsupervised' && !unsupervisedAreaIds.includes(w.areaId)) return false;

            // Search
            if (searchTerm && !w.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

            return true;
        });
    }, [workers, responsibleAreasIds, unsupervisedAreaIds, filterType, searchTerm]);

    const handleInputChange = (workerId: string, field: string, value: string) => {
        const numVal = parseFloat(value) || 0;
        setEdits(prev => ({
            ...prev,
            [workerId]: {
                ...getRecordValues(workerId),
                [field]: numVal,
                // Ensure we copy other existing values if this is the first edit for this worker
                ...prev[workerId]
            }
        }));
    };

    const getRecordValues = (workerId: string) => {
        // Return edits if exist, else return existing record values, else 0
        if (edits[workerId]) return edits[workerId];

        const record = attendanceRecords.find(r => r.workerId === workerId && r.month === month && r.year === year);
        return {
            normalDays: record?.normalDays || 0,
            otNormal: record?.overtimeNormalDays || 0,
            otHoliday: record?.overtimeHolidayDays || 0,
            otEid: record?.overtimeEidDays || 0
        };
    };

    const getRecordStatus = (workerId: string) => {
        const record = attendanceRecords.find(r => r.workerId === workerId && r.month === month && r.year === year);
        return record?.status;
    };

    const handleSave = async (workerId: string) => {
        const values = getRecordValues(workerId);

        // Basic Validation
        if (values.normalDays > daysInMonth) {
            alert(`أيام العمل لا يمكن أن تتجاوز ${daysInMonth}`);
            return;
        }

        setSavingIds(prev => new Set(prev).add(workerId));
        try {
            await saveAttendance({
                workerId: workerId,
                month,
                year,
                normalDays: values.normalDays,
                overtimeNormalDays: values.otNormal,
                overtimeHolidayDays: values.otHoliday,
                overtimeEidDays: values.otEid,
                status: 'PENDING_GS' // Auto approve to GS level since GS is entering it? 
                // Wait, if GS enters it, surely it's approved by GS?
                // The prompt says "GS panel". If GS enters, it probably should go to PENDING_HEALTH (next step) or stay PENDING_GS?
                // `saveAttendance` in Context (line 275) has logic:
                // if (appUser?.role === 'GENERAL_SUPERVISOR' && initialStatus === 'PENDING_GS') { initialStatus = 'PENDING_HEALTH'; }
                // So if we send PENDING_GS, the context will auto-promote it to PENDING_HEALTH if logic holds.
                // Let's explicitly send 'PENDING_GS' and let context handle, or send 'PENDING_HEALTH' if we want to be sure.
                // I'll send PENDING_GS as per standard flow.
            });

            // Clear edit state for this worker to switch back to "view" mode (showing saved data)
            setEdits(prev => {
                const next = { ...prev };
                delete next[workerId];
                return next;
            });

        } catch (error) {
            console.error(error);
            alert("فشل الحفظ");
        } finally {
            setSavingIds(prev => {
                const next = new Set(prev);
                next.delete(workerId);
                return next;
            });
        }
    };

    const calculateTotal = (vals: { normalDays: number, otNormal: number, otHoliday: number, otEid: number }) => {
        return vals.normalDays + (vals.otNormal * 0.5) + (vals.otHoliday * 1.0) + (vals.otEid * 1.0);
    };

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters */}
            <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between gap-4 items-center">
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setFilterType('unsupervised')}
                        className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${filterType === 'unsupervised'
                            ? 'bg-amber-100 text-amber-700 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <AlertTriangle className="h-4 w-4 inline-block ml-2" />
                        مناطق بلا مراقب
                    </button>
                    <button
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${filterType === 'all'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Filter className="h-4 w-4 inline-block ml-2" />
                        الكل
                    </button>
                </div>

                <div className="relative w-full md:w-64">
                    <Input
                        placeholder="بحث عن عامل..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="bg-white border-slate-200"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white/40 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/50 border border-white/60 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                                <th className="p-4">العامل</th>
                                <th className="p-4">المنطقة</th>
                                <th className="p-4 text-center w-24">عادية</th>
                                <th className="p-4 text-center w-24">إضافي (0.5)</th>
                                <th className="p-4 text-center w-24">إضافي (1.0)</th>
                                <th className="p-4 text-center w-24">أعياد (1.0)</th>
                                <th className="p-4 text-center w-20">المجموع</th>
                                <th className="p-4 text-center w-32">الإجراء</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredWorkers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-12 text-center text-slate-400 font-bold">
                                        لا يوجد عمال مطابقين
                                    </td>
                                </tr>
                            ) : (
                                filteredWorkers.map(worker => {
                                    const recordVals = getRecordValues(worker.id);
                                    const total = calculateTotal(recordVals);
                                    const isSaving = savingIds.has(worker.id);
                                    const status = getRecordStatus(worker.id);
                                    const isEdited = !!edits[worker.id];
                                    const isApproved = status && status !== 'PENDING_GS' && status !== 'PENDING_SUPERVISOR';

                                    return (
                                        <tr key={worker.id} className={`hover:bg-indigo-50/30 transition-all ${isEdited ? 'bg-indigo-50/20' : ''}`}>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900">{worker.name}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">ID: {worker.id}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                                    {resolveAreaNames(worker.areaId, areas)}
                                                </span>
                                                {unsupervisedAreaIds.includes(worker.areaId) && (
                                                    <div className="inline-flex mt-1 mr-1">
                                                        <AlertTriangle className="h-3 w-3 text-amber-500" />
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min={0} max={daysInMonth}
                                                    value={recordVals.normalDays}
                                                    onChange={(e) => handleInputChange(worker.id, 'normalDays', e.target.value)}
                                                    className="w-16 h-9 text-center rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-slate-700 bg-white/50"
                                                    disabled={isApproved || isSaving}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min={0} max={31}
                                                    value={recordVals.otNormal}
                                                    onChange={(e) => handleInputChange(worker.id, 'otNormal', e.target.value)}
                                                    className="w-16 h-9 text-center rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-indigo-600 bg-white/50"
                                                    disabled={isApproved || isSaving}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min={0} max={31}
                                                    value={recordVals.otHoliday}
                                                    onChange={(e) => handleInputChange(worker.id, 'otHoliday', e.target.value)}
                                                    className="w-16 h-9 text-center rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-purple-600 bg-white/50"
                                                    disabled={isApproved || isSaving}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <input
                                                    type="number"
                                                    min={0} max={10}
                                                    value={recordVals.otEid}
                                                    onChange={(e) => handleInputChange(worker.id, 'otEid', e.target.value)}
                                                    className="w-16 h-9 text-center rounded-lg border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 font-bold text-green-600 bg-white/50"
                                                    disabled={isApproved || isSaving}
                                                />
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="inline-flex items-center justify-center min-w-[3rem] h-9 px-2 rounded-lg bg-slate-100 text-slate-800 font-black">
                                                    {total}
                                                </div>
                                            </td>
                                            <td className="p-4 text-center">
                                                {isApproved ? (
                                                    <span className="flex items-center justify-center text-emerald-600 gap-1 text-xs font-bold">
                                                        <CheckCircle className="h-4 w-4" />
                                                        معتمد
                                                    </span>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleSave(worker.id)}
                                                        disabled={isSaving || !isEdited}
                                                        className={`h-9 px-4 font-bold rounded-xl transition-all ${isEdited
                                                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200'
                                                            : 'bg-slate-100 text-slate-400'
                                                            }`}
                                                    >
                                                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
