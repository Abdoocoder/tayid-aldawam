"use client";

import { useAttendance, UserRole } from "@/context/AttendanceContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, Users, DollarSign, Building } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { login } = useAttendance();
  const router = useRouter();

  const handleLogin = (role: UserRole) => {
    login(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl grid gap-8 text-center mb-8">
        <div className="space-y-2">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl">
              <Building className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">تأييد الدوام</h1>
          <p className="text-xl text-gray-500">نظام إدارة الحضور الشهري - نظامتي الذكي</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
        {/* Supervisor Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-blue-500" onClick={() => handleLogin("SUPERVISOR")}>
          <CardHeader>
            <div className="mx-auto bg-blue-100 p-4 rounded-full mb-4">
              <UserCheck className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-center">مراقب المنطقة</CardTitle>
            <CardDescription className="text-center">إدخال الحضور والغياب للعمال</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">دخول كمراقب</Button>
          </CardContent>
        </Card>

        {/* HR Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-purple-500" onClick={() => handleLogin("HR")}>
          <CardHeader>
            <div className="mx-auto bg-purple-100 p-4 rounded-full mb-4">
              <Users className="h-8 w-8 text-purple-600" />
            </div>
            <CardTitle className="text-center">الموارد البشرية</CardTitle>
            <CardDescription className="text-center">متابعة الدوام والتقارير</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button className="w-full bg-purple-600 hover:bg-purple-700">دخول HR</Button>
          </CardContent>
        </Card>

        {/* Finance Card */}
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-t-4 border-t-green-500" onClick={() => handleLogin("FINANCE")}>
          <CardHeader>
            <div className="mx-auto bg-green-100 p-4 rounded-full mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-center">القسم المالي</CardTitle>
            <CardDescription className="text-center">احتساب الرواتب والمستحقات</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button className="w-full bg-green-600 hover:bg-green-700">دخول مالية</Button>
          </CardContent>
        </Card>
      </div>

      <footer className="mt-12 text-gray-400 text-sm">
        © 2025 نظامتي الذكي - جميع الحقوق محفوظة
      </footer>
    </div>
  );
}
