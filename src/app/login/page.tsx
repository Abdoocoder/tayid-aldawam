"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Loader2, AlertCircle, Mail, Lock } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
    const router = useRouter();
    const { signIn, signInWithGoogle, signInWithGithub, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            await signIn(email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError(err.message || "فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError(null);
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "فشل تسجيل الدخول عبر Google");
        }
    };

    const handleGithubLogin = async () => {
        try {
            setError(null);
            await signInWithGithub();
        } catch (err: any) {
            setError(err.message || "فشل تسجيل الدخول عبر GitHub");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center mb-4">
                        <div className="bg-blue-600 p-3 rounded-xl">
                            <Building className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">تأييد الدوام</h1>
                    <p className="text-gray-500">نظام إدارة الحضور الشهري</p>
                </div>

                {/* Login Card */}
                <Card className="shadow-xl border-t-4 border-t-blue-500">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl">تسجيل الدخول</CardTitle>
                        <CardDescription className="text-center">
                            أدخل بياناتك للوصول إلى النظام
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
                                <div className="relative">
                                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="example@domain.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading || isLoading}
                                        className="pr-10"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
                                <div className="relative">
                                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading || isLoading}
                                        className="pr-10"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                disabled={loading || isLoading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                        جاري تسجيل الدخول...
                                    </>
                                ) : (
                                    "تسجيل الدخول"
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-200"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">أو</span>
                            </div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGoogleLogin}
                                disabled={loading || isLoading}
                            >
                                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="currentColor"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                تسجيل الدخول عبر Google
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={handleGithubLogin}
                                disabled={loading || isLoading}
                            >
                                <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                تسجيل الدخول عبر GitHub
                            </Button>
                        </div>

                        {/* Register Link */}
                        <div className="text-center text-sm text-gray-600">
                            ليس لديك حساب؟{" "}
                            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium">
                                إنشاء حساب جديد
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-gray-400">
                    © 2025 نظامتي الذكي - جميع الحقوق محفوظة
                </p>
            </div>
        </div>
    );
}
