"use client";

import { AttendanceProvider } from "@/context/AttendanceContext";
import { AuthProvider } from "@/context/AuthContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AttendanceProvider>
                {children}
            </AttendanceProvider>
        </AuthProvider>
    );
}
