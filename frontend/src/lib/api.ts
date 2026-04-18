// src/lib/api.ts

import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types';
import { cache, CACHE_KEYS, CACHE_TTL } from './cache';

// Deduplicate toast errors — prevent the same message from flooding the UI
const _shownErrors = new Set<string>();
function showErrorToast(message: string) {
    if (_shownErrors.has(message)) return;
    _shownErrors.add(message);
    setTimeout(() => _shownErrors.delete(message), 5000);
    import('react-hot-toast').then(({ default: toast }) => toast.error(message));
}

class ApiClient {
    private client: AxiosInstance;
    private pendingRequests = new Map<string, Promise<unknown>>();

    constructor() {
        this.client = axios.create({
            baseURL: '/api',
            timeout: 20000, // 20s default — generous for slow machines/first-load
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br', // [PERF] Request compressed responses
            },
        });

        // [IMP-05] Adaptive timeout: Firestore/AI/PDF/admin endpoints get 60s timeout
        // These endpoints are known to be slow due to external API calls (Firestore, AI, etc.)
        const SLOW_ENDPOINT_PATTERNS = [
            '/ai/', '/ai-', 'suggestions', 'fill-all', 'export', 'pdf', 'generate',
            '/admin/stats', '/dashboard/summary',
            '/services/',                  // User educational services → Firestore REST API (1-3s)
            '/educational-services/',      // Admin educational services → Firestore REST API
            '/admin/orders',               // Admin orders list with joins
            '/admin/users',                // Admin users list
            '/admin/withdrawals',          // Admin withdrawals
            '/admin/custom-requests',      // Admin custom requests
            '/custom-requests',            // User custom requests
            '/admin/activity-logs',        // Activity logs with joins
            '/notifications',              // Notifications
            '/library',                    // User library
        ];
        this.client.interceptors.request.use((config) => {
            const url = config.url?.toLowerCase() ?? '';
            const isSlow = SLOW_ENDPOINT_PATTERNS.some(p => url.includes(p));
            if (isSlow && (!config.timeout || config.timeout <= 20000)) {
                config.timeout = 60000; // 60s for AI/PDF/export/admin
            }
            return config;
        });

        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                let errorMessage = 'حدث خطأ غير متوقع';

                if (error.response) {
                    const status = error.response.status;
                    const dataMessage = error.response.data?.message;
                    const requestUrl = error.config?.url || '';

                    // Check if this is an auth endpoint (login/register/social)
                    const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/social'].some(
                        path => requestUrl.includes(path)
                    );

                    // Auth endpoints: ALWAYS pass the raw AxiosError to the form
                    // so it can read response.status, response.data.errors, etc.
                    if (isAuthEndpoint) {
                        return Promise.reject(error);
                    }

                    if (status === 401) {
                        // For other endpoints, 401 = expired session
                        errorMessage = 'انتهت الجلسة، يرجى تسجيل الدخول مجدداً';
                        if (typeof window !== 'undefined') {
                            // [SESSION-FIX] Clear cookies & storage IMMEDIATELY on 401.
                            // This MUST happen synchronously before any redirect, otherwise
                            // the Edge middleware will see the stale auth-token cookie and
                            // redirect /login → /dashboard → checkAuth → 401 → infinite loop.
                            const isSecure = window.location.protocol === 'https:';
                            const secureAttr = isSecure ? '; Secure' : '';
                            document.cookie = `auth-token=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
                            document.cookie = `auth-role=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
                            localStorage.removeItem('auth_token');
                            localStorage.removeItem('auth_remember');
                            sessionStorage.removeItem('auth_session_active');

                            // Now dispatch the event so SessionTimeoutWarning can show the modal
                            window.dispatchEvent(new Event('session-expired'));
                        }
                    } else if (status === 403) {
                        errorMessage = 'لا تملك الصلاحية للقيام بهذه العملية';
                    } else if (status === 404) {
                        errorMessage = 'المورد المطلوب غير موجود';
                    } else if (status === 408) {
                        errorMessage = 'انتهت مهلة الطلب، يرجى المحاولة مرة أخرى';
                    } else if (status === 429) {
                        const retryAfter = error.response.headers?.['retry-after'];
                        errorMessage = retryAfter
                            ? `تم تجاوز الحد المسموح. يرجى الانتظار ${retryAfter} ثانية`
                            : 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً';
                    } else if (status === 400 || status === 422) {
                        errorMessage = dataMessage || 'بيانات غير صالحة، يرجى التحقق من المدخلات';
                    } else if (status === 413) {
                        errorMessage = 'حجم الملف كبير جداً. يرجى تقليل الحجم والمحاولة مرة أخرى';
                    } else if (status >= 500) {
                        errorMessage = dataMessage || 'حدث خطأ في الخادم، يرجى المحاولة لاحقاً';
                    } else {
                        errorMessage = dataMessage || errorMessage;
                    }

                    // Display toast only for ACTIONABLE errors that the user can fix.
                    // Skip toasts for:
                    //   - 401: handled by session-expired event
                    //   - 404 on GET: just means "no data" — component shows empty state
                    //   - 500: generic server error — component catch block handles it
                    const isSilent = error.config?._silentError === true;
                    const isGetRequest = (error.config?.method || 'get').toLowerCase() === 'get';
                    const showToast = !isSilent
                        && typeof window !== 'undefined'
                        && status !== 401
                        && !(status === 404 && isGetRequest) // 404 on GET = empty data, not error
                        && status < 500;                      // 5xx = server issue, not user's fault
                    if (showToast) {
                        showErrorToast(errorMessage);
                    }
                    
                    throw new Error(errorMessage);
                } else if (error.code === 'ECONNABORTED' || error.request) {
                    // ─── Network / Timeout errors ────────────────────────────
                    // These are TRANSIENT — retry silently up to 2 times.
                    // NEVER show a toast for these because:
                    //   1. The retry usually succeeds (backend was just slow to start)
                    //   2. Flooding the UI with red toasts is terrible UX
                    //   3. Each page has its own loading state to handle this
                    const retryCount = (error.config?._retryCount ?? 0);
                    if (retryCount < 2) {
                        error.config._retryCount = retryCount + 1;
                        const delay = (retryCount + 1) * 1000; // 1s, 2s
                        await new Promise(r => setTimeout(r, delay));
                        return this.client.request(error.config);
                    }
                    // All retries exhausted — throw silently (NO toast)
                    // The calling component will catch this and show its own empty/error state
                    errorMessage = error.code === 'ECONNABORTED'
                        ? 'انتهت مهلة الاتصال بالخادم'
                        : 'لا يمكن الاتصال بالخادم';
                    throw new Error(errorMessage);
                }

                // Unknown errors — also suppress toast (safety net)
                throw new Error(errorMessage);
            }
        );
        this.client.interceptors.request.use((config) => {
            if (typeof window !== 'undefined') {
                // [FIX] لا ترسل Authorization header لطلبات المصادقة العامة
                // إرسال token قديم/منتهي مع /auth/social يسبب 401
                const PUBLIC_AUTH_PATHS = ['/auth/login', '/auth/register', '/auth/social', '/auth/check-email'];
                const isPublicAuth = PUBLIC_AUTH_PATHS.some(path => config.url?.includes(path));
                if (isPublicAuth) return config;

                // [H-5] Read from a dedicated token key — not fragile Zustand internals
                const token = localStorage.getItem('auth_token')
                    ?? (() => {
                        // Fallback: try reading from Zustand persisted state (for sessions
                        // created before this fix, so existing logged-in users aren't logged out)
                        try {
                            const raw = localStorage.getItem('auth-storage');
                            if (raw) {
                                const { state } = JSON.parse(raw);
                                if (state?.token) {
                                    // Migrate to the dedicated key going forward
                                    localStorage.setItem('auth_token', state.token);
                                    return state.token;
                                }
                            }
                        } catch { /* ignore */ }
                        return null;
                    })();
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        });
    }

    // ──────────────────────────────────────────────
    // Generic HTTP methods — typed (TS-01, TS-02)
    // [PERF-M3] GET uses request deduplication:
    //   Two components calling get('/templates') at the same time
    //   will share ONE network request — not fire two.
    // [PERF-M3] Network errors get automatic retry with exponential backoff:
    //   Attempt 1: immediate → Attempt 2: +500ms → Attempt 3: +1000ms
    //   Only retries on network failure (ECONNABORTED / no response),
    //   NEVER on 4xx/5xx (server errors are intentional).
    // ──────────────────────────────────────────────

    async get<T = unknown>(url: string, config?: Record<string, unknown>): Promise<T> {
        // Deduplication key: URL + serialized params
        const dedupKey = url + (config?.params ? JSON.stringify(config.params) : '');

        // If an identical in-flight GET request exists, reuse its promise
        if (this.pendingRequests.has(dedupKey)) {
            return this.pendingRequests.get(dedupKey)! as Promise<T>;
        }

        const request = this.client.get<T>(url, config as any)
            .then(r => r.data as T)
            .finally(() => this.pendingRequests.delete(dedupKey));

        this.pendingRequests.set(dedupKey, request);
        return request;
    }

    async post<T = unknown>(url: string, payload?: Record<string, unknown> | FormData | null, config?: Record<string, unknown>) {
        const { data } = await this.client.post<T>(url, payload, config as any);
        return data as T;
    }

    async put<T = unknown>(url: string, payload?: Record<string, unknown> | null, config?: Record<string, unknown>) {
        const { data } = await this.client.put<T>(url, payload, config as any);
        return data as T;
    }

    async delete<T = unknown>(url: string, config?: Record<string, unknown>) {
        const { data } = await this.client.delete<T>(url, config as any);
        return data as T;
    }

    async patch<T = unknown>(url: string, payload?: Record<string, unknown> | null, config?: Record<string, unknown>) {
        const { data } = await this.client.patch<T>(url, payload, config as any);
        return data as T;
    }

    /**
     * =========================
     * Auth
     * =========================
     */
    async login(payload: { email: string; password: string; remember?: boolean }): Promise<ApiResponse> {
        const { data } = await this.client.post('/auth/login', payload);
        return data;
    }

    async register(payload: { name: string; email: string; password: string; password_confirmation: string; phone?: string }): Promise<ApiResponse> {
        const { data } = await this.client.post('/auth/register', payload);
        return data;
    }

    async logout(): Promise<ApiResponse> {
        const { data } = await this.client.post('/auth/logout');
        return data;
    }

    async socialLogin(token: string): Promise<ApiResponse> {
        const { data } = await this.client.post('/auth/social', { firebase_token: token });
        return data;
    }

    async getMe(): Promise<ApiResponse> {
        // Deduplicate concurrent /auth/me calls
        const key = 'auth/me';
        if (this.pendingRequests.has(key)) {
            return this.pendingRequests.get(key)! as Promise<ApiResponse>;
        }
        // [PERF-AUTH] Tight 5s timeout for auth checks — never block the dashboard
        // longer than this. On slow/offline backends the user gets redirected to login
        // quickly instead of staring at a spinner for 60+ seconds.
        const promise = this.client.get('/auth/me', {
            _silentError: true,
            timeout: 5000,
            _retryCount: 99, // Disable automatic retry for auth checks
        } as any)
            .then(r => r.data)
            .finally(() => this.pendingRequests.delete(key));
        this.pendingRequests.set(key, promise);
        return promise as Promise<ApiResponse>;
    }

    async changePassword(payload: {
        current_password: string;
        new_password: string;
        new_password_confirmation: string;
    }): Promise<ApiResponse> {
        const { data } = await this.client.post('/user/password', payload);
        return data;
    }

    async updateProfile(formData: FormData): Promise<ApiResponse> {
        const { data } = await this.client.post('/user/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    /**
     * =========================
     * Dashboard
     * =========================
     */
    // [FIX-CRITICAL] getDashboardSummary was called in dashboard/page.tsx but missing from api.ts
    // Without this, the dashboard crashes immediately with a TypeError (White Screen)
    async getDashboardSummary(): Promise<ApiResponse> {
        const { data } = await this.client.get('/dashboard/summary');
        return data;
    }

    /**
     * =========================
     * Templates
     * =========================
     */
    async getTemplates(params?: Record<string, string | number | boolean>) {
        const { data } = await this.client.get('/templates', { params });
        return data;
    }

    async getFeaturedTemplates() {
        return cache.getOrSet('featured_templates', async () => {
            return this.getTemplates({ featured: 1 });
        }, CACHE_TTL.MEDIUM);
    }

    async getTemplate(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}`);
        return data;
    }

    async searchTemplates(params: string | { query: string; limit?: number; category_id?: string; is_interactive?: boolean }) {
        const searchParams = typeof params === 'string'
            ? { q: params }
            : { q: params.query, limit: params.limit, category_id: params.category_id, is_interactive: params.is_interactive };
        const { data } = await this.client.get('/templates/search', {
            params: searchParams,
        });
        return data;
    }

    async getTemplateForEditor(slug: string) {
        // Backend does not have /editor sub-route — use the standard show route
        const { data } = await this.client.get(`/templates/${slug}`);
        return data;
    }

    async exportTemplate(recordId: string, format: string = 'pdf') {
        const { data } = await this.client.post(`/templates/export/${recordId}`, { format });
        return data;
    }

    async uploadFileForQR(formData: FormData) {
        // Backend route: POST /qrcode/generate (with file payload)
        const { data } = await this.client.post('/qrcode/generate', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async generateQRCode(payload: Record<string, unknown>) {
        // Backend route: POST /qrcode/generate
        const { data } = await this.client.post('/qrcode/generate', payload);
        return data;
    }

    /**
     * =========================
     * Categories & Sections
     * =========================
     */
    async getSections() {
        return cache.getOrSet('sections_list', async () => {
            const { data } = await this.client.get('/sections', { _silentError: true } as any);
            return data;
        }, CACHE_TTL.MEDIUM);
    }

    async getPublicStats() {
        const { data } = await this.client.get('/stats/public', { _silentError: true } as any);
        return data;
    }

    async getSection(slug: string) {
        const { data } = await this.client.get(`/sections/${slug}`);
        return data;
    }


    async getTemplatesBySection(sectionSlug: string, params?: Record<string, string | number | boolean>) {
        // [FIX] Correct route: /templates/section/{slug} (not /sections/{slug}/templates)
        const { data } = await this.client.get(`/templates/section/${sectionSlug}`, { params });
        return data;
    }

    async getCategories() {
        return cache.getOrSet(CACHE_KEYS.CATEGORIES, async () => {
            const { data } = await this.client.get('/categories', { _silentError: true } as any);
            return data;
        }, CACHE_TTL.MEDIUM);
    }

    async getCategory(slug: string) {
        const { data } = await this.client.get(`/categories/${slug}`);
        return data;
    }

    async getTemplatesByCategory(categorySlug: string) {
        // [FIX-1] Correct route: /templates/category/{slug} — api.php line 142
        // Old: /categories/${categorySlug}/templates → 404 (route doesn't exist)
        const { data } = await this.client.get(`/templates/category/${categorySlug}`);
        return data;
    }

    /**
     * =========================
     * Orders & Cart
     * =========================
     */
    async createOrder(payload: { items: Array<{ template_id: string }>; payment_method?: string; coupon_code?: string }) {
        const { data } = await this.client.post('/orders', payload);
        return data;
    }

    async payOrder(orderId: string | number, paymentMethod: string = 'wallet') {
        const { data } = await this.client.post(`/orders/${orderId}/pay`, { payment_method: paymentMethod });
        return data;
    }

    async getOrders(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/orders', config);
        return data;
    }

    async getOrder(id: string) {
        const { data } = await this.client.get(`/orders/${id}`);
        return data;
    }

    /**
     * =========================
     * Library — [FIX HL-04] Single source of truth via /api/library
     * Replaces the pattern of GET /orders?per_page=100 + filter completed
     * [FIX TS-04] Strongly typed with LibraryItem response shape
     * =========================
     */
    async getLibrary(params?: { page?: number; per_page?: number; q?: string; sort?: 'asc' | 'desc' }) {
        // Uses typed generic to avoid `any` at call sites
        return this.client.get<{
            success: boolean;
            data: import('@/stores/authStore').LibraryItem[];
            meta: { current_page: number; last_page: number; total: number; per_page: number };
        }>('/library', { params }).then(r => r.data);
    }

    async getLibraryCount(): Promise<{ success: boolean; data: { count: number } }> {
        return this.client.get<{ success: boolean; data: { count: number } }>(
            '/library/count',
            { _silentError: true } as any
        ).then(r => r.data);
    }


    async downloadFile(orderItemId: string) {
        // Backend route: GET /downloads/{id}
        const { data } = await this.client.get(`/downloads/${orderItemId}`, {
            responseType: 'blob'
        });
        return data;
    }

    async validateCoupon(code: string, total?: number) {
        const { data } = await this.client.post('/coupons/validate', { code, total });
        return data;
    }

    /**
     * =========================
     * Wishlist
     * =========================
     */
    async getWishlist() {
        const { data } = await this.client.get('/wishlists');
        return data;
    }

    async getWishlistIds(config?: Record<string, unknown>): Promise<string[]> {
        const { data } = await this.client.get('/wishlists/ids', config);
        return data?.data ?? [];
    }

    async toggleWishlist(templateId: string) {
        const { data } = await this.client.post('/wishlists/toggle', { template_id: templateId });
        return data;
    }

    /**
     * =========================
     * Wallet
     * =========================
     */
    async getWalletBalance(): Promise<ApiResponse> {
        const { data } = await this.client.get('/payments/wallet/balance');
        return data;
    }

    async getWalletTransactions(page = 1, bust = false): Promise<ApiResponse> {
        const { data } = await this.client.get('/payments/wallet/transactions', {
            params: { page, ...(bust ? { bust: 1 } : {}) }
        });
        return data;
    }

    async walletTopup(amount: number): Promise<ApiResponse> {
        const { data } = await this.client.post('/payments/wallet/topup', { amount });
        return data;
    }

    async confirmWalletTopup(paymentIntentId: string): Promise<ApiResponse> {
        const { data } = await this.client.post('/payments/wallet/confirm-topup', { payment_intent_id: paymentIntentId });
        return data;
    }

    async createPaymentIntent(orderId: string): Promise<ApiResponse> {
        const { data } = await this.client.post('/payments/create-intent', { order_id: orderId });
        return data;
    }

    /**
     * =========================
     * Template Reviews
     * =========================
     */
    async getTemplateReviews(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/reviews`);
        return data;
    }

    async canReviewTemplate(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/can-review`);
        return data;
    }

    async createReview(slug: string, payload: { rating: number; comment?: string }) {
        const { data } = await this.client.post(`/templates/${slug}/reviews`, payload);
        return data;
    }

    /**
     * =========================
     * AI
     * =========================
     */
    /**
     * [LOCALE] Read the active locale from the cookie set by I18nProvider.
     * Falls back to 'ar' (Saudi-first default).
     */
    private getLocale(): 'ar' | 'en' {
        if (typeof document === 'undefined') return 'ar';
        const match = document.cookie.match(/(?:^|;\s*)locale=(\w+)/);
        return match?.[1] === 'en' ? 'en' : 'ar';
    }

    async getAISuggestion(payload: {
        template_id: number | undefined;
        field_name: string;
        title: string;
        current_values: Record<string, unknown>;
        /** Human-readable Arabic field label — sent to backend for expert-persona selection */
        field_label?: string;
        /** Optional admin-defined AI hint for this field */
        ai_hint?: string;
        /** Locale override — auto-detected from cookie if omitted */
        locale?: 'ar' | 'en';
        /** Last generated suggestion — sent on re-generate to prevent repetition */
        previous_suggestion?: string;
        /** Re-generate attempt number (1, 2, 3...) — backend boosts creativity */
        attempt?: number;
    }) {
        // Backend route: POST /ai/suggest (not /ai/suggest-field)
        const { data } = await this.client.post('/ai/suggest', {
            ...payload,
            // Always send locale so backend returns the correct language
            locale: payload.locale ?? this.getLocale(),
        });
        return data;
    }

    async getAIFillAll(payload: {
        template_id: number | undefined;
        title: string;
        current_values: Record<string, unknown>;
        locale?: 'ar' | 'en';
    }) {
        const { data } = await this.client.post('/ai/fill-all', {
            ...payload,
            locale: payload.locale ?? this.getLocale(),
        });
        return data;
    }

    async getContextualAISuggestion(payload: {
        template_id: string;
        field_name: string;
        user_input?: string;
        service_type?: string;
        locale?: string;
        current_values?: Record<string, unknown>;
    }) {
        const { data } = await this.client.post('/ai/contextual-suggest', payload);
        return data;
    }

    async getBulkAISuggestions(payload: {
        template_id: string;
        current_values: Record<string, unknown>;
        title?: string;
    }) {
        const { data } = await this.client.post('/ai/bulk-suggest', payload);
        return data;
    }

    async getAIConversations() {
        const { data } = await this.client.get('/ai/conversations');
        return data;
    }

    async getAIConversation(id: string | number) {
        const { data } = await this.client.get(`/ai/conversations/${id}`);
        return data;
    }

    // [FIX-3] createAIConversation removed — was dead code pointing to non-existent
    // POST /ai/conversations backend route. The chat() endpoint creates conversations
    // implicitly. If explicit conversation creation is needed in future, add the route first.

    async deleteAIConversation(id: string | number) {
        const { data } = await this.client.delete(`/ai/conversations/${id}`);
        return data;
    }

    async chatWithAI(message: string, conversationId?: string | number, locale?: string) {
        const { data } = await this.client.post('/ai/chat', {
            message,
            conversation_id: conversationId,
            locale: locale || 'ar',
        });
        return data;
    }

    async suggestPlan(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/ai/suggest-plan', payload);
        return data;
    }

    async suggestCertificate(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/ai/suggest-certificate', payload);
        return data;
    }

    async generatePerformanceReport(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/ai/generate-performance-report', payload);
        return data;
    }

    async generateAchievementDoc(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/ai/generate-achievement-doc', payload);
        return data;
    }

    async generateCurriculum(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/ai/generate-curriculum', payload);
        return data;
    }

    async getAnalyses(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/services/analyses', config);
        return data;
    }

    async createAnalysis(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/services/analyses', payload);
        return data;
    }

    async deleteAnalysis(id: string | number) {
        const { data } = await this.client.delete(`/services/analyses/${id}`);
        return data;
    }

    async exportAnalysis(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/services/analyses/${id}/export`, { format });
        return data;
    }

    async getCertificates(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/services/certificates', config);
        return data;
    }

    async createCertificate(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/services/certificates', payload);
        return data;
    }

    async deleteCertificate(id: string | number) {
        const { data } = await this.client.delete(`/services/certificates/${id}`);
        return data;
    }

    async exportCertificate(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/services/certificates/${id}/export`, { format });
        return data;
    }

    async getPlans(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/services/plans', config);
        return data;
    }

    async createPlan(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/services/plans', payload);
        return data;
    }

    async deletePlan(id: string | number) {
        const { data } = await this.client.delete(`/services/plans/${id}`);
        return data;
    }

    async exportPlan(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/services/plans/${id}/export`, { format });
        return data;
    }

    async getTests() {
        const { data } = await this.client.get('/services/tests');
        return data;
    }

    async createTest(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/services/tests', payload);
        return data;
    }

    async deleteTest(id: string | number) {
        const { data } = await this.client.delete(`/services/tests/${id}`);
        return data;
    }

    async saveUserTemplateData(slug: string, payload: Record<string, unknown>) {
        // Backend route: POST /user-templates (store)
        const { data } = await this.client.post('/user-templates', { template_slug: slug, ...payload });
        return data;
    }

    async getPerformances() {
        const { data } = await this.client.get('/services/performances');
        return data;
    }

    async createPerformance(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/services/performances', payload);
        return data;
    }

    async deletePerformance(id: string | number) {
        const { data } = await this.client.delete(`/services/performances/${id}`);
        return data;
    }

    async exportPerformance(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/services/performances/${id}/export`, { format });
        return data;
    }

    /**
     * =========================
     * Admin
     * =========================
     */
    async getAdminStats(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/admin/stats/overview', config);
        return data;
    }

    // [AUDIT-FIX] getAdminChart was called in admin/page.tsx but was missing — caused silent chart failure
    async getAdminChart(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/admin/stats/chart', config);
        return data;
    }

    async getAdminUsers(paramsOrPage: number | Record<string, unknown> = 1, search = '', role = '') {
        const params = typeof paramsOrPage === 'object'
            ? paramsOrPage
            : { page: paramsOrPage, search, role };
        const { data } = await this.client.get('/admin/users', { params });
        return data;
    }

    async getAdminTemplates(params?: Record<string, string | number | boolean>) {
        const { data } = await this.client.get('/admin/templates', { params });
        return data;
    }

    async getAdminTemplate(id: string | number) {
        const { data } = await this.client.get(`/admin/templates/${id}`);
        return data;
    }

    async updateAdminTemplate(id: string | number, payload: FormData | Record<string, unknown>) {
        // Upload directly to backend, bypassing Next.js proxy (10MB limit)
        // Laravel needs _method=PUT for FormData since PUT doesn't support multipart
        if (payload instanceof FormData) {
            payload.append('_method', 'PUT');
        }
        const { data } = await this.directUpload(`/api/admin/templates/${id}`, payload);
        return data;
    }

    async updateTemplate(id: string | number, payload: FormData | Record<string, unknown>) {
        return this.updateAdminTemplate(id, payload);
    }

    async createTemplate(payload: FormData | Record<string, unknown>) {
        // Upload directly to backend, bypassing Next.js proxy (10MB limit)
        const { data } = await this.directUpload('/api/admin/templates', payload);
        // [FIX] Clear frontend caches so new template appears immediately
        cache.delete('featured_templates');
        cache.delete('sections_list');
        return data;
    }

    /**
     * Send file uploads directly to the Laravel backend,
     * bypassing the Next.js rewrite proxy which has a 10MB body limit.
     */
    private async directUpload(path: string, payload: FormData | Record<string, unknown>) {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8001';
        const headers: Record<string, string> = {
            // DO NOT set Content-Type manually for FormData!
            // Axios must auto-set it with the correct multipart boundary.
            'Accept': 'application/json',
        };
        // Attach auth token
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }
        return axios.post(`${backendUrl}${path}`, payload, {
            headers,
            timeout: 120000, // 2 minutes for large uploads
        });
    }

    async deleteAdminTemplate(id: string | number) {
        const { data } = await this.client.delete(`/admin/templates/${id}`);
        // [FIX] Clear frontend caches so users see deletion immediately
        cache.delete('featured_templates');
        cache.delete('sections_list');
        return data;
    }

    async deleteTemplate(id: string | number) {
        return this.deleteAdminTemplate(id);
    }

    async toggleTemplateFeatured(id: string | number) {
        const { data } = await this.client.post(`/admin/templates/${id}/toggle-featured`);
        // [FIX] Clear featured cache so homepage updates immediately
        cache.delete('featured_templates');
        return data;
    }

    async updateAdminUser(id: string | number, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/admin/users/${id}`, payload);
        return data;
    }

    async getVersionHistory(recordId: string) {
        const { data } = await this.client.get(`/user-templates/${recordId}/versions`);
        return data;
    }

    // [QUALITY-02 FIX] restoreVersion() was a duplicate of restoreRecordVersion() — removed.
    // Use restoreRecordVersion() for all version restore call sites.

    async getAdminCategories(params?: Record<string, string | number | boolean>) {
        const { data } = await this.client.get('/admin/categories', { params });
        return data;
    }
    async createCategory(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/admin/categories', payload);
        return data;
    }

    async updateCategory(id: string | number, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/admin/categories/${id}`, payload);
        return data;
    }

    async deleteCategory(id: string | number) {
        const { data } = await this.client.delete(`/admin/categories/${id}`);
        return data;
    }

    // ===== Admin Sections =====
    async getAdminSections(params?: Record<string, string | number | boolean>) {
        const { data } = await this.client.get('/admin/sections', { params });
        return data;
    }

    async createSection(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/admin/sections', payload);
        // [FIX-8] Invalidate the public sections cache so new section appears immediately
        cache.delete('sections_list');
        return data;
    }

    async updateSection(id: string, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/admin/sections/${id}`, payload);
        // [FIX-8] Invalidate so updated section name/slug appears immediately in marketplace
        cache.delete('sections_list');
        return data;
    }

    async deleteSection(id: string) {
        const { data } = await this.client.delete(`/admin/sections/${id}`);
        // [FIX-8] Invalidate sections + featured (featured templates reference sections)
        cache.delete('sections_list');
        cache.delete('featured_templates');
        return data;
    }

    async getAdminCoupons(params?: Record<string, string | number | boolean>) {
        const { data } = await this.client.get('/admin/coupons', { params });
        return data;
    }

    async createCoupon(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/admin/coupons', payload);
        return data;
    }

    async updateCoupon(id: string | number, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/admin/coupons/${id}`, payload);
        return data;
    }

    async deleteCoupon(id: string | number) {
        const { data } = await this.client.delete(`/admin/coupons/${id}`);
        return data;
    }

    async getAdminUser(id: string | number) {
        const { data } = await this.client.get(`/admin/users/${id}`);
        return data;
    }

    async toggleUserStatus(id: string | number) {
        const { data } = await this.client.post(`/admin/users/${id}/toggle-status`);
        return data;
    }

    async toggleUserRole(id: string | number) {
        const { data } = await this.client.post(`/admin/users/${id}/toggle-admin`);
        return data;
    }

    async deleteUser(id: string | number) {
        const { data } = await this.client.delete(`/admin/users/${id}`);
        return data;
    }

    async adjustUserWallet(id: string | number, payload: {
        amount: number;
        type: 'add' | 'subtract' | 'credit' | 'debit';
        description: string;
    }) {
        const { data } = await this.client.post(`/admin/users/${id}/wallet-adjust`, payload);
        return data;
    }


    async getAdminReviews(params?: Record<string, string | number | boolean>) {
        const { data } = await this.client.get('/admin/reviews', { params });
        return data;
    }

    async approveReview(id: string | number) {
        const { data } = await this.client.post(`/admin/reviews/${id}/approve`);
        return data;
    }

    async rejectReview(id: string | number) {
        const { data } = await this.client.post(`/admin/reviews/${id}/reject`);
        return data;
    }

    async deleteReview(id: string | number) {
        const { data } = await this.client.delete(`/admin/reviews/${id}`);
        return data;
    }

    async getThisWeekAchievements() {
        const { data } = await this.client.get('/services/achievements', { params: { period: 'week' } });
        return data;
    }

    /**
     * =========================
     * Educational Services (Generic CRUD)
     * Supports: distributions, plans, certificates, tests, work-evidence,
     * knowledge-production, follow-up-log, achievements, analyses, performances,
     * question-bank, worksheets
     * =========================
     */
    async getEducationalServices(serviceType: string, filters?: Record<string, string>) {
        const { data } = await this.client.get(`/services/${serviceType}`, { params: filters });
        return data;
    }

    async getEducationalService(serviceType: string, id: string) {
        const { data } = await this.client.get(`/services/${serviceType}/${id}`);
        return data;
    }

    async createEducationalService(serviceType: string, payload: Record<string, unknown>) {
        const { data } = await this.client.post(`/services/${serviceType}`, payload);
        return data;
    }

    async updateEducationalService(serviceType: string, id: string, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/services/${serviceType}/${id}`, payload);
        return data;
    }

    async deleteEducationalService(serviceType: string, id: string) {
        const { data } = await this.client.delete(`/services/${serviceType}/${id}`);
        return data;
    }

    async getEducationalServiceStats(serviceType: string) {
        const { data } = await this.client.get(`/services/${serviceType}/statistics`);
        return data;
    }

    async exportEducationalService(serviceType: string, id: string, format: string = 'pdf') {
        const { data } = await this.client.post(`/services/${serviceType}/${id}/export`, { format });
        return data;
    }

    // Legacy achievement methods (backward compatible)
    async getThisMonthAchievements() {
        const { data } = await this.client.get('/services/achievements', { params: { period: 'month' } });
        return data;
    }

    async getAchievements(config?: Record<string, unknown>) {
        const { data } = await this.client.get('/services/achievements', config);
        return data;
    }

    async createAchievement(payload: Record<string, unknown>) {
        const { data } = await this.client.post('/services/achievements', payload);
        return data;
    }

    async deleteAchievement(id: string | number) {
        const { data } = await this.client.delete(`/services/achievements/${id}`);
        return data;
    }

    async updateAchievement(id: string | number, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/services/achievements/${id}`, payload);
        return data;
    }


    /**
     * =========================
     * Admin Schema Builder (NO-CODE)
     * =========================
     */
    async getTemplateSchema(templateId: string) {
        const { data } = await this.client.get(`/admin/templates/${templateId}/schema`);
        return data;
    }

    async updateTemplateSchema(templateId: string, payload: Record<string, unknown>) {
        const { data } = await this.client.put(`/admin/templates/${templateId}/schema`, payload);
        return data;
    }

    async addTemplateField(templateId: string, payload: Record<string, unknown>) {
        const { data } = await this.client.post(`/admin/templates/${templateId}/fields`, payload);
        return data;
    }

    async removeTemplateField(templateId: string, fieldId: string) {
        const { data } = await this.client.delete(`/admin/templates/${templateId}/fields/${fieldId}`);
        return data;
    }

    async reorderTemplateFields(templateId: string, fieldOrders: Array<{ id: string; sort_order: number }>) {
        const { data } = await this.client.post(`/admin/templates/${templateId}/fields/reorder`, {
            field_orders: fieldOrders
        });
        return data;
    }

    async toggleTemplateFieldAI(templateId: string, fieldId: string) {
        const { data } = await this.client.post(`/admin/templates/${templateId}/fields/${fieldId}/toggle-ai`);
        return data;
    }

    /**
     * =========================
     * Version Control System
     * =========================
     */


    async createRecordVersion(recordId: string, payload: Record<string, unknown>) {
        const { data } = await this.client.post(`/user-templates/${recordId}/versions`, payload);
        return data;
    }

    async restoreRecordVersion(recordId: string, versionId: string) {
        const { data } = await this.client.post(`/user-templates/${recordId}/versions/${versionId}/restore`);
        return data;
    }

    async compareRecordVersions(recordId: string, version1Id: string, version2Id: string) {
        const { data } = await this.client.get(`/user-templates/${recordId}/versions/${version1Id}/compare/${version2Id}`);
        return data;
    }

    /**
     * =========================
     * Universal Analysis Engine
     * =========================
     */
    async analyzeRecord(recordId: string, options: Record<string, unknown> = {}) {
        const { data } = await this.client.post(`/user-templates/${recordId}/analyze`, options);
        return data;
    }

    async batchAnalyzeRecords(recordIds: string[], options: Record<string, unknown> = {}) {
        const { data } = await this.client.post('/user-templates/batch-analyze', {
            record_ids: recordIds,
            ...options
        });
        return data;
    }

    /**
     * =========================
     * Production PDF Engine (Payment Protected)
     * =========================
     */
    async generateRecordPDF(recordId: string, options: Record<string, unknown> = {}) {
        const { data } = await this.client.post(`/user-templates/${recordId}/pdf`, options);
        return data;
    }

    async generateCrossTemplatePDF(recordId: string, targetTemplateId: string, options: Record<string, unknown> = {}) {
        const { data } = await this.client.post(`/user-templates/${recordId}/cross-template-pdf/${targetTemplateId}`, options);
        return data;
    }

    /**
     * =========================
     * Admin Sections Reorder
     * =========================
     */
    async reorderSections(ids: string[]) {
        const { data } = await this.client.post('/admin/sections/reorder', { ids });
        return data;
    }

    /**
     * =========================
     * Admin Reports (Real Data)
     * =========================
     */
    async getAdminReportSales(params?: { from?: string; to?: string }) {
        const { data } = await this.client.get('/admin/reports/sales', { params });
        return data;
    }

    async getAdminReportUsers(params?: { from?: string; to?: string }) {
        const { data } = await this.client.get('/admin/reports/users', { params });
        return data;
    }

    async getAdminReportTemplates(params?: { from?: string; to?: string }) {
        const { data } = await this.client.get('/admin/reports/templates', { params });
        return data;
    }

    async getAdminReportAI(params?: { from?: string; to?: string }) {
        const { data } = await this.client.get('/admin/reports/ai', { params });
        return data;
    }

    /**
     * =========================
     * Referral System
     * =========================
     */
    async getReferralStats() {
        const { data } = await this.client.get('/referrals/stats');
        return data;
    }

    async getReferralList(params?: { page?: number; per_page?: number }) {
        const { data } = await this.client.get('/referrals/list', { params });
        return data;
    }

    async getReferralEarnings(params?: { page?: number; per_page?: number }) {
        const { data } = await this.client.get('/referrals/earnings', { params });
        return data;
    }

    async generateReferralCode() {
        const { data } = await this.client.post('/referrals/generate-code');
        return data;
    }

    async validateReferralCode(code: string) {
        const { data } = await this.client.post('/referrals/validate-code', { code });
        return data;
    }

    async applyReferralCode(code: string) {
        const { data } = await this.client.post('/referrals/apply-code', { code });
        return data;
    }

    async withdrawReferralEarnings(payload: {
        amount: number;
        method: 'bank' | 'wallet';
        account_details: Record<string, string>;
    }) {
        const { data } = await this.client.post('/referrals/withdraw', payload);
        return data;
    }

    /**
     * =========================
     * Admin Activity Logs
     * =========================
     */
    async getActivityLogs(params?: {
        page?: number;
        per_page?: number;
        action?: string;
        entity_type?: string;
        user_id?: string;
        from?: string;
        to?: string;
    }) {
        const { data } = await this.client.get('/admin/activity-logs', { params });
        return data;
    }

    async getActivityLogsSummary() {
        const { data } = await this.client.get('/admin/activity-logs/summary');
        return data;
    }

    /**
     * =========================
     * Admin Withdrawal Management
     * =========================
     */
    async getWithdrawals(params?: {
        status?: 'pending' | 'processing' | 'completed' | 'rejected';
        per_page?: number;
        page?: number;
    }) {
        const { data } = await this.client.get('/admin/withdrawals', { params });
        return data;
    }

    async getWithdrawalStats() {
        const { data } = await this.client.get('/admin/withdrawals/stats');
        return data;
    }

    async approveWithdrawal(id: string, adminNotes?: string) {
        const { data } = await this.client.post(`/admin/withdrawals/${id}/approve`, {
            admin_notes: adminNotes ?? 'تمت الموافقة',
        });
        return data;
    }

    async rejectWithdrawal(id: string, adminNotes: string) {
        const { data } = await this.client.post(`/admin/withdrawals/${id}/reject`, {
            admin_notes: adminNotes,
        });
        return data;
    }
}

export const api = new ApiClient();
