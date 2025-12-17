"use client";

import { AttendanceProvider } from "@/context/AttendanceContext";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AttendanceProvider>
            {children}
        </AttendanceProvider>
    );
}
