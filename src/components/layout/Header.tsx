"use client";

import React from "react";
import { useAttendance } from "@/context/AttendanceContext";
import { useAuth } from "@/context/AuthContext";
import { Button } from "../ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
    const { currentUser } = useAttendance();
    const { signOut } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await signOut();
        router.push("/login");
    };

    return (
        <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-white/10 h-16 px-6 flex items-center justify-between sticky top-0 z-10 shadow-sm print:hidden">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg text-white font-bold text-lg">
                    تأييد الدوام
                </div>
                <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-white/10 mx-2"></div>
                <div className="hidden md:flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm bg-gray-50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-transparent dark:border-white/5">
                    <UserIcon className="h-4 w-4" />
                    <span>{currentUser?.name || "زائر"}</span>
                    <span className="text-xs bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-md text-slate-700 dark:text-slate-200">{currentUser?.role}</span>
                </div>
            </div>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 dark:text-red-400 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="h-4 w-4 ml-2" />
                تسجيل خروج
            </Button>
        </header>
    );
}
