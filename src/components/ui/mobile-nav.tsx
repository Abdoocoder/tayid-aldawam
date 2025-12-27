"use client";

import React, { useEffect } from "react";
import { X, LogOut, User as UserIcon, Shield } from "lucide-react";
import { Button } from "./button";
import { Badge } from "./badge";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

export interface NavItem<T extends string = string> {
    id: T;
    label: string;
    icon: React.ElementType;
}

export interface MobileNavProps<T extends string = string> {
    isOpen: boolean;
    onClose: () => void;
    items: NavItem<T>[];
    activeTab: T;
    onTabChange: (id: T) => void;
    user: {
        name: string;
        role: string;
    } | null;
}

export function MobileNav<T extends string = string>({ isOpen, onClose, items, activeTab, onTabChange, user }: MobileNavProps<T>) {
    const { signOut } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] md:hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            ></div>

            {/* Content */}
            <div className="absolute top-0 right-0 w-[280px] h-full bg-white/80 backdrop-blur-2xl shadow-2xl border-l border-white/40 flex flex-col animate-in slide-in-from-right duration-500">
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20">
                            <Shield className="h-5 w-5" />
                        </div>
                        <span className="font-black text-slate-900 tracking-tight">تأييد الدوام</span>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* User Info */}
                <div className="px-6 py-8">
                    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                                <UserIcon className="h-5 w-5 text-slate-500" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-bold text-slate-900 truncate">{user?.name || "زائر"}</p>
                                <Badge variant="outline" className="mt-1 bg-white/50 text-[10px] font-black uppercase tracking-tighter">
                                    {user?.role}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Nav Links */}
                <div className="flex-1 px-3 space-y-1 overflow-y-auto">
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => {
                                onTabChange(item.id);
                                onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all duration-300 ${activeTab === item.id
                                ? 'bg-blue-50 text-blue-600 shadow-sm border border-blue-100'
                                : 'text-slate-500 hover:bg-slate-50'
                                }`}
                        >
                            <item.icon className="h-5 w-5" />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100">
                    <Button
                        variant="ghost"
                        onClick={handleLogout}
                        className="w-full h-12 justify-start px-4 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl font-black gap-3 transition-colors"
                    >
                        <LogOut className="h-5 w-5" />
                        تسجيل خروج
                    </Button>
                </div>
            </div>
        </div>
    );
}
