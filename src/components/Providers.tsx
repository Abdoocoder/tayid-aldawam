"use client";

import { AttendanceProvider } from "@/context/AttendanceContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            <AuthProvider>
                <AttendanceProvider>
                    {children}
                </AttendanceProvider>
            </AuthProvider>
        </ToastProvider>
    );
}
