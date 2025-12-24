"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import { User, UserRole, Area } from './AttendanceContext';

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
                .select('*')
                .eq('auth_user_id', authUserId)
                .maybeSingle();

            if (error) {
                console.error('Database error loading app user:', error);
                throw error;
            }

            if (data) {
                // Fetch associated areas
                const { data: areasData } = await supabase
                    .from('user_areas')
                    .select('areas (*)')
                    .eq('user_id', data.id);

                const userAreas = (areasData as unknown as { areas: Area }[] | null)?.map((item) => item.areas) || [];

                setAppUser({
                    id: data.id,
                    username: data.username,
                    name: data.name,
                    role: data.role as UserRole,
                    areaId: data.area_id,
                    areas: userAreas,
                    isActive: data.is_active
                });
                setIsPendingApproval(!data.is_active);
            } else {
                console.warn('No app user profile found for auth user:', authUserId);
                // Clear stale session if profile is missing
                setAppUser(null);
                await supabase.auth.signOut();
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

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    throw new Error('يرجى تأكيد البريد الإلكتروني أو طلب تعطيل تأكيد البريد من المسؤول');
                }
                throw error;
            }

            // User will be loaded via onAuthStateChange
        } catch (err: unknown) {
            console.error('Sign in error:', err);
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

            console.log(`AuthContext: Attempting signup with email: [${finalEmail}]`);

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

            console.log('AuthContext: Signup successful, user ID:', data.user?.id);

            if (data.user && data.user.identities && data.user.identities.length === 0) {
                console.warn('AuthContext: User created but identities are empty. This means the user might already exist in auth.users.');
            }

            // --- Robustness Fallback: Only manually ensure profile if it's an existing user without identities ---
            // Brand new users are handled by the database trigger which is more reliable.
            const isExistingUser = data.user && data.user.identities && data.user.identities.length === 0;

            if (isExistingUser && data.user) {
                console.log('AuthContext: Existing user detected, ensuring public profile exists...');
                // Check if profile already exists first to avoid unnecessary upserts/conflicts
                const { data: profile } = await supabase.from('users').select('id').eq('auth_user_id', data.user.id).maybeSingle();

                if (!profile) {
                    console.log('AuthContext: Profile missing for existing auth user, creating now...');
                    const { error: profileError } = await supabase.from('users').insert({
                        auth_user_id: data.user.id,
                        username: finalEmail,
                        name: name.trim(),
                        role: role,
                        area_id: areaId?.trim(),
                        is_active: false
                    });

                    if (profileError) {
                        console.error('AuthContext: Manual profile creation failed:', profileError);
                        // We don't throw here if it's just a profile issue, but we log it
                    } else {
                        console.log('AuthContext: Public profile created successfully.');
                    }
                } else {
                    console.log('AuthContext: Profile already exists.');
                }
            } else if (data.user) {
                console.log('AuthContext: New user detected, relying on DB trigger for profile creation.');
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
