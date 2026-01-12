"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import { User, UserRole, Area } from '@/types';

interface AuthContextType {
    user: SupabaseUser | null;
    appUser: User | null;
    isLoading: boolean;
    isPendingApproval: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, role: UserRole, areaId?: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    updatePassword: (password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [appUser, setAppUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPendingApproval, setIsPendingApproval] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [supabase] = useState(() => createClient()); // Initialize once and persist

    const loadAppUser = useCallback(async (authUserId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, user_areas (areas (*))')
                .eq('auth_user_id', authUserId)
                .maybeSingle();

            if (error) {
                console.error('Database error loading app user:', error);
                throw error;
            }

            if (data) {
                const userAreas = (data.user_areas as unknown as { areas: Area }[] | null)?.map((item) => item.areas) || [];

                setAppUser({
                    id: data.id,
                    username: data.username,
                    name: data.name,
                    role: data.role as UserRole,
                    areaId: data.area_id,
                    areas: userAreas,
                    isActive: data.is_active,
                    handledNationality: data.handled_nationality || 'ALL'
                });
                setIsPendingApproval(!data.is_active);
            } else {
                console.warn('No app user profile found for auth user:', authUserId);
                setAppUser(null);
                // Important: If a user is authenticated but has no profile in public.users,
                // we should sign them out to clear the stale session.
                // However, we wait a bit to allow for async profile creation during signup
                setTimeout(async () => {
                    const { data: currentSession } = await supabase.auth.getSession();
                    if (currentSession.session?.user.id === authUserId) {
                        const { data: recheck } = await supabase.from('users').select('id').eq('auth_user_id', authUserId).maybeSingle();
                        if (!recheck) {
                            await supabase.auth.signOut();
                        } else {
                            loadAppUser(authUserId);
                        }
                    }
                }, 3000);
            }
        } catch (err) {
            console.error('Failed to load app user:', err);
            setError('فشل تحميل بيانات المستخدم');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    // Load user on mount and subscribe to auth changes
    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadAppUser(session.user.id);
            } else {
                setIsLoading(false);
            }
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadAppUser(session.user.id);
            } else {
                setAppUser(null);
                setIsPendingApproval(false);
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [supabase, loadAppUser]);

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            // Apply standardized email transformation for username-based login
            let finalEmail = email.trim().toLowerCase();
            if (!finalEmail.includes('@')) {
                const prefix = finalEmail.replace(/[^a-z0-9]/g, '');
                finalEmail = `${prefix}.sv@tayid-attendance.com`;
            }

            // Optional: Check if user exists in public.users first for better error messages
            // This is professional as it allows us to tell the user the account doesn't exist
            const { data: userProfile } = await supabase
                .from('users')
                .select('id, is_active')
                .eq('username', finalEmail)
                .maybeSingle();

            if (!userProfile) {
                throw new Error('عذراً، هذا البريد الإلكتروني غير مسجل في النظام');
            }

            const { error } = await supabase.auth.signInWithPassword({
                email: finalEmail,
                password: password.trim(),
            });

            if (error) {
                if (error.message.includes('Invalid login credentials')) {
                    throw new Error('عذراً، كلمة المرور غير صحيحة');
                }
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('يرجى تأكيد البريد الإلكتروني للمتابعة');
                }
                throw error;
            }

            // User will be loaded via onAuthStateChange
        } catch (err: unknown) {
            // Only log unexpected errors, not standard auth failures
            if (!(err instanceof Error) || (!err.message.includes('غير مسجل') && !err.message.includes('غير صحيحة'))) {
                console.error('Sign in error details:', err);
            }
            const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, name: string, role: UserRole, areaId?: string) => {
        try {
            setError(null);
            setIsLoading(true);

            // Ensure email format is valid for Supabase by using a standardized domain
            let finalEmail = email.trim().toLowerCase();
            if (!finalEmail.includes('@')) {
                // It's a username/prefix, generate a standardized email
                const prefix = finalEmail.replace(/[^a-z0-9]/g, '');
                finalEmail = `${prefix}.sv@tayid-attendance.com`;
            }


            const { data, error } = await supabase.auth.signUp({
                email: finalEmail,
                password: password.trim(),
                options: {
                    data: {
                        name: name.trim(),
                        role,
                        areaId: areaId?.trim(),
                    },
                },
            });

            if (error) {
                console.error('AuthContext: Signup error:', error);
                throw error;
            }


            if (data.user && data.user.identities && data.user.identities.length === 0) {
                console.warn('AuthContext: User created but identities are empty. This means the user might already exist in auth.users.');
            }

            // --- Robust Profile Ensuring Logic ---
            if (data.user) {
                const userId = data.user.id;

                // 1. Check for existing profile by BOTH auth_user_id and username (email)
                // This covers cases where a user was manually added or is re-registering
                const { data: existingProfiles } = await supabase
                    .from('users')
                    .select('id, auth_user_id, username')
                    .or(`auth_user_id.eq.${userId},username.eq.${finalEmail}`);

                const matchingProfile = existingProfiles && existingProfiles.length > 0 ? existingProfiles[0] : null;

                if (!matchingProfile) {
                    const { error: insertError } = await supabase.from('users').insert({
                        auth_user_id: userId,
                        username: finalEmail,
                        name: name.trim(),
                        role: role,
                        area_id: areaId?.trim(),
                        is_active: false
                    });
                    if (insertError) {
                        console.error('AuthContext: Profile insert failed:', insertError);
                    } else {
                        // Trigger a reload to update UI state
                        loadAppUser(userId);
                    }
                } else if (!matchingProfile.auth_user_id || matchingProfile.auth_user_id !== userId) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({
                            auth_user_id: userId,
                            name: name.trim(),
                            role: role,
                            area_id: areaId?.trim()
                        })
                        .eq('id', matchingProfile.id);

                    if (updateError) {
                        console.error('AuthContext: Profile update/link failed:', updateError);
                    } else {
                        loadAppUser(userId);
                    }
                } else {
                    loadAppUser(userId);
                }
            }

            // Note: User might need to verify email depending on Supabase settings
        } catch (err: unknown) {
            console.error('Sign up error:', err);
            const message = err instanceof Error ? err.message : 'فشل إنشاء الحساب';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signInWithGoogle = async () => {
        try {
            setError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (err: unknown) {
            console.error('Google sign in error:', err);
            const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول عبر Google';
            setError(message);
            throw err;
        }
    };

    const signInWithGithub = async () => {
        try {
            setError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'github',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) throw error;
        } catch (err: unknown) {
            console.error('GitHub sign in error:', err);
            const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول عبر GitHub';
            setError(message);
            throw err;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            setError(null);
            setIsLoading(true);

            let finalEmail = email.trim().toLowerCase();
            if (!finalEmail.includes('@')) {
                const prefix = finalEmail.replace(/[^a-z0-9]/g, '');
                finalEmail = `${prefix}.sv@tayid-attendance.com`;
            }

            const { error } = await supabase.auth.resetPasswordForEmail(finalEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error) throw error;
        } catch (err: unknown) {
            console.error('Reset password error:', err);
            const message = err instanceof Error ? err.message : 'فشل إرسال رابط إعادة تعيين كلمة المرور';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const updatePassword = async (password: string) => {
        try {
            setError(null);
            setIsLoading(true);
            const { error } = await supabase.auth.updateUser({
                password: password.trim(),
            });
            if (error) throw error;
        } catch (err: unknown) {
            console.error('Update password error:', err);
            const message = err instanceof Error ? err.message : 'فشل تحديث كلمة المرور';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signOut = async () => {
        try {
            setError(null);
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setUser(null);
            setAppUser(null);
        } catch (err: unknown) {
            console.error('Sign out error:', err);
            const message = err instanceof Error ? err.message : 'فشل تسجيل الخروج';
            setError(message);
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                appUser,
                isLoading,
                isPendingApproval,
                error,
                signIn,
                signUp,
                signInWithGoogle,
                signInWithGithub,
                signOut,
                resetPassword,
                updatePassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
