"use client";

import React from "react";
import { LucideIcon, HardHat } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export const EmptyState = ({ icon: Icon = HardHat, title, description, action }: EmptyStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-in fade-in zoom-in duration-500">
            <div className="bg-gray-50 p-6 rounded-full border-2 border-dashed border-gray-200 mb-6">
                <Icon className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto leading-relaxed mb-8">
                {description}
            </p>
            {action && <div>{action}</div>}
        </div>
    );
};
