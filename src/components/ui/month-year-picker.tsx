"use client";

import React from "react";
import { Select } from "./select";

interface MonthYearPickerProps {
    month: number;
    year: number;
    onChange: (month: number, year: number) => void;
}

export function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
    const months = [
        { value: 1, label: "يناير (1)" },
        { value: 2, label: "فبراير (2)" },
        { value: 3, label: "مارس (3)" },
        { value: 4, label: "أبريل (4)" },
        { value: 5, label: "مايو (5)" },
        { value: 6, label: "يونيو (6)" },
        { value: 7, label: "يوليو (7)" },
        { value: 8, label: "أغسطس (8)" },
        { value: 9, label: "سبتمبر (9)" },
        { value: 10, label: "أكتوبر (10)" },
        { value: 11, label: "نوفمبر (11)" },
        { value: 12, label: "ديسمبر (12)" },
    ];

    const years = [2024, 2025, 2026];

    return (
        <div className="flex gap-3 items-center">
            <Select
                value={month}
                onChange={(e) => onChange(Number(e.target.value), year)}
                className="w-[140px] border-none shadow-lg"
            >
                {months.map((m) => (
                    <option key={m.value} value={m.value} className="text-slate-900 bg-white">
                        {m.label}
                    </option>
                ))}
            </Select>
            <Select
                value={year}
                onChange={(e) => onChange(month, Number(e.target.value))}
                className="w-[100px] border-none shadow-lg"
            >
                {years.map((y) => (
                    <option key={y} value={y} className="text-slate-900 bg-white">
                        {y}
                    </option>
                ))}
            </Select>
        </div>
    );
}
