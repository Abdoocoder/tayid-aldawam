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
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "فشل تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setError(null);
            await signInWithGoogle();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "فشل تسجيل الدخول عبر Google";
            setError(errorMessage);
        }
    };

    const handleGithubLogin = async () => {
        try {
            setError(null);
            await signInWithGithub();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "فشل تسجيل الدخول عبر GitHub";
            setError(errorMessage);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 mesh-bg relative overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-md space-y-8 relative z-10">
                {/* Header */}
                <div className="text-center space-y-3 animate-in fade-in slide-in-from-top duration-1000">
                    <div className="flex items-center justify-center mb-2">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-4 rounded-2xl shadow-lg ring-4 ring-blue-50">
                            <Building className="h-10 w-10 text-white" />
                        </div>
                    </div>
                    <div>
                        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-1">تأييد الدوام</h1>
                        <p className="text-gray-500 font-medium">نظام إدارة الحضور الذكي للمؤسسات</p>
                    </div>
                </div>

                {/* Login Card */}
                <Card className="glass-card border-none shadow-2xl animate-in fade-in zoom-in duration-700 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-blue-800">
                            تسجيل الدخول
                        </CardTitle>
                        <CardDescription className="text-center font-medium">
                            أهلاً بك مجدداً، يرجى إدخال بياناتك
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 font-semibold">{error}</p>
                            </div>
                        )}

                        {/* Email/Password Form */}
                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-gray-700 mr-1">البريد الإلكتروني</label>
                                <div className="relative group input-focus-glow rounded-xl transition-all">
                                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="text"
                                        placeholder="البريد أو اسم المستخدم"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading || isLoading}
                                        className="pr-10 h-12 bg-white/50 border-gray-200/50 rounded-xl focus:border-blue-500 focus:bg-white transition-all text-base"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <label htmlFor="password" className="text-sm font-semibold text-gray-700">كلمة المرور</label>
                                    <Link href="/forgot-password" title="استعادة كلمة المرور" className="text-xs font-medium text-blue-600 hover:text-blue-700">نسيت كلمة المرور؟</Link>
                                </div>
                                <div className="relative group input-focus-glow rounded-xl transition-all">
                                    <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading || isLoading}
                                        className="pr-10 h-12 bg-white/50 border-gray-200/50 rounded-xl focus:border-blue-500 focus:bg-white transition-all text-base"
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 shimmer-button transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                disabled={loading || isLoading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                        جاري الدخول...
                                    </>
                                ) : (
                                    "تسجيل الدخول"
                                )}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative flex items-center gap-4 py-2">
                            <div className="flex-grow border-t border-gray-200/50"></div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">أو عبر</span>
                            <div className="flex-grow border-t border-gray-200/50"></div>
                        </div>

                        {/* Social Login Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-white/50 hover:bg-white border-gray-200 h-11 rounded-xl transition-all hover:shadow-md"
                                onClick={handleGoogleLogin}
                                disabled={loading || isLoading}
                            >
                                <svg className="ml-2 h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#EA4335" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#4285F4" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                                Google
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                className="bg-white/50 hover:bg-white border-gray-200 h-11 rounded-xl transition-all hover:shadow-md"
                                onClick={handleGithubLogin}
                                disabled={loading || isLoading}
                            >
                                <svg className="ml-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                                GitHub
                            </Button>
                        </div>

                        {/* Register Link */}
                        <div className="text-center text-sm font-medium pt-2 text-gray-500">
                            ليس لديك حساب بعد؟{" "}
                            <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold underline-offset-4 hover:underline transition-all">
                                انضم إلينا مجاناً
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm font-medium text-gray-500/80 animate-in fade-in duration-1000 delay-500">
                    <div className="flex flex-col gap-1.5">
                        <p className="flex items-center justify-center gap-1.5">
                            تطوير وإشراف:
                            <a
                                href="https://abdoocoder.github.io/Portfolio"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-bold transition-colors border-b border-transparent hover:border-blue-300"
                            >
                                فريق التحول الرقمي
                            </a>
                        </p>
                        <p>© 2025 جميع الحقوق محفوظة لعبدالله ابوصغيرة</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
