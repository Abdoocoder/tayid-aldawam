"use client";

import { useAttendance } from "@/context/AttendanceContext";
import { Header } from "@/components/layout/Header";
import { SupervisorView } from "@/components/views/SupervisorView";
import { HRView } from "@/components/views/HRView";
import { FinanceView } from "@/components/views/FinanceView";
import { GeneralSupervisorView } from "@/components/views/GeneralSupervisorView";
import { AdminView } from "@/components/views/AdminView";
import { MayorView } from "@/components/views/MayorView";
import { HealthDirectorView } from "@/components/views/HealthDirectorView";
import { InternalAuditView } from "@/components/views/InternalAuditView";
import { PayrollView } from "@/components/views/PayrollView";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
    const { currentUser } = useAttendance();
    const router = useRouter();

    useEffect(() => {
        if (!currentUser) {
            router.push("/");
        }
    }, [currentUser, router]);

    if (!currentUser) {
        return <div className="p-10 text-center">جاري التحميل...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-10 print:bg-white print:min-h-0 print:pb-0">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:max-w-none print:w-full print:mx-0 print:px-0 print:py-0">
                {currentUser.role === "SUPERVISOR" && <SupervisorView />}
                {currentUser.role === "GENERAL_SUPERVISOR" && <GeneralSupervisorView />}
                {currentUser.role === "HEALTH_DIRECTOR" && <HealthDirectorView />}
                {currentUser.role === "HR" && <HRView />}
                {currentUser.role === "INTERNAL_AUDIT" && <InternalAuditView />}
                {currentUser.role === "FINANCE" && <FinanceView />}
                {currentUser.role === "PAYROLL" && <PayrollView />}
                {currentUser.role === "ADMIN" && <AdminView />}
                {currentUser.role === "MAYOR" && <MayorView />}
            </main>
        </div>
    );
}
