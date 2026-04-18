// src/stores/authStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from '@/lib/api';
import { clearAuthCookies, syncAuthCookies, purgeAllAuthState, updateLastActive, isSessionIdle } from '@/lib/auth-helpers';

interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    avatar_url?: string;
    email_verified_at?: string | null;
    is_admin?: boolean;
}

// [FIX TS-03] Typed API response shapes — eliminates `response: any` in auth flows
interface AuthResponse {
    success: boolean;
    data?: {
        user: User;
        token: string;
    };
    message?: string;
}

/** Library item as returned by GET /api/library */
export interface LibraryItem {
    id: string;
    order_item_id?: string; // [FIX-DL] Actual OrderItem ID for download endpoint
    template_id: string;
    order_id: string;
    order_number?: string;
    purchased_at: string;
    title: string;
    thumbnail: string | null;
    type?: string;
    slug?: string;
    category_name: string;
    price_paid: number;
    order_status: string;
    variant_name?: string;
}

interface LibraryResponse {
    success: boolean;
    data: LibraryItem[];
    meta: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    rememberMe: boolean;
    _hasHydrated: boolean;
    _lastCheckTime: number;

    // Auth actions
    login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
    register: (name: string, email: string, password: string) => Promise<void>;
    socialLogin: (firebaseToken: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: (forceRefresh?: boolean) => Promise<void>;
    fetchUser: () => Promise<void>;
    setHasHydrated: (state: boolean) => void;
}

// Helper to normalize role
const normalizeRole = (role: string | undefined): string => {
    if (!role) return 'user';
    return role.toLowerCase();
};

// Helper to persist token based on Remember Me preference
const persistToken = (token: string | null, rememberMe: boolean) => {
    if (!token || typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
    if (rememberMe) {
        localStorage.setItem('auth_remember', 'true');
    } else {
        localStorage.removeItem('auth_remember');
        sessionStorage.setItem('auth_session_active', 'true');
    }
};

/**
 * After login/register: remove already-owned items from the guest cart.
 * [FIX Q-03] Uses api.getLibrary() — the unified source of truth,
 * instead of fetching all orders and iterating through items.
 */
const mergeGuestCart = async () => {
    try {
        const { useCartStore } = await import('@/stores/cartStore');
        const cartItems = useCartStore.getState().items;
        if (cartItems.length === 0) return;

        // [FIX Q-03] Use dedicated library endpoint (consistent with PaymentWall + my-library page)
        const libraryRes = await api.getLibrary({ per_page: 100 }).catch(() => ({ data: [] }));
        const libraryItems: { template_id: string }[] = (libraryRes as any)?.data || [];

        const ownedIds = new Set<string>(libraryItems.map((item) => item.template_id));

        // Remove items the user already owns
        cartItems.forEach(item => {
            if (ownedIds.has(item.templateId)) {
                useCartStore.getState().removeItem(item.templateId);
            }
        });
    } catch {
        // Non-critical — ignore errors
    }
};

const handleAuthSuccess = (
    set: (state: Partial<AuthState>) => void,
    // [FIX TS-03] Proper AuthResponse type instead of `any`
    response: AuthResponse,
    rememberMe: boolean = true
) => {
    const user = response.data?.user;
    const token = response.data?.token;
    if (user) user.role = normalizeRole(user.role);
    set({ user: user ?? null, token: token ?? null, isAuthenticated: !!user, isLoading: false, rememberMe, _lastCheckTime: Date.now() });
    persistToken(token ?? null, rememberMe);
    // [AUTH-HIGH-01 FIX] Sync token+role to cookies for Edge middleware
    // [SESSION] Pass rememberMe so cookie expiry matches backend token
    syncAuthCookies(token ?? null, user?.role ?? null, rememberMe);
    // [SESSION] Initialize activity tracker
    updateLastActive();
    // Merge guest cart after login (non-blocking)
    mergeGuestCart();
};

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            rememberMe: false,
            _hasHydrated: false,
            _lastCheckTime: 0,

            setHasHydrated: (state: boolean) => {
                set({ _hasHydrated: state });
            },

            // تسجيل الدخول العادي مع خيار "تذكرني"
            login: async (email, password, rememberMe = false) => {
                set({ isLoading: true });
                try {
                    // [FIX TS-03] Proper return type via generic — no more `any`
                    const response = await api.login({ email, password, remember: rememberMe }) as AuthResponse;
                    handleAuthSuccess(set, response, rememberMe);
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // التسجيل — يعامل كـ rememberMe=true (أول تسجيل)
            register: async (name, email, password) => {
                set({ isLoading: true });
                try {
                    const response = await api.register({
                        name,
                        email,
                        password,
                        password_confirmation: password,
                    }) as AuthResponse;
                    handleAuthSuccess(set, response, true);
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // 🔐 تسجيل الدخول الاجتماعي — يعامل كـ rememberMe=true
            socialLogin: async (firebaseToken: string) => {
                set({ isLoading: true });
                try {
                    const response = await api.socialLogin(firebaseToken) as AuthResponse;
                    handleAuthSuccess(set, response, true);
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            // تسجيل الخروج — optimized: parallel cleanup
            logout: async () => {
                // Clear state immediately — don't wait for API
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                    isLoading: false,
                    rememberMe: false,
                });

                if (typeof window !== 'undefined') {
                    purgeAllAuthState();
                }

                // Run all cleanup in parallel — don't block UI
                // Cart is NOT cleared on logout — it stays saved for when
                // the user logs back in. The UI hides "In Cart" for guests.
                Promise.allSettled([
                    api.logout().catch(() => {}),
                    import('@/lib/firebase').then(({ auth }) => {
                        if (auth?.currentUser) return auth.signOut();
                    }).catch(() => {}),
                    import('@/stores/wishlistStore').then(({ useWishlistStore }) => {
                        useWishlistStore.getState().clearWishlist?.();
                    }).catch(() => {}),
                ]);
            },

            // التحقق من الجلسة — debounced, skip if already authenticated
            checkAuth: async (forceRefresh = false) => {
                if (get().isLoading) return;

                // If already authenticated with user data, apply debounce (skip if force)
                if (!forceRefresh && get().isAuthenticated && get().user) {
                    const now = Date.now();
                    const lastCheck = get()._lastCheckTime;
                    if (now - lastCheck < 300_000) return; // [HL-05 FIX] 5-min debounce (was 1-min)
                    // After 5 min, silently re-fetch to detect role changes (admin promotion etc.)
                }

                // [SESSION] Smart session checks
                if (typeof window !== 'undefined') {
                    const rememberMe = localStorage.getItem('auth_remember') === 'true';
                    const sessionActive = sessionStorage.getItem('auth_session_active');
                    
                    // [SESSION] Check 1: Browser was closed without "Remember Me"
                    if (!rememberMe && !sessionActive && get().token) {
                        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                        purgeAllAuthState();
                        return;
                    }

                    // [SESSION] Check 2: Idle timeout — admin 30min, user 60min
                    if (get().isAuthenticated && get().user) {
                        const userIsAdmin = get().user?.role?.toLowerCase() === 'admin';
                        if (isSessionIdle(userIsAdmin)) {
                            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
                            purgeAllAuthState();
                            return;
                        }
                    }

                    // No token at all — skip API call
                    if (!get().token && !localStorage.getItem('auth_token')) {
                        set({ _hasHydrated: true } as any);
                        return;
                    }
                }

                set({ isLoading: true });

                try {
                    const now = Date.now();
                    // [PERF-AUTH] Absolute 8s deadline — even if the API call has its own
                    // timeout, this guarantees we never block the UI longer than 8 seconds.
                    const timeoutPromise = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error('auth_timeout')), 8000)
                    );
                    const response: any = await Promise.race([api.getMe(), timeoutPromise]);
                    const user = response.data?.user;

                    if (user) {
                        user.role = normalizeRole(user.role);
                        set({
                            user,
                            isAuthenticated: true,
                            isLoading: false,
                            _hasHydrated: true,
                            _lastCheckTime: now,
                        });
                        // [SESSION] Update activity on successful auth check
                        updateLastActive();
                    } else {
                        // Valid response but no user — clear session
                        set({
                            user: null,
                            token: null,
                            isAuthenticated: false,
                            isLoading: false,
                            _hasHydrated: true,
                        });
                        if (typeof window !== 'undefined') {
                            purgeAllAuthState();
                        }
                    }
                } catch {
                    // Network error or 401 — clear session and unblock UI
                    set({
                        user: null,
                        token: null,
                        isAuthenticated: false,
                        isLoading: false,
                        _hasHydrated: true,
                    });
                    if (typeof window !== 'undefined') {
                        purgeAllAuthState();
                    }
                }
            },

            // إعادة جلب بيانات المستخدم (للـ Silent Refresh)
            fetchUser: async () => {
                try {
                    const response: any = await api.getMe();
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
                token: state.token,
                isAuthenticated: state.isAuthenticated,
                rememberMe: state.rememberMe,
                _lastCheckTime: state._lastCheckTime,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);
