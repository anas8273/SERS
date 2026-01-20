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

        // Add response interceptor to handle errors
        this.client.interceptors.response.use(
            (response) => response,
            (error) => {
                // Pass through the full error response for better error handling
                if (error.response) {
                    // Server responded with error status
                    throw error;
                } else if (error.request) {
                    // Request was made but no response received
                    throw new Error('لا يمكن الاتصال بالخادم');
                } else {
                    // Something else happened
                    throw new Error('حدث خطأ غير متوقع');
                }
            }
        );
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
        const { data } = await this.client.post('/auth/login', payload);
        return data;
    }

    async register(payload: any): Promise<ApiResponse> {
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

    async getProfile(): Promise<ApiResponse> {
        const { data } = await this.client.get('/user/profile');
        return data;
    }

    async getMe(): Promise<ApiResponse> {
        const { data } = await this.client.get('/auth/me');
        return data;
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

    async searchTemplates(params: string | { query: string; limit?: number; category_id?: string; is_interactive?: boolean }) {
        const searchParams = typeof params === 'string'
            ? { q: params }
            : { q: params.query, limit: params.limit, category_id: params.category_id, is_interactive: params.is_interactive };
        const { data } = await this.client.get('/templates/search', {
            params: searchParams,
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
     * Template Reviews
     * =========================
     */
    async getTemplateReviews(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/reviews`);
        return data;
    }

    // Backward compatibility alias
    async getProductReviews(slug: string) {
        return this.getTemplateReviews(slug);
    }

    async canReviewTemplate(slug: string) {
        const { data } = await this.client.get(`/templates/${slug}/can-review`);
        return data;
    }

    // Backward compatibility alias
    async canReviewProduct(slug: string) {
        return this.canReviewTemplate(slug);
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

    // Template-named alias
    async getAdminTemplates(params?: any) {
        return this.getAdminProducts(params);
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

    // Template-named alias
    async createTemplate(payload: any) {
        return this.createProduct(payload);
    }

    async updateTemplate(id: string | number, payload: any) {
        return this.updateProduct(id, payload);
    }

    async deleteTemplate(id: string | number) {
        return this.deleteProduct(id);
    }

    async getAdminTemplate(id: string | number) {
        return this.getAdminProduct(id);
    }

    async toggleTemplateStatus(id: string | number) {
        const { data } = await this.client.post(`/admin/templates/${id}/toggle-status`);
        return data;
    }

    async toggleTemplateFeatured(id: string | number) {
        const { data } = await this.client.post(`/admin/templates/${id}/toggle-featured`);
        return data;
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

    /**
     * =========================
     * Analyses (تحليل النتائج)
     * =========================
     */
    async getAnalyses(params?: Record<string, any>) {
        const { data } = await this.client.get('/analyses', { params });
        return data;
    }

    async getAnalysis(id: string) {
        const { data } = await this.client.get(`/analyses/${id}`);
        return data;
    }

    async createAnalysis(payload: any) {
        const { data } = await this.client.post('/analyses', payload);
        return data;
    }

    async updateAnalysis(id: string, payload: any) {
        const { data } = await this.client.put(`/analyses/${id}`, payload);
        return data;
    }

    async deleteAnalysis(id: string) {
        const { data } = await this.client.delete(`/analyses/${id}`);
        return data;
    }

    async getRemedialStudents(analysisId: string) {
        const { data } = await this.client.get(`/analyses/${analysisId}/remedial-students`);
        return data;
    }

    async getExcellentStudents(analysisId: string) {
        const { data } = await this.client.get(`/analyses/${analysisId}/excellent-students`);
        return data;
    }

    async exportAnalysis(id: string, format: string = 'pdf') {
        const { data } = await this.client.get(`/analyses/${id}/export`, { params: { format } });
        return data;
    }

    /**
     * =========================
     * Certificates (الشهادات)
     * =========================
     */
    async getCertificateTypes() {
        const { data } = await this.client.get('/certificates/types');
        return data;
    }

    async getCertificates(params?: Record<string, any>) {
        const { data } = await this.client.get('/certificates', { params });
        return data;
    }

    async getCertificate(id: string) {
        const { data } = await this.client.get(`/certificates/${id}`);
        return data;
    }

    async createCertificate(payload: any) {
        const { data } = await this.client.post('/certificates', payload);
        return data;
    }

    async createBulkCertificates(payload: any) {
        const { data } = await this.client.post('/certificates/bulk', payload);
        return data;
    }

    async updateCertificate(id: string, payload: any) {
        const { data } = await this.client.put(`/certificates/${id}`, payload);
        return data;
    }

    async deleteCertificate(id: string) {
        const { data } = await this.client.delete(`/certificates/${id}`);
        return data;
    }

    async generateCertificate(id: string, format: string = 'pdf') {
        const { data } = await this.client.post(`/certificates/${id}/generate`, { format });
        return data;
    }

    async verifyCertificate(id: string) {
        const { data } = await this.client.get(`/verify/certificate/${id}`);
        return data;
    }

    /**
     * =========================
     * Plans (الخطط التعليمية)
     * =========================
     */
    async getPlanTypes() {
        const { data } = await this.client.get('/plans/types');
        return data;
    }

    async getCurrentPlans() {
        const { data } = await this.client.get('/plans/current');
        return data;
    }

    async getPlans(params?: Record<string, any>) {
        const { data } = await this.client.get('/plans', { params });
        return data;
    }

    async getPlan(id: string) {
        const { data } = await this.client.get(`/plans/${id}`);
        return data;
    }

    async createPlan(payload: any) {
        const { data } = await this.client.post('/plans', payload);
        return data;
    }

    async updatePlan(id: string, payload: any) {
        const { data } = await this.client.put(`/plans/${id}`, payload);
        return data;
    }

    async deletePlan(id: string) {
        const { data } = await this.client.delete(`/plans/${id}`);
        return data;
    }

    async activatePlan(id: string) {
        const { data } = await this.client.post(`/plans/${id}/activate`);
        return data;
    }

    async completePlan(id: string) {
        const { data } = await this.client.post(`/plans/${id}/complete`);
        return data;
    }

    async archivePlan(id: string) {
        const { data } = await this.client.post(`/plans/${id}/archive`);
        return data;
    }

    async duplicatePlan(id: string) {
        const { data } = await this.client.post(`/plans/${id}/duplicate`);
        return data;
    }

    async exportPlan(id: string, format: string = 'pdf') {
        const { data } = await this.client.get(`/plans/${id}/export`, { params: { format } });
        return data;
    }

    /**
     * =========================
     * Achievements (الإنجازات)
     * =========================
     */
    async getAchievementTypes() {
        const { data } = await this.client.get('/achievements/types');
        return data;
    }

    async getAchievementsSummary(year?: number) {
        const { data } = await this.client.get('/achievements/summary', { params: { year } });
        return data;
    }

    async getThisWeekAchievements() {
        const { data } = await this.client.get('/achievements/this-week');
        return data;
    }

    async getThisMonthAchievements() {
        const { data } = await this.client.get('/achievements/this-month');
        return data;
    }

    async getAchievements(params?: Record<string, any>) {
        const { data } = await this.client.get('/achievements', { params });
        return data;
    }

    async getAchievement(id: string) {
        const { data } = await this.client.get(`/achievements/${id}`);
        return data;
    }

    async createAchievement(payload: any) {
        const { data } = await this.client.post('/achievements', payload);
        return data;
    }

    async updateAchievement(id: string, payload: any) {
        const { data } = await this.client.put(`/achievements/${id}`, payload);
        return data;
    }

    async deleteAchievement(id: string) {
        const { data } = await this.client.delete(`/achievements/${id}`);
        return data;
    }

    async uploadAchievementAttachment(id: string, formData: FormData) {
        const { data } = await this.client.post(`/achievements/${id}/attachment`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    /**
     * =========================
     * Performances (تقييم الأداء)
     * =========================
     */
    async getPerformanceCriteria() {
        const { data } = await this.client.get('/performances/criteria');
        return data;
    }

    async getPerformanceSummary() {
        const { data } = await this.client.get('/performances/summary');
        return data;
    }

    async getPerformances(params?: Record<string, any>) {
        const { data } = await this.client.get('/performances', { params });
        return data;
    }

    async getPerformance(id: string) {
        const { data } = await this.client.get(`/performances/${id}`);
        return data;
    }

    async createPerformance(payload: any) {
        const { data } = await this.client.post('/performances', payload);
        return data;
    }

    async updatePerformance(id: string, payload: any) {
        const { data } = await this.client.put(`/performances/${id}`, payload);
        return data;
    }

    async deletePerformance(id: string) {
        const { data } = await this.client.delete(`/performances/${id}`);
        return data;
    }

    async submitPerformance(id: string) {
        const { data } = await this.client.post(`/performances/${id}/submit`);
        return data;
    }

    async addPerformanceEvidence(id: string, evidenceId: string) {
        const { data } = await this.client.post(`/performances/${id}/evidence`, { evidence_id: evidenceId });
        return data;
    }

    async exportPerformance(id: string, format: 'pdf' | 'excel' = 'pdf') {
        const { data } = await this.client.get(`/performances/${id}/export`, { params: { format } });
        return data;
    }

    /**
     * =========================
     * Tests (الاختبارات)
     * =========================
     */
    async getTestTypes() {
        const { data } = await this.client.get('/tests/types');
        return data;
    }

    async getTests(params?: Record<string, any>) {
        const { data } = await this.client.get('/tests', { params });
        return data;
    }

    async getTest(id: string) {
        const { data } = await this.client.get(`/tests/${id}`);
        return data;
    }

    async createTest(payload: any) {
        const { data } = await this.client.post('/tests', payload);
        return data;
    }

    async updateTest(id: string, payload: any) {
        const { data } = await this.client.put(`/tests/${id}`, payload);
        return data;
    }

    async deleteTest(id: string) {
        const { data } = await this.client.delete(`/tests/${id}`);
        return data;
    }

    async publishTest(id: string) {
        const { data } = await this.client.post(`/tests/${id}/publish`);
        return data;
    }

    async unpublishTest(id: string) {
        const { data } = await this.client.post(`/tests/${id}/unpublish`);
        return data;
    }

    async duplicateTest(id: string) {
        const { data } = await this.client.post(`/tests/${id}/duplicate`);
        return data;
    }

    async addTestQuestion(id: string, question: any) {
        const { data } = await this.client.post(`/tests/${id}/questions`, question);
        return data;
    }

    async submitTestAnswers(id: string, payload: any) {
        const { data } = await this.client.post(`/tests/${id}/submit`, payload);
        return data;
    }

    async getTestResults(id: string) {
        const { data } = await this.client.get(`/tests/${id}/results`);
        return data;
    }

    async getTestStatistics(id: string) {
        const { data } = await this.client.get(`/tests/${id}/statistics`);
        return data;
    }

    async exportTest(id: string, format: string = 'pdf', includeAnswers: boolean = false) {
        const { data } = await this.client.get(`/tests/${id}/export`, {
            params: { format, include_answers: includeAnswers },
        });
        return data;
    }

    /**
     * =========================
     * Schools (المدارس)
     * =========================
     */
    async getSchoolTypes() {
        const { data } = await this.client.get('/schools/types');
        return data;
    }

    async getSchools(params?: Record<string, any>) {
        const { data } = await this.client.get('/schools', { params });
        return data;
    }

    async getSchool(id: string) {
        const { data } = await this.client.get(`/schools/${id}`);
        return data;
    }

    async createSchool(payload: any) {
        const { data } = await this.client.post('/schools', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async updateSchool(id: string, payload: any) {
        const { data } = await this.client.put(`/schools/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async deleteSchool(id: string) {
        const { data } = await this.client.delete(`/schools/${id}`);
        return data;
    }

    async getSchoolMembers(id: string) {
        const { data } = await this.client.get(`/schools/${id}/members`);
        return data;
    }

    async addSchoolMember(id: string, payload: any) {
        const { data } = await this.client.post(`/schools/${id}/members`, payload);
        return data;
    }

    async updateSchoolMember(schoolId: string, userId: string, payload: any) {
        const { data } = await this.client.put(`/schools/${schoolId}/members/${userId}`, payload);
        return data;
    }

    async removeSchoolMember(schoolId: string, userId: string) {
        const { data } = await this.client.delete(`/schools/${schoolId}/members/${userId}`);
        return data;
    }

    async leaveSchool(id: string) {
        const { data } = await this.client.post(`/schools/${id}/leave`);
        return data;
    }

    /**
     * =========================
     * AI Chat & Suggestions
     * =========================
     */
    async suggestAnalysis(analysisId: string) {
        const { data } = await this.client.post('/ai/suggest-analysis', { analysis_id: analysisId });
        return data;
    }

    async suggestPlan(payload: {
        type: string;
        subject: string;
        grade: string;
        students?: any[];
        context?: string;
    }) {
        const { data } = await this.client.post('/ai/suggest-plan', payload);
        return data;
    }

    async suggestCertificateText(payload: {
        type: string;
        recipient_name: string;
        recipient_title?: string;
        reason?: string;
        organization?: string;
    }) {
        const { data } = await this.client.post('/ai/suggest-certificate', payload);
        return data;
    }

    async chatWithAI(message: string, conversationId?: string, contextType?: string, contextId?: string) {
        const { data } = await this.client.post('/ai/chat', {
            message,
            conversation_id: conversationId,
            context_type: contextType,
            context_id: contextId,
        });
        return data;
    }

    async getAIConversations(params?: Record<string, any>) {
        const { data } = await this.client.get('/ai/conversations', { params });
        return data;
    }

    async getAIConversation(id: string) {
        const { data } = await this.client.get(`/ai/conversations/${id}`);
        return data;
    }

    async deleteAIConversation(id: string) {
        const { data } = await this.client.delete(`/ai/conversations/${id}`);
        return data;
    }

    async suggestCertificate(payload: {
        type: string;
        recipient_name: string;
        reason?: string;
        organization?: string;
    }) {
        const { data } = await this.client.post('/ai/suggest-certificate', payload);
        return data;
    }

    async generatePerformanceReport(payload: {
        teacher_name: string;
        period: string;
        achievements: string[];
        activities?: string[];
        challenges?: string[];
    }) {
        const { data } = await this.client.post('/ai/generate-performance-report', payload);
        return data;
    }

    async generateAchievementDoc(payload: {
        type: 'daily' | 'weekly' | 'monthly' | 'semester';
        title: string;
        description: string;
        date?: string;
    }) {
        const { data } = await this.client.post('/ai/generate-achievement-doc', payload);
        return data;
    }

    async generateCurriculum(payload: {
        subject: string;
        grade: string;
        semester: string;
        weeks: number;
        topics: string[];
    }) {
        const { data } = await this.client.post('/ai/generate-curriculum', payload);
        return data;
    }

    async getAIRecommendations(payload?: {
        subject?: string;
        grade?: string;
        recent_views?: string[];
        purchases?: string[];
    }) {
        const { data } = await this.client.post('/ai/recommendations', payload || {});
        return data;
    }

    async getQuickSuggestions(context: 'plan' | 'certificate' | 'report' | 'analysis', contextData?: any) {
        const { data } = await this.client.post('/ai/quick-suggestions', { context, data: contextData });
        return data;
    }

    /**
     * =========================
     * Notifications
     * =========================
     */
    async getNotifications(params?: Record<string, any>) {
        const { data } = await this.client.get('/notifications', { params });
        return data;
    }

    async getUnreadNotificationsCount() {
        const { data } = await this.client.get('/notifications/unread-count');
        return data;
    }

    async markNotificationAsRead(id: string) {
        const { data } = await this.client.post(`/notifications/${id}/read`);
        return data;
    }

    async markAllNotificationsAsRead() {
        const { data } = await this.client.post('/notifications/read-all');
        return data;
    }

    async deleteNotification(id: string) {
        const { data } = await this.client.delete(`/notifications/${id}`);
        return data;
    }

    /**
     * =========================
     * Evidences (الشواهد)
     * =========================
     */
    async getEvidences(params?: Record<string, any>) {
        const { data } = await this.client.get('/evidences', { params });
        return data;
    }

    async getEvidence(id: string) {
        const { data } = await this.client.get(`/evidences/${id}`);
        return data;
    }

    async createEvidence(payload: any) {
        const { data } = await this.client.post('/evidences', payload);
        return data;
    }

    async updateEvidence(id: string, payload: any) {
        const { data } = await this.client.put(`/evidences/${id}`, payload);
        return data;
    }

    async deleteEvidence(id: string) {
        const { data } = await this.client.delete(`/evidences/${id}`);
        return data;
    }

    /**
     * =========================
     * Custom Requests
     * =========================
     */
    async getCustomRequests(params?: Record<string, any>) {
        const { data } = await this.client.get('/custom-requests', { params });
        return data;
    }

    async getMyCustomRequests() {
        const { data } = await this.client.get('/custom-requests/my');
        return data;
    }

    async getCustomRequest(id: string) {
        const { data } = await this.client.get(`/custom-requests/${id}`);
        return data;
    }

    async createCustomRequest(payload: any) {
        const { data } = await this.client.post('/custom-requests', payload);
        return data;
    }

    async voteCustomRequest(id: string) {
        const { data } = await this.client.post(`/custom-requests/${id}/vote`);
        return data;
    }

    async cancelCustomRequest(id: string) {
        const { data } = await this.client.delete(`/custom-requests/${id}`);
        return data;
    }
}

export const api = new ApiClient();
