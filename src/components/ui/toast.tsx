"use client";

import React from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
    title: string;
    description?: string;
    type: ToastType;
    onClose: () => void;
}

export const Toast = ({ title, description, type, onClose }: ToastProps) => {
    const icons = {
        success: <CheckCircle className="h-5 w-5 text-green-500" />,
        error: <AlertCircle className="h-5 w-5 text-red-500" />,
        info: <Info className="h-5 w-5 text-blue-500" />,
        warning: <AlertCircle className="h-5 w-5 text-amber-500" />,
    };

    const backgrounds = {
        success: "bg-green-50 border-green-100",
        error: "bg-red-50 border-red-100",
        info: "bg-blue-50 border-blue-100",
        warning: "bg-amber-50 border-amber-100",
    };

    return (
        <div
            className={cn(
                "flex w-full items-start gap-3 rounded-xl border p-4 shadow-lg animate-in slide-in-from-left-full duration-300 pointer-events-auto",
                backgrounds[type]
            )}
            dir="rtl"
        >
            <div className="flex-shrink-0">{icons[type]}</div>
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                {description && <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>}
            </div>
            <button
                onClick={onClose}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
};
