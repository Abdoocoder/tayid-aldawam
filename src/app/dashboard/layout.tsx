"use client";

import { useAuth } from "@/context/AuthContext";
import { PendingApprovalScreen } from "@/components/layout/PendingApprovalScreen";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { isPendingApproval, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (isPendingApproval) {
        return <PendingApprovalScreen />;
    }

    return <>{children}</>;
}
