"use client";

import { useAttendance } from "@/context/AttendanceContext";
import { Header } from "@/components/layout/Header";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Optimized Dynamic Imports
const SupervisorView = dynamic(() => import("@/components/views/SupervisorView").then(mod => mod.SupervisorView), {
    loading: () => <ViewLoadingSkeleton />
});
const HRView = dynamic(() => import("@/components/views/HRView").then(mod => mod.HRView), {
    loading: () => <ViewLoadingSkeleton />
});
const FinanceView = dynamic(() => import("@/components/views/FinanceView").then(mod => mod.FinanceView), {
    loading: () => <ViewLoadingSkeleton />
});
const GeneralSupervisorView = dynamic(() => import("@/components/views/GeneralSupervisorView").then(mod => mod.GeneralSupervisorView), {
    loading: () => <ViewLoadingSkeleton />
});
const AdminView = dynamic(() => import("@/components/views/AdminView").then(mod => mod.AdminView), {
    loading: () => <ViewLoadingSkeleton />
});
const MayorView = dynamic(() => import("@/components/views/MayorView").then(mod => mod.MayorView), {
    loading: () => <ViewLoadingSkeleton />
});
const HealthDirectorView = dynamic(() => import("@/components/views/HealthDirectorView").then(mod => mod.HealthDirectorView), {
    loading: () => <ViewLoadingSkeleton />
});
const InternalAuditView = dynamic(() => import("@/components/views/InternalAuditView").then(mod => mod.InternalAuditView), {
    loading: () => <ViewLoadingSkeleton />
});
const PayrollView = dynamic(() => import("@/components/views/PayrollView").then(mod => mod.PayrollView), {
    loading: () => <ViewLoadingSkeleton />
});

function ViewLoadingSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 animate-in fade-in duration-500">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-bold">جاري تحميل الواجهة...</p>
        </div>
    );
}

export default function DashboardPage() {
    const { currentUser, isLoading: isDataLoading } = useAttendance();
    const router = useRouter();

    useEffect(() => {
        // Redirection should only happen if we are not loading and there is no user
        if (!isDataLoading && !currentUser) {
            router.push("/");
        }
    }, [currentUser, isDataLoading, router]);

    // Better Loading Experience:
    // 1. If we have a user but data is still loading, show the Header immediately (FCP boost)
    // 2. The dynamic views will show their skeletons in the main area
    if (currentUser) {
        return (
            <div className="min-h-screen bg-gray-50 pb-10 print:bg-white print:min-h-0 print:pb-0">
                <Header />
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-0 pb-8 print:max-w-none print:w-full print:mx-0 print:px-0 print:py-0">
                    {/* Components will internally handle isDataLoading if needed, 
                        or dynamic import skeletons will show during bundle load */}
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

    // Full screen loader only for the very initial auth check
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            <p className="text-slate-500 font-black">جاري التحقق من الصلاحيات...</p>
        </div>
    );
}
