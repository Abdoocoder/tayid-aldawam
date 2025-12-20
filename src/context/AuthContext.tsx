"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-browser';
import { User, UserRole } from './AttendanceContext';

interface AuthContextType {
    user: SupabaseUser | null;
    appUser: User | null;
    isLoading: boolean;
    error: string | null;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithGithub: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [appUser, setAppUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [supabase] = useState(() => createClient()); // Initialize once and persist

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
                setIsLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadAppUser = async (authUserId: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('auth_user_id', authUserId)
                .eq('auth_user_id', authUserId)
                .maybeSingle();

            if (error) {
                console.error('Database error loading app user:', error);
                throw error;
            }

            if (data) {
                setAppUser({
                    id: data.id,
                    username: data.username,
                    name: data.name,
                    role: data.role as UserRole,
                    areaId: data.area_id,
                });
            } else {
                console.warn('No app user profile found for auth user:', authUserId);
                setAppUser(null);
            }
        } catch (err) {
            console.error('Failed to load app user:', err);
            setError('فشل تحميل بيانات المستخدم');
        } finally {
            setIsLoading(false);
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            setError(null);
            setIsLoading(true);

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // User will be loaded via onAuthStateChange
        } catch (err: any) {
            console.error('Sign in error:', err);
            setError(err.message || 'فشل تسجيل الدخول');
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signUp = async (email: string, password: string, name: string, role: UserRole) => {
        try {
            setError(null);
            setIsLoading(true);

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name,
                        role,
                    },
                },
            });

            if (error) throw error;

            // Note: User might need to verify email depending on Supabase settings
        } catch (err: any) {
            console.error('Sign up error:', err);
            setError(err.message || 'فشل إنشاء الحساب');
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
        } catch (err: any) {
            console.error('Google sign in error:', err);
            setError(err.message || 'فشل تسجيل الدخول عبر Google');
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
        } catch (err: any) {
            console.error('GitHub sign in error:', err);
            setError(err.message || 'فشل تسجيل الدخول عبر GitHub');
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
        } catch (err: any) {
            console.error('Sign out error:', err);
            setError(err.message || 'فشل تسجيل الخروج');
            throw err;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                appUser,
                isLoading,
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
