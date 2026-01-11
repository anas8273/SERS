// src/stores/authStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatar_url?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    _hasHydrated: boolean;

    // Auth actions
    login: (email: string, password: string) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    socialLogin: (firebaseToken: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    fetchUser: () => Promise<void>;
    setHasHydrated: (state: boolean) => void;
}

// Helper to normalize role
const normalizeRole = (role: string | undefined): string => {
    if (!role) return 'user';
    return role.toLowerCase();
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false, // Start as FALSE - we check on mount
            _hasHydrated: false,

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            // تسجيل الدخول العادي
            login: async (email, password) => {
                set({ isLoading: true });

                try {
                    const response = await api.login({ email, password });
                    const user = response.data.user;

                    // Normalize role
                    if (user) user.role = normalizeRole(user.role);

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // التسجيل
            register: async (name, email, password) => {
                set({ isLoading: true });

                try {
                    const response = await api.register({
                        name,
                        email,
                        password,
                        password_confirmation: password,
                    });
                    const user = response.data.user;

                    // Normalize role
                    if (user) user.role = normalizeRole(user.role);

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // 🔐 تسجيل الدخول الاجتماعي (Google / Firebase)
            socialLogin: async (firebaseToken: string) => {
                set({ isLoading: true });

                try {
                    const response = await api.socialLogin(firebaseToken);
                    const user = response.data.user;

                    // Normalize role
                    if (user) user.role = normalizeRole(user.role);

                    set({
                        user,
                        isAuthenticated: true,
                        isLoading: false,
                    });
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // تسجيل الخروج
            logout: async () => {
                try {
                    await api.logout();
                } catch {
                    // Ignore logout errors
                }

                set({
                    user: null,
                    isAuthenticated: false,
                    isLoading: false,
                });
            },

            // التحقق من الجلسة - CRITICAL: Must always set isLoading to false
            checkAuth: async () => {
                // Don't recheck if already loading
                if (get().isLoading) return;

                set({ isLoading: true });

                try {
                    const response = await api.getMe();
                    const user = response.data?.user;

                    if (user) {
                        // Normalize role
                        user.role = normalizeRole(user.role);

                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                        });
                    } else {
                        set({
                            user: null,
                            isAuthenticated: false,
                            isLoading: false,
                        });
                    }
                } catch {
                    set({
                        user: null,
                        isAuthenticated: false,
                        isLoading: false,
                    });
                }
            },

            // إعادة جلب بيانات المستخدم
            fetchUser: async () => {
                try {
                    const response = await api.getMe();
                    const user = response.data?.user;
                    if (user) {
                        user.role = normalizeRole(user.role);
                        set({ user });
                    }
                } catch {
                    // Ignore errors
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
            onRehydrateStorage: () => (state) => {
                // Mark as hydrated when localStorage is loaded
                state?.setHasHydrated(true);
            },
        }
    )
);

