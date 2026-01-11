"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Loader2, AlertCircle, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const router = useRouter();
    const { resetPassword, isLoading } = useAuth();
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "فشل إرسال طلب إعادة تعيين كلمة المرور";
            setError(errorMessage);
        } finally {
            setLoading(false);
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
                        <p className="text-gray-500 font-medium">استعادة الوصول إلى حسابك</p>
                    </div>
                </div>

                {/* Main Card */}
                <Card className="glass-card border-none shadow-2xl animate-in fade-in zoom-in duration-700 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-blue-800">
                            نسيت كلمة المرور؟
                        </CardTitle>
                        <CardDescription className="text-center font-medium">
                            أدخل بريدك الإلكتروني وسنرسل لك رابطاً للتعيين
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                                <div className="bg-green-100 rounded-full p-1">
                                    <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-sm text-green-800 font-semibold">
                                    تم إرسال رابط إعادة التعيين بنجاح. يرجى تفقد بريدك الإلكتروني.
                                </p>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 font-semibold">{error}</p>
                            </div>
                        )}

                        {!success ? (
                            <form onSubmit={handleSubmit} className="space-y-5">
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

                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 shimmer-button transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                    disabled={loading || isLoading}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                                            جاري الإرسال...
                                        </>
                                    ) : (
                                        "إرسال رابط التعيين"
                                    )}
                                </Button>
                            </form>
                        ) : (
                            <div className="pt-2">
                                <Button
                                    variant="outline"
                                    className="w-full h-12 border-gray-200 hover:bg-white/50 rounded-xl transition-all"
                                    onClick={() => router.push("/login")}
                                >
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                    العودة لتسجيل الدخول
                                </Button>
                            </div>
                        )}

                        {/* Back Link */}
                        {!success && (
                            <div className="text-center text-sm font-medium pt-2">
                                <Link href="/login" className="text-blue-600 hover:text-blue-700 font-bold flex items-center justify-center gap-1 group transition-all">
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    العودة لتسجيل الدخول
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm font-medium text-gray-500/80 animate-in fade-in duration-1000 delay-500">
                    <p>© 2025 جميع الحقوق محفوظة لعبدالله ابوصغيرة</p>
                </div>
            </div>
        </div>
    );
}
