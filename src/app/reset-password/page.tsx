"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Loader2, AlertCircle, Lock, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
    const router = useRouter();
    const { updatePassword, isLoading, user } = useAuth();
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    // Basic security: if there is no session (user is null), they shouldn't be here
    // But Supabase typically handles the "recovery" session automatically after clicking the email link
    useEffect(() => {
        const checkSession = async () => {
            // Give Supabase a moment to process the recovery link hash
            if (!user && !isLoading) {
                // We might want to wait or redirect, but often the hash is processed in the background
                // For now, we'll let the updatePassword function handle the error if no session exists
            }
        };
        checkSession();
    }, [user, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("كلمات المرور غير متطابقة");
            return;
        }

        if (password.length < 6) {
            setError("يجب أن تكون كلمة المرور 6 أحرف على الأقل");
            return;
        }

        setLoading(true);

        try {
            await updatePassword(password);
            setSuccess(true);
            // Redirect to login after a delay
            setTimeout(() => {
                router.push("/login");
            }, 3000);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "فشل تحديث كلمة المرور. يرجى التأكد من صلاحية الرابط.";
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
                        <p className="text-gray-500 font-medium">تحديث كلمة المرور</p>
                    </div>
                </div>

                {/* Main Card */}
                <Card className="glass-card border-none shadow-2xl animate-in fade-in zoom-in duration-700 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-500 via-blue-500 to-indigo-500"></div>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-center text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-900 to-blue-800">
                            كلمة مرور جديدة
                        </CardTitle>
                        <CardDescription className="text-center font-medium">
                            أدخل كلمة المرور الجديدة والقوية لحمايتك
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Success Message */}
                        {success && (
                            <div className="bg-green-50/80 backdrop-blur-sm border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-in slide-in-from-top-2">
                                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0" />
                                <div className="space-y-1">
                                    <p className="text-sm text-green-800 font-bold">تم تحديث كلمة المرور بنجاح!</p>
                                    <p className="text-xs text-green-700">سيتم توجيهك إلى صفحة الدخول تلقائياً...</p>
                                </div>
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50/80 backdrop-blur-sm border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-in slide-in-from-top-2">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-800 font-semibold">{error}</p>
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <label htmlFor="password" className="text-sm font-semibold text-gray-700 mr-1">كلمة المرور الجديدة</label>
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

                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 mr-1">تأكيد كلمة المرور</label>
                                    <div className="relative group input-focus-glow rounded-xl transition-all">
                                        <Lock className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                                        <Input
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                                            جاري التحديث...
                                        </>
                                    ) : (
                                        "تحديث كلمة المرور"
                                    )}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="text-center text-sm font-medium text-gray-500/80 animate-in fade-in duration-1000 delay-500">
                    <p>جميع الحقوق محفوظة لـ <a href="https://portfolio-abdoocoders-projects.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-bold transition-colors">abdoocoder</a></p>
                </div>
            </div>
        </div>
    );
}
