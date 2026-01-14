// src/lib/api.ts

import axios, {
    AxiosInstance,
    AxiosError,
    AxiosResponse,
} from 'axios';

/**
 * =========================
 * Configuration
 * =========================
 */
const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const TOKEN_KEY = 'auth_token';

/**
 * =========================
 * Types
 * =========================
 */
interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data: T;
}

interface AuthResponse {
    user: any;
    token: string;
}

/**
 * =========================
 * Api Client
 * =========================
 */
class ApiClient {
    private client: AxiosInstance;
    private token: string | null = null;
    private maxRetries = 3;
    private retryDelay = 1000;

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            withCredentials: true, // مهم مع Sanctum
            timeout: 30000, // 30 seconds timeout
        });

        this.initializeToken();
        this.registerInterceptors();
    }

    /**
     * =========================
     * Token Handling
     * =========================
     */
    private initializeToken() {
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem(TOKEN_KEY);
        }
    }

    private setAuthHeader(config: any) {
        if (this.token) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem(TOKEN_KEY, token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem(TOKEN_KEY);
        }
    }

    /**
     * =========================
     * Axios Interceptors
     * =========================
     */
    private registerInterceptors() {
        // Request
        this.client.interceptors.request.use((config) =>
            this.setAuthHeader(config)
        );

        // Response
        this.client.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => {
                const status = error.response?.status;
                const data = error.response?.data as Record<string, unknown>;

                // Handle 401 Unauthorized
                if (status === 401) {
                    this.clearToken();
                    if (typeof window !== 'undefined') {
                        this.showToast('انتهت جلستك، يرجى تسجيل الدخول مرة أخرى', 'error');
                        window.location.href = '/login';
                    }
                }

                // Handle 403 Forbidden
                if (status === 403) {
                    this.showToast('ليس لديك صلاحية للقيام بهذا الإجراء', 'error');
                }

                // Handle 422 Validation Errors
                if (status === 422 && data?.errors) {
                    const errors = data.errors as Record<string, string[]>;
                    const firstError = Object.values(errors)[0];
                    if (Array.isArray(firstError) && firstError.length > 0) {
                        this.showToast(firstError[0], 'error');
                    }
                }

                // Handle 429 Rate Limit
                if (status === 429) {
                    this.showToast('تم تجاوز عدد المحاولات المسموح، انتظر قليلاً', 'error');
                }

                // Handle 500 Server Errors
                if (status === 500) {
                    this.showToast('حدث خطأ في الخادم، حاول مرة أخرى لاحقاً', 'error');
                }

                return Promise.reject(this.normalizeError(error));
            }
        );
    }

    /**
     * Show toast notification (lazy import to avoid SSR issues)
     */
    private showToast(message: string, type: 'success' | 'error' = 'error') {
        if (typeof window !== 'undefined') {
            import('react-hot-toast').then(({ toast }) => {
                if (type === 'error') {
                    toast.error(message);
                } else {
                    toast.success(message);
                }
            });
        }
    }

    private normalizeError(error: AxiosError) {
        const data = error.response?.data as Record<string, unknown> | undefined;
        return {
            status: error.response?.status,
            message: (data?.message as string) ?? 'حدث خطأ غير متوقع',
            errors: data?.errors as Record<string, string[]> | undefined,
            code: data?.error as string | undefined,
        };
    }

    /**
     * Retry wrapper for API calls with exponential backoff
     */
    private async requestWithRetry<T>(
        requestFn: () => Promise<T>,
        retries = this.maxRetries
    ): Promise<T> {
        try {
            return await requestFn();
        } catch (error: any) {
            // Only retry on network errors or 5xx errors
            const isNetworkError = !error.response;
            const isServerError = error.response?.status >= 500;

            if (retries > 0 && (isNetworkError || isServerError)) {
                await new Promise((resolve) =>
                    setTimeout(resolve, this.retryDelay * (this.maxRetries - retries + 1))
                );
                return this.requestWithRetry(requestFn, retries - 1);
            }
            throw error;
        }
    }

    /**
     * =========================
     * Auth
     * =========================
     */
    async register(payload: {
        name: string;
        email: string;
        password: string;
        password_confirmation: string;
    }): Promise<ApiResponse<AuthResponse>> {
        const { data } = await this.client.post('/auth/register', payload);
        if (data.success) this.setToken(data.data.token);
        return data;
    }

    async login(payload: {
        email: string;
        password: string;
    }): Promise<ApiResponse<AuthResponse>> {
        const { data } = await this.client.post('/auth/login', payload);
        if (data.success) this.setToken(data.data.token);
        return data;
    }

    /**
     * ✅ Google / Firebase Social Login
     */
    async socialLogin(
        firebaseToken: string
    ): Promise<ApiResponse<AuthResponse>> {
        const { data } = await this.client.post('/auth/social', {
            firebase_token: firebaseToken,
        });

        if (data.success) this.setToken(data.data.token);
        return data;
    }

    async logout(): Promise<ApiResponse> {
        const { data } = await this.client.post('/auth/logout');
        this.clearToken();
        return data;
    }

    async getMe(): Promise<ApiResponse> {
        const { data } = await this.client.get('/auth/me');
        return data;
    }

    /**
     * Change user password
     */
    async changePassword(payload: {
        current_password: string;
        new_password: string;
        new_password_confirmation: string;
    }): Promise<ApiResponse> {
        const { data } = await this.client.post('/user/password', payload);
        return data;
    }

    /**
     * Update user profile
     */
    async updateProfile(formData: FormData): Promise<ApiResponse> {
        const { data } = await this.client.post('/user/profile', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    /**
     * =========================
     * Products
     * =========================
     */
    async getProducts(params?: Record<string, any>) {
        const { data } = await this.client.get('/products', { params });
        return data;
    }

    async getProduct(slug: string) {
        const { data } = await this.client.get(`/products/${slug}`);
        return data;
    }

    async searchProducts(query: string) {
        const { data } = await this.client.get('/products/search', {
            params: { q: query },
        });
        return data;
    }

    async getFeaturedProducts() {
        const { data } = await this.client.get('/products/featured');
        return data;
    }

    /**
     * =========================
     * Categories
     * =========================
     */
    async getCategories() {
        const { data } = await this.client.get('/categories');
        return data;
    }

    /**
     * =========================
     * Orders
     * =========================
     */
    async createOrder(items: { product_id: string }[]) {
        const { data } = await this.client.post('/orders', { items });
        return data;
    }

    async getOrders() {
        const { data } = await this.client.get('/orders');
        return data;
    }

    async getOrder(id: string) {
        const { data } = await this.client.get(`/orders/${id}`);
        return data;
    }

    /**
     * =========================
     * Payments
     * =========================
     */
    async createPaymentIntent(orderId: string) {
        const { data } = await this.client.post(
            '/payments/create-intent',
            { order_id: orderId }
        );
        return data;
    }

    /**
     * =========================
     * Records (Firestore)
     * =========================
     */
    async getRecords() {
        const { data } = await this.client.get('/records');
        return data;
    }

    async getRecord(recordId: string) {
        const { data } = await this.client.get(`/records/${recordId}`);
        return data;
    }

    async updateRecord(
        recordId: string,
        userData: Record<string, any>
    ) {
        const { data } = await this.client.put(`/records/${recordId}`, {
            user_data: userData,
        });
        return data;
    }

    /**
     * =========================
     * AI
     * =========================
     */
    async getAISuggestion(
        recordId: string,
        fieldName: string,
        context: Record<string, any>
    ) {
        const { data } = await this.client.post('/ai/suggest', {
            record_id: recordId,
            field_name: fieldName,
            context,
        });
        return data;
    }
    /**
     * =========================
     * Admin - Dashboard
     * =========================
     */

    /**
     * إحصائيات لوحة التحكم
     */
    async getAdminStats() {
        const { data } = await this.client.get('/admin/stats');
        return data;
    }

    /**
     * بيانات الرسم البياني (آخر 7 أيام)
     */
    async getAdminChart() {
        const { data } = await this.client.get('/admin/stats/chart');
        return data;
    }

    /**
     * =========================
     * Admin - Products
     * =========================
     */

    /**
     * قائمة جميع المنتجات (بما فيها غير النشطة)
     */
    async getAdminProducts(params?: Record<string, any>) {
        const { data } = await this.client.get('/admin/products', { params });
        return data;
    }

    /**
     * إضافة منتج جديد (مع رفع صور / ملفات)
     */
    async createProduct(formData: FormData) {
        const { data } = await this.client.post('/admin/products', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    /**
     * عرض منتج واحد (Admin)
     */
    async getAdminProduct(id: string) {
        const { data } = await this.client.get(`/admin/products/${id}`);
        return data;
    }

    /**
     * تحديث منتج
     */
    async updateProduct(id: string, formData: FormData) {
        // Laravel requires POST with _method=PUT for FormData
        formData.append('_method', 'PUT');
        const { data } = await this.client.post(`/admin/products/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    /**
     * حذف منتج
     */
    async deleteProduct(id: string) {
        const { data } = await this.client.delete(`/admin/products/${id}`);
        return data;
    }

    /**
     * =========================
     * Admin - Categories
     * =========================
     */

    /**
     * قائمة جميع التصنيفات
     */
    async getAdminCategories() {
        const { data } = await this.client.get('/admin/categories');
        return data;
    }

    /**
     * إضافة تصنيف جديد
     */
    async createCategory(payload: {
        name_ar: string;
        name_en: string;
        slug?: string;
        description_ar?: string;
        description_en?: string;
        icon?: string;
        is_active?: boolean;
    }) {
        const { data } = await this.client.post('/admin/categories', payload);
        return data;
    }

    /**
     * تحديث تصنيف
     */
    async updateCategory(id: string, payload: Partial<{
        name_ar: string;
        name_en: string;
        slug: string;
        description_ar: string;
        description_en: string;
        icon: string;
        is_active: boolean;
    }>) {
        const { data } = await this.client.put(`/admin/categories/${id}`, payload);
        return data;
    }

    /**
     * حذف تصنيف
     */
    async deleteCategory(id: string) {
        const { data } = await this.client.delete(`/admin/categories/${id}`);
        return data;
    }

    /**
     * =========================
     * Admin - Users
     * =========================
     */
    // Admin Users
    async getAdminUsers(page = 1, search = '', role = '') {
        const params = new URLSearchParams({ page: page.toString() });
        if (search) params.append('search', search);
        if (role && role !== 'all') params.append('role', role);
        const { data } = await this.client.get(`/admin/users?${params.toString()}`);
        return data;
    }

    async getAdminUser(id: string) {
        const { data } = await this.client.get(`/admin/users/${id}`);
        return data;
    }

    async updateAdminUser(id: string, payload: any) {
        const { data } = await this.client.put(`/admin/users/${id}`, payload);
        return data;
    }

    async deleteAdminUser(id: string) {
        const { data } = await this.client.delete(`/admin/users/${id}`);
        return data;
    }

    /**
     * تفعيل/تعطيل مستخدم
     */
    async toggleUserStatus(id: string) {
        const { data } = await this.client.post(`/admin/users/${id}/toggle-status`);
        return data;
    }

    /**
     * ترقية/تخفيض صلاحيات مستخدم
     */
    async toggleUserRole(id: string) {
        const { data } = await this.client.post(`/admin/users/${id}/toggle-role`);
        return data;
    }

    /**
     * حذف مستخدم
     */
    async deleteUser(id: string) {
        const { data } = await this.client.delete(`/admin/users/${id}`);
        return data;
    }

    /**
     * =========================
     * Admin - Settings
     * =========================
     */

    /**
     * Get system settings
     */
    async getAdminSettings() {
        const { data } = await this.client.get('/admin/settings');
        return data;
    }

    /**
     * Clear application cache
     */
    async clearCache() {
        const { data } = await this.client.post('/admin/settings/clear-cache');
        return data;
    }

    /**
     * Get system logs
     */
    async getAdminLogs() {
        const { data } = await this.client.get('/admin/settings/logs');
        return data;
    }

    /**
     * Toggle maintenance mode
     */
    async toggleMaintenance(enable: boolean) {
        const { data } = await this.client.post('/admin/settings/maintenance', { enable });
        return data;
    }

    /**
     * Get storage info
     */
    async getStorageInfo() {
        const { data } = await this.client.get('/admin/settings/storage');
        return data;
    }

    /**
     * =========================
     * Admin - Activity Logs
     * =========================
     */

    /**
     * Get activity logs (paginated, filterable)
     */
    async getActivityLogs(params?: {
        action?: string;
        entity_type?: string;
        user_id?: string;
        page?: number;
        per_page?: number;
    }) {
        const { data } = await this.client.get('/admin/activity-logs', { params });
        return data;
    }

    /**
     * Get activity log summary
     */
    async getActivitySummary() {
        const { data } = await this.client.get('/admin/activity-logs/summary');
        return data;
    }

    /**
     * =========================
     * Admin - Coupons
     * =========================
     */

    /**
     * قائمة جميع أكواد الخصم
     */
    async getAdminCoupons() {
        const { data } = await this.client.get('/admin/coupons');
        return data;
    }

    /**
     * إضافة كود خصم جديد
     */
    async createCoupon(payload: {
        code: string;
        description_ar?: string;
        description_en?: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        max_discount?: number;
        min_order_amount?: number;
        max_uses?: number;
        max_uses_per_user?: number;
        starts_at?: string;
        expires_at?: string;
        is_active?: boolean;
    }) {
        const { data } = await this.client.post('/admin/coupons', payload);
        return data;
    }

    /**
     * تحديث كود خصم
     */
    async updateCoupon(id: string, payload: Partial<{
        code: string;
        description_ar: string;
        description_en: string;
        discount_type: 'percentage' | 'fixed';
        discount_value: number;
        max_discount: number;
        min_order_amount: number;
        max_uses: number;
        max_uses_per_user: number;
        starts_at: string;
        expires_at: string;
        is_active: boolean;
    }>) {
        const { data } = await this.client.put(`/admin/coupons/${id}`, payload);
        return data;
    }

    /**
     * حذف كود خصم
     */
    async deleteCoupon(id: string) {
        const { data } = await this.client.delete(`/admin/coupons/${id}`);
        return data;
    }

    /**
     * =========================
     * Admin - Reviews
     * =========================
     */

    /**
     * قائمة جميع التقييمات
     */
    async getAdminReviews(params?: { is_approved?: boolean; page?: number }) {
        const { data } = await this.client.get('/admin/reviews', { params });
        return data;
    }

    /**
     * الموافقة على تقييم
     */
    async approveReview(id: string) {
        const { data } = await this.client.post(`/admin/reviews/${id}/approve`);
        return data;
    }

    /**
     * رفض تقييم
     */
    async rejectReview(id: string) {
        const { data } = await this.client.post(`/admin/reviews/${id}/reject`);
        return data;
    }

    /**
     * حذف تقييم (Admin)
     */
    async adminDeleteReview(id: string) {
        const { data } = await this.client.delete(`/admin/reviews/${id}`);
        return data;
    }

    /**
     * =========================
     * Downloads (Secure)
     * =========================
     */
    async payOrder(id: string) {
        return this.client.post(`/orders/${id}/pay`, {});
    }

    /**
     * تحميل ملف منتج (يتطلب ملكية)
     */
    async downloadFile(orderItemId: string) {
        const response = await this.client.get(`/downloads/${orderItemId}`, {
            responseType: 'blob',
        });
        return response;
    }

    /**
     * معلومات التحميل
     */
    async getDownloadInfo(orderItemId: string) {
        const { data } = await this.client.get(`/downloads/${orderItemId}/info`);
        return data;
    }

    /**
     * =========================
     * Wishlist (المفضلة)
     * =========================
     */

    /**
     * الحصول على قائمة المفضلة
     */
    async getWishlist() {
        const { data } = await this.client.get('/wishlists');
        return data;
    }

    /**
     * الحصول على معرفات المنتجات في المفضلة
     */
    async getWishlistIds() {
        const { data } = await this.client.get('/wishlists/ids');
        return data;
    }

    /**
     * إضافة/إزالة منتج من المفضلة
     */
    async toggleWishlist(productId: string) {
        const { data } = await this.client.post('/wishlists/toggle', {
            product_id: productId,
        });
        return data;
    }

    /**
     * التحقق من وجود منتج في المفضلة
     */
    async checkWishlist(productId: string) {
        const { data } = await this.client.get(`/wishlists/check/${productId}`);
        return data;
    }

    /**
     * إزالة منتج من المفضلة
     */
    async removeFromWishlist(productId: string) {
        const { data } = await this.client.delete(`/wishlists/${productId}`);
        return data;
    }

    /**
     * =========================
     * Coupons (أكواد الخصم)
     * =========================
     */

    /**
     * التحقق من صلاحية كود الخصم
     */
    async validateCoupon(code: string, orderTotal?: number) {
        const { data } = await this.client.post('/coupons/validate', {
            code,
            order_total: orderTotal,
        });
        return data;
    }

    /**
     * =========================
     * Reviews (التقييمات)
     * =========================
     */

    /**
     * الحصول على تقييمات منتج
     */
    async getProductReviews(slug: string, page = 1) {
        const { data } = await this.client.get(`/products/${slug}/reviews`, {
            params: { page },
        });
        return data;
    }

    /**
     * التحقق من إمكانية تقييم منتج
     */
    async canReviewProduct(slug: string) {
        const { data } = await this.client.get(`/products/${slug}/can-review`);
        return data;
    }

    /**
     * الحصول على تقييم المستخدم لمنتج
     */
    async getMyReview(slug: string) {
        const { data } = await this.client.get(`/products/${slug}/my-review`);
        return data;
    }

    /**
     * إضافة تقييم لمنتج
     */
    async createReview(slug: string, payload: { rating: number; comment?: string }) {
        const { data } = await this.client.post(`/products/${slug}/reviews`, payload);
        return data;
    }

    /**
     * تحديث تقييم
     */
    async updateReview(reviewId: string, payload: { rating?: number; comment?: string }) {
        const { data } = await this.client.put(`/reviews/${reviewId}`, payload);
        return data;
    }

    /**
     * حذف تقييم
     */
    async deleteReview(reviewId: string) {
        const { data } = await this.client.delete(`/reviews/${reviewId}`);
        return data;
    }

    /**
     * =========================
     * Sections (الأقسام)
     * =========================
     */
    async getSections() {
        const { data } = await this.client.get('/sections');
        return data;
    }

    async getSection(slug: string) {
        const { data } = await this.client.get(`/sections/${slug}`);
        return data;
    }

    /**
     * =========================
     * Categories with Section (الفئات)
     * =========================
     */
    async getCategoriesBySection(sectionSlug: string) {
        const { data } = await this.client.get(`/sections/${sectionSlug}/categories`);
        return data;
    }

    async getCategory(slug: string) {
        const { data } = await this.client.get(`/categories/${slug}`);
        return data;
    }

    /**
     * =========================
     * Templates (القوالب)
     * =========================
     */
    async getTemplates(params?: Record<string, any>) {
        const { data } = await this.client.get('/templates', { params });
        return data;
    }

    async getTemplatesByCategory(categorySlug: string) {
        const { data } = await this.client.get(`/categories/${categorySlug}/templates`);
        return data;
    }

    async getTemplate(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}`);
        return data;
    }

    async getTemplateForEditor(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/editor`);
        return data;
    }

    /**
     * =========================
     * User Template Data (بيانات المستخدم للقوالب)
     * =========================
     */
    async saveUserTemplateData(payload: {
        template_id: number | undefined;
        variant_id: number;
        title: string;
        field_values: Record<string, string>;
    }) {
        const { data } = await this.client.post('/user-template-data', payload);
        return data;
    }

    async getUserTemplateData() {
        const { data } = await this.client.get('/user-template-data');
        return data;
    }

    async getUserTemplateDataById(id: number) {
        const { data } = await this.client.get(`/user-template-data/${id}`);
        return data;
    }

    async updateUserTemplateData(id: number, payload: {
        title?: string;
        field_values?: Record<string, string>;
        variant_id?: number;
    }) {
        const { data } = await this.client.put(`/user-template-data/${id}`, payload);
        return data;
    }

    async deleteUserTemplateData(id: number) {
        const { data } = await this.client.delete(`/user-template-data/${id}`);
        return data;
    }

    /**
     * =========================
     * Version History (سجل التغييرات)
     * =========================
     */
    async getVersionHistory(userTemplateDataId: number) {
        const { data } = await this.client.get(`/user-template-data/${userTemplateDataId}/versions`);
        return data;
    }

    async restoreVersion(userTemplateDataId: number, versionId: number) {
        const { data } = await this.client.post(`/user-template-data/${userTemplateDataId}/versions/${versionId}/restore`);
        return data;
    }

    /**
     * =========================
     * Export (التصدير)
     * =========================
     */
    async exportTemplate(payload: {
        template_id: number | undefined;
        variant_id: number;
        field_values: Record<string, string>;
        format: 'image' | 'pdf';
    }) {
        const { data } = await this.client.post('/export/template', payload);
        return data;
    }

    /**
     * =========================
     * QR Code (الباركود)
     * =========================
     */
    async generateQRCode(payload: {
        type: 'link' | 'file';
        content: string;
    }) {
        const { data } = await this.client.post('/qrcode/generate', payload);
        return data;
    }

    async uploadFileForQR(formData: FormData) {
        const { data } = await this.client.post('/qrcode/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    /**
     * =========================
     * AI Suggestions (اقتراحات الذكاء الاصطناعي)
     * =========================
     */
    async getAISuggestion(payload: {
        template_id: number | undefined;
        field_name: string;
        title: string;
        current_values: Record<string, string>;
    }) {
        const { data } = await this.client.post('/ai/suggest-field', payload);
        return data;
    }

    async getAIFillAll(payload: {
        template_id: number | undefined;
        title: string;
        current_values: Record<string, string>;
    }) {
        const { data } = await this.client.post('/ai/fill-all', payload);
        return data;
    }

    /**
     * =========================
     * Custom Requests (الطلبات الخاصة)
     * =========================
     */
    async getCustomRequests(params?: Record<string, any>) {
        const { data } = await this.client.get('/custom-requests', { params });
        return data;
    }

    async createCustomRequest(payload: {
        title: string;
        description: string;
        category_id?: number;
    }) {
        const { data } = await this.client.post('/custom-requests', payload);
        return data;
    }

    async voteCustomRequest(id: number) {
        const { data } = await this.client.post(`/custom-requests/${id}/vote`);
        return data;
    }

    async unvoteCustomRequest(id: number) {
        const { data } = await this.client.delete(`/custom-requests/${id}/vote`);
        return data;
    }

    /**
     * =========================
     * Notifications (الإشعارات)
     * =========================
     */
    async getNotifications() {
        const { data } = await this.client.get('/notifications');
        return data;
    }

    async getUnreadNotificationsCount() {
        const { data } = await this.client.get('/notifications/unread-count');
        return data;
    }

    async markNotificationAsRead(id: number) {
        const { data } = await this.client.post(`/notifications/${id}/read`);
        return data;
    }

    async markAllNotificationsAsRead() {
        const { data } = await this.client.post('/notifications/read-all');
        return data;
    }

    /**
     * =========================
     * Evidences (الشواهد)
     * =========================
     */
    async uploadEvidence(formData: FormData) {
        const { data } = await this.client.post('/evidences', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async getEvidences(userTemplateDataId: number) {
        const { data } = await this.client.get(`/user-template-data/${userTemplateDataId}/evidences`);
        return data;
    }

    async deleteEvidence(id: number) {
        const { data } = await this.client.delete(`/evidences/${id}`);
        return data;
    }

}

/**
 * =========================
 * Export Singleton
 * =========================
 */
export const api = new ApiClient();

