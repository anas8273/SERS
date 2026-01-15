// src/lib/api.ts

import axios, { AxiosInstance } from 'axios';
import { 
    ApiResponse, 
    User, 
    Template, 
    Category, 
    Section, 
    Order, 
    Coupon, 
    Review, 
    ReviewSummary,
    CartItem
} from '@/types';

class ApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        // Add interceptor to include auth token
        this.client.interceptors.request.use((config) => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth-storage');
                if (token) {
                    try {
                        const { state } = JSON.parse(token);
                        if (state.token) {
                            config.headers.Authorization = `Bearer ${state.token}`;
                        }
                    } catch (e) {
                        console.error('Failed to parse auth token');
                    }
                }
            }
            return config;
        });
    }

    // Generic methods
    async get(url: string, config?: any) {
        const { data } = await this.client.get(url, config);
        return data;
    }

    async post(url: string, payload?: any, config?: any) {
        const { data } = await this.client.post(url, payload, config);
        return data;
    }

    async put(url: string, payload?: any, config?: any) {
        const { data } = await this.client.put(url, payload, config);
        return data;
    }

    async delete(url: string, config?: any) {
        const { data } = await this.client.delete(url, config);
        return data;
    }

    async patch(url: string, payload?: any, config?: any) {
        const { data } = await this.client.patch(url, payload, config);
        return data;
    }

    /**
     * =========================
     * Auth
     * =========================
     */
    async login(payload: any): Promise<ApiResponse> {
        const { data } = await this.client.post('/login', payload);
        return data;
    }

    async register(payload: any): Promise<ApiResponse> {
        const { data } = await this.client.post('/register', payload);
        return data;
    }

    async logout(): Promise<ApiResponse> {
        const { data } = await this.client.post('/logout');
        return data;
    }

    async socialLogin(token: string): Promise<ApiResponse> {
        const { data } = await this.client.post('/auth/social', { token });
        return data;
    }

    async getProfile(): Promise<ApiResponse> {
        const { data } = await this.client.get('/user/profile');
        return data;
    }

    async getMe(): Promise<ApiResponse> {
        return this.getProfile();
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

    async uploadFileForQR(formData: FormData) {
        const { data } = await this.client.post('/qrcode/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async generateQRCode(payload: any) {
        const { data } = await this.client.post('/qrcode/generate', payload);
        return data;
    }

    /**
     * =========================
     * Templates (formerly Products)
     * =========================
     */
    async getTemplates(params?: Record<string, any>) {
        const { data } = await this.client.get('/templates', { params });
        return data;
    }

    async getFeaturedProducts() {
        return this.getTemplates({ featured: 1 });
    }

    async getProducts(params?: Record<string, any>) {
        return this.getTemplates(params);
    }

    async getTemplate(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}`);
        return data;
    }

    async getProduct(slug: string) {
        return this.getTemplate(slug);
    }

    async searchTemplates(query: string) {
        const { data } = await this.client.get('/templates/search', {
            params: { q: query },
        });
        return data;
    }

    /**
     * =========================
     * Categories & Sections
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

    async getSectionBySlug(slug: string) {
        return this.getSection(slug);
    }

    async getTemplatesBySection(sectionSlug: string, params?: Record<string, any>) {
        const { data } = await this.client.get(`/sections/${sectionSlug}/templates`, { params });
        return data;
    }

    async getCategories() {
        const { data } = await this.client.get('/categories');
        return data;
    }

    async getCategory(slug: string) {
        const { data } = await this.client.get(`/categories/${slug}`);
        return data;
    }

    async getTemplatesByCategory(categorySlug: string) {
        const { data } = await this.client.get(`/categories/${categorySlug}/templates`);
        return data;
    }

    /**
     * =========================
     * Orders & Cart
     * =========================
     */
    async createOrder(payload: any) {
        const { data } = await this.client.post('/orders', payload);
        return data;
    }

    async payOrder(orderId: string | number) {
        const { data } = await this.client.post(`/orders/${orderId}/pay`);
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

    async downloadFile(urlOrId: string, filename?: string) {
        const url = urlOrId.startsWith('/') ? urlOrId : `/orders/items/${urlOrId}/download`;
        const response = await this.client.get(url, {
            responseType: 'blob',
        });
        
        if (filename && typeof window !== 'undefined') {
            const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = blobUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(blobUrl);
        }
        
        return response;
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
        const { data } = await this.client.get('/wishlist');
        return data;
    }

    async getWishlistIds() {
        return this.getWishlist();
    }

    async toggleWishlist(templateId: string) {
        const { data } = await this.client.post('/wishlist/toggle', { template_id: templateId });
        return data;
    }

    /**
     * =========================
     * Reviews
     * =========================
     */
    async getProductReviews(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/reviews`);
        return data;
    }

    async canReviewProduct(slug: string) {
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
    async getAISuggestion(
        recordIdOrPayload: string | {
            template_id: number | undefined;
            field_name: string;
            title: string;
            current_values: Record<string, any>;
        },
        fieldName?: string,
        context?: Record<string, any>
    ) {
        if (typeof recordIdOrPayload === 'string') {
            const { data } = await this.client.post(`/ai/suggest/${recordIdOrPayload}`, {
                field_name: fieldName,
                context,
            });
            return data;
        } else {
            const { data } = await this.client.post('/ai/suggest-field', recordIdOrPayload);
            return data;
        }
    }

    async getAIFillAll(payload: {
        template_id: number | undefined;
        title: string;
        current_values: Record<string, any>;
    }) {
        const { data } = await this.client.post('/ai/fill-all', payload);
        return data;
    }

    /**
     * =========================
     * Admin
     * =========================
     */
    async getAdminStats() {
        const { data } = await this.client.get('/admin/stats');
        return data;
    }

    async getAdminChart() {
        const { data } = await this.client.get('/admin/chart');
        return data;
    }

    async getAdminUsers(paramsOrPage: any = 1, search = '', role = '') {
        const params = typeof paramsOrPage === 'object' 
            ? paramsOrPage 
            : { page: paramsOrPage, search, role };
        const { data } = await this.client.get('/admin/users', { params });
        return data;
    }

    async toggleUserStatus(id: string | number) {
        const { data } = await this.client.post(`/admin/users/${id}/toggle-status`);
        return data;
    }

    async toggleUserRole(id: string | number) {
        const { data } = await this.client.post(`/admin/users/${id}/toggle-role`);
        return data;
    }

    async deleteUser(id: string | number) {
        const { data } = await this.client.delete(`/admin/users/${id}`);
        return data;
    }

    async getAdminUser(id: string | number) {
        const { data } = await this.client.get(`/admin/users/${id}`);
        return data;
    }

    async updateAdminUser(id: string | number, payload: any) {
        const { data } = await this.client.put(`/admin/users/${id}`, payload);
        return data;
    }

    async getAdminProducts(params?: any) {
        const { data } = await this.client.get('/admin/templates', { params });
        return data;
    }

    async getAdminProduct(id: string | number) {
        const { data } = await this.client.get(`/admin/templates/${id}`);
        return data;
    }

    async updateAdminProduct(id: string | number, payload: any) {
        const { data } = await this.client.post(`/admin/templates/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async updateProduct(id: string | number, payload: any) {
        return this.updateAdminProduct(id, payload);
    }

    async createProduct(payload: any) {
        const { data } = await this.client.post('/admin/templates', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async deleteAdminProduct(id: string | number) {
        const { data } = await this.client.delete(`/admin/templates/${id}`);
        return data;
    }

    async deleteProduct(id: string | number) {
        return this.deleteAdminProduct(id);
    }

    async getAdminOrders(params?: any) {
        const { data } = await this.client.get('/admin/orders', { params });
        return data;
    }

    async getAdminReviews() {
        const { data } = await this.client.get('/admin/reviews');
        return data;
    }

    async deleteAdminReview(id: string | number) {
        const { data } = await this.client.delete(`/admin/reviews/${id}`);
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
        return this.deleteAdminReview(id);
    }

    async getAdminCoupons() {
        const { data } = await this.client.get('/admin/coupons');
        return data;
    }

    async getAdminCategories() {
        const { data } = await this.client.get('/admin/categories');
        return data;
    }

    async getAdminSections() {
        const { data } = await this.client.get('/admin/sections');
        return data;
    }

    async createCategory(payload: any) {
        const { data } = await this.client.post('/admin/categories', payload);
        return data;
    }

    async updateCategory(id: string | number, payload: any) {
        const { data } = await this.client.put(`/admin/categories/${id}`, payload);
        return data;
    }

    async deleteCategory(id: string | number) {
        const { data } = await this.client.delete(`/admin/categories/${id}`);
        return data;
    }

    async createSection(payload: any) {
        const { data } = await this.client.post('/admin/sections', payload);
        return data;
    }

    async updateSection(id: string | number, payload: any) {
        const { data } = await this.client.put(`/admin/sections/${id}`, payload);
        return data;
    }

    async deleteSection(id: string | number) {
        const { data } = await this.client.delete(`/admin/sections/${id}`);
        return data;
    }

    async createAdminCoupon(payload: any) {
        const { data } = await this.client.post('/admin/coupons', payload);
        return data;
    }

    async createCoupon(payload: any) {
        return this.createAdminCoupon(payload);
    }

    async deleteAdminCoupon(id: string | number) {
        const { data } = await this.client.delete(`/admin/coupons/${id}`);
        return data;
    }

    async deleteCoupon(id: string | number) {
        return this.deleteAdminCoupon(id);
    }

    async getTemplateForEditor(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/editor`);
        return data;
    }

    async saveUserTemplateData(id: string | number, payload: any) {
        const { data } = await this.client.post(`/user-templates/${id}/data`, payload);
        return data;
    }

    async getUserTemplateRecords() {
        const { data } = await this.client.get('/user-templates');
        return data;
    }

    async getVersionHistory(id: string | number) {
        const { data } = await this.client.get(`/user-templates/${id}/versions`);
        return data;
    }

    async restoreVersion(id: string | number, versionId: string | number) {
        const { data } = await this.client.post(`/user-templates/${id}/versions/${versionId}/restore`);
        return data;
    }

    async exportTemplate(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/user-templates/${id}/export`, { format });
        return data;
    }
}

export const api = new ApiClient();
