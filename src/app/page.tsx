"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const { user, appUser, isLoading, isPendingApproval, signOut } = useAuth();

  useEffect(() => {
    if (!isLoading && !isPendingApproval) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, isLoading, isPendingApproval, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (isPendingApproval) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-blue-50 px-4">
        <div className="max-w-md w-full text-center space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-blue-50">
          <div className="bg-amber-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-amber-600 border-4 border-amber-50">
            <Loader2 className="h-10 w-10 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">في انتظار الموافقة</h1>
            <p className="text-gray-500 leading-relaxed">
              مرحباً {appUser?.name}، لقد تم إنشاء حسابك بنجاح. يرجى الانتظار حتى يقوم مسؤول النظام بالموافقة على حسابك لتتمكن من الدخول.
            </p>
          </div>
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => signOut()}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-all"
            >
              تسجيل الخروج
            </button>
          </div>
          <p className="text-xs text-gray-400">إذا كنت تعتقد أن هناك خطأ، يرجى الاتصال بالإدارة.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  );
}
