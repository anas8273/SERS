// src/lib/api.ts

import axios, { AxiosInstance } from 'axios';
import { ApiResponse } from '@/types';

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

    /**
     * =========================
     * Templates
     * =========================
     */
    async getTemplates(params?: Record<string, any>) {
        const { data } = await this.client.get('/templates', { params });
        return data;
    }

    async getFeaturedTemplates() {
        return this.getTemplates({ featured: 1 });
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
        const { data } = await this.client.get(`/templates/${slug}/editor`);
        return data;
    }

    async exportTemplate(recordId: string, format: string = 'pdf') {
        const { data } = await this.client.post(`/templates/export/${recordId}`, { format });
        return data;
    }

    async uploadFileForQR(formData: FormData) {
        const { data } = await this.client.post('/qr/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async generateQRCode(payload: any) {
        const { data } = await this.client.post('/qr/generate', payload);
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
        const { data } = await this.client.get(`/sections/${slug}`);
        return data;
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

    async downloadFile(orderItemId: string) {
        const { data } = await this.client.get(`/orders/download/${orderItemId}`, {
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
        const { data } = await this.client.get('/wishlist');
        return data;
    }

    async getWishlistIds() {
        const { data } = await this.client.get('/wishlist/ids');
        return data;
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
    async getAISuggestion(payload: {
        template_id: number | undefined;
        field_name: string;
        title: string;
        current_values: Record<string, any>;
    }) {
        const { data } = await this.client.post('/ai/suggest-field', payload);
        return data;
    }

    async getAIFillAll(payload: {
        template_id: number | undefined;
        title: string;
        current_values: Record<string, any>;
    }) {
        const { data } = await this.client.post('/ai/fill-all', payload);
        return data;
    }

    async getContextualAISuggestion(payload: {
        template_id: string;
        field_name: string;
        user_input?: string;
        service_type?: string;
        locale?: string;
        current_values?: Record<string, any>;
    }) {
        const { data } = await this.client.post('/ai/contextual-suggest', payload);
        return data;
    }

    async getBulkAISuggestions(payload: {
        template_id: string;
        current_values: Record<string, any>;
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

    async createAIConversation(payload: any) {
        const { data } = await this.client.post('/ai/conversations', payload);
        return data;
    }

    async deleteAIConversation(id: string | number) {
        const { data } = await this.client.delete(`/ai/conversations/${id}`);
        return data;
    }

    async chatWithAI(message: string, conversationId?: string | number) {
        const { data } = await this.client.post('/ai/chat', {
            message,
            conversation_id: conversationId
        });
        return data;
    }

    async suggestPlan(payload: any) {
        const { data } = await this.client.post('/ai/suggest-plan', payload);
        return data;
    }

    async generateQuestions(payload: any) {
        const { data } = await this.client.post('/ai/generate-questions', payload);
        return data;
    }

    async analyzePerformance(payload: any) {
        const { data } = await this.client.post('/ai/analyze-performance', payload);
        return data;
    }

    async generateReport(payload: any) {
        const { data } = await this.client.post('/ai/generate-report', payload);
        return data;
    }

    async suggestCertificate(payload: any) {
        const { data } = await this.client.post('/ai/suggest-certificate', payload);
        return data;
    }

    async generatePerformanceReport(payload: any) {
        const { data } = await this.client.post('/ai/generate-performance-report', payload);
        return data;
    }

    async generateAchievementDoc(payload: any) {
        const { data } = await this.client.post('/ai/generate-achievement-doc', payload);
        return data;
    }

    async generateCurriculum(payload: any) {
        const { data } = await this.client.post('/ai/generate-curriculum', payload);
        return data;
    }

    async getAnalyses() {
        const { data } = await this.client.get('/analyses');
        return data;
    }

    async createAnalysis(payload: any) {
        const { data } = await this.client.post('/analyses', payload);
        return data;
    }

    async deleteAnalysis(id: string | number) {
        const { data } = await this.client.delete(`/analyses/${id}`);
        return data;
    }

    async exportAnalysis(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/analyses/${id}/export`, { format });
        return data;
    }

    async getCertificates() {
        const { data } = await this.client.get('/certificates');
        return data;
    }

    async createCertificate(payload: any) {
        const { data } = await this.client.post('/certificates', payload);
        return data;
    }

    async deleteCertificate(id: string | number) {
        const { data } = await this.client.delete(`/certificates/${id}`);
        return data;
    }

    async exportCertificate(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/certificates/${id}/export`, { format });
        return data;
    }

    async createBulkCertificates(payload: any) {
        const { data } = await this.client.post('/certificates/bulk', payload);
        return data;
    }

    async suggestCertificateText(payload: any) {
        const { data } = await this.client.post('/ai/suggest-certificate-text', payload);
        return data;
    }

    async generateCertificate(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/certificates/${id}/generate`, { format });
        return data;
    }

    async getPlans() {
        const { data } = await this.client.get('/plans');
        return data;
    }

    async createPlan(payload: any) {
        const { data } = await this.client.post('/plans', payload);
        return data;
    }

    async deletePlan(id: string | number) {
        const { data } = await this.client.delete(`/plans/${id}`);
        return data;
    }

    async activatePlan(id: string | number) {
        const { data } = await this.client.post(`/plans/${id}/activate`);
        return data;
    }

    async completePlan(id: string | number) {
        const { data } = await this.client.post(`/plans/${id}/complete`);
        return data;
    }

    async archivePlan(id: string | number) {
        const { data } = await this.client.post(`/plans/${id}/archive`);
        return data;
    }

    async duplicatePlan(id: string | number) {
        const { data } = await this.client.post(`/plans/${id}/duplicate`);
        return data;
    }

    async exportPlan(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/plans/${id}/export`, { format });
        return data;
    }

    async getTests() {
        const { data } = await this.client.get('/tests');
        return data;
    }

    async createTest(payload: any) {
        const { data } = await this.client.post('/tests', payload);
        return data;
    }

    async deleteTest(id: string | number) {
        const { data } = await this.client.delete(`/tests/${id}`);
        return data;
    }

    async duplicateTest(id: string | number) {
        const { data } = await this.client.post(`/tests/${id}/duplicate`);
        return data;
    }

    async saveUserTemplateData(slug: string, payload: any) {
        const { data } = await this.client.post(`/templates/${slug}/save`, payload);
        return data;
    }

    async getPerformances() {
        const { data } = await this.client.get('/performances');
        return data;
    }

    async createPerformance(payload: any) {
        const { data } = await this.client.post('/performances', payload);
        return data;
    }

    async deletePerformance(id: string | number) {
        const { data } = await this.client.delete(`/performances/${id}`);
        return data;
    }

    async exportPerformance(id: string | number, format: string = 'pdf') {
        const { data } = await this.client.post(`/performances/${id}/export`, { format });
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

    async getAdminUsers(paramsOrPage: any = 1, search = '', role = '') {
        const params = typeof paramsOrPage === 'object'
            ? paramsOrPage
            : { page: paramsOrPage, search, role };
        const { data } = await this.client.get('/admin/users', { params });
        return data;
    }

    async getAdminTemplates(params?: any) {
        const { data } = await this.client.get('/admin/templates', { params });
        return data;
    }

    async getAdminTemplate(id: string | number) {
        const { data } = await this.client.get(`/admin/templates/${id}`);
        return data;
    }

    async updateAdminTemplate(id: string | number, payload: any) {
        const { data } = await this.client.post(`/admin/templates/${id}`, payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async updateTemplate(id: string | number, payload: any) {
        return this.updateAdminTemplate(id, payload);
    }

    async createTemplate(payload: any) {
        const { data } = await this.client.post('/admin/templates', payload, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    }

    async deleteAdminTemplate(id: string | number) {
        const { data } = await this.client.delete(`/admin/templates/${id}`);
        return data;
    }

    async deleteTemplate(id: string | number) {
        return this.deleteAdminTemplate(id);
    }

    async updateAdminUser(id: string | number, payload: any) {
        const { data } = await this.client.put(`/admin/users/${id}`, payload);
        return data;
    }

    async getVersionHistory(recordId: string) {
        const { data } = await this.client.get(`/user-templates/${recordId}/versions`);
        return data;
    }

    async restoreVersion(recordId: string, versionId: string) {
        const { data } = await this.client.post(`/user-templates/${recordId}/versions/${versionId}/restore`);
        return data;
    }

    async getAdminCategories(params?: any) {
        const { data } = await this.client.get('/admin/categories', { params });
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

    async getAdminCoupons(params?: any) {
        const { data } = await this.client.get('/admin/coupons', { params });
        return data;
    }

    async createCoupon(payload: any) {
        const { data } = await this.client.post('/admin/coupons', payload);
        return data;
    }

    async updateCoupon(id: string | number, payload: any) {
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
        const { data } = await this.client.post(`/admin/users/${id}/toggle-role`);
        return data;
    }

    async deleteUser(id: string | number) {
        const { data } = await this.client.delete(`/admin/users/${id}`);
        return data;
    }

    async getAdminChart(params?: any) {
        const { data } = await this.client.get('/admin/chart', { params });
        return data;
    }

    async getAdminReviews(params?: any) {
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
        const { data } = await this.client.get('/achievements/week');
        return data;
    }

    async getThisMonthAchievements() {
        const { data } = await this.client.get('/achievements/month');
        return data;
    }

    async getAllTimeAchievements() {
        const { data } = await this.client.get('/achievements/all-time');
        return data;
    }

    async getAchievements() {
        const { data } = await this.client.get('/achievements');
        return data;
    }

    async createAchievement(payload: any) {
        const { data } = await this.client.post('/achievements', payload);
        return data;
    }

    async deleteAchievement(id: string | number) {
        const { data } = await this.client.delete(`/achievements/${id}`);
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

    async updateTemplateSchema(templateId: string, payload: any) {
        const { data } = await this.client.put(`/admin/templates/${templateId}/schema`, payload);
        return data;
    }

    async addTemplateField(templateId: string, payload: any) {
        const { data } = await this.client.post(`/admin/templates/${templateId}/fields`, payload);
        return data;
    }

    async removeTemplateField(templateId: string, fieldId: string) {
        const { data } = await this.client.delete(`/admin/templates/${templateId}/fields/${fieldId}`);
        return data;
    }

    async reorderTemplateFields(templateId: string, fieldOrders: any[]) {
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
    async getRecordVersionHistory(recordId: string) {
        const { data } = await this.client.get(`/user-templates/${recordId}/versions`);
        return data;
    }

    async createRecordVersion(recordId: string, payload: any) {
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
    async analyzeRecord(recordId: string, options: any = {}) {
        const { data } = await this.client.post(`/user-templates/${recordId}/analyze`, options);
        return data;
    }

    async batchAnalyzeRecords(recordIds: string[], options: any = {}) {
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
    async generateRecordPDF(recordId: string, options: any = {}) {
        const { data } = await this.client.post(`/user-templates/${recordId}/pdf`, options);
        return data;
    }

    async generateCrossTemplatePDF(recordId: string, targetTemplateId: string, options: any = {}) {
        const { data } = await this.client.post(`/user-templates/${recordId}/cross-template-pdf/${targetTemplateId}`, options);
        return data;
    }

    /**
     * =========================
     * Batch Generation
     * =========================
     */
    async getBatchJobs() {
        const { data } = await this.client.get('/batch-jobs');
        return data;
    }
    async getBatchJobStatus(jobId: string) {
        const { data } = await this.client.get(`/batch-jobs/${jobId}`);
        return data;
    }
    async startBatchGeneration(payload: any) {
        const { data } = await this.client.post('/batch-jobs', payload);
        return data;
    }
    async downloadBatchResults(jobId: string) {
        const { data } = await this.client.get(`/batch-jobs/${jobId}/download`);
        return data;
    }
    async parseExcelForBatch(formData: FormData) {
        const { data } = await this.client.post('/batch-jobs/parse-excel', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data;
    }
    async aiFillBatchRecords(payload: any) {
        const { data } = await this.client.post('/batch-jobs/ai-fill', payload);
        return data;
    }

    /**
     * =========================
     * Educational Services - Extended
     * =========================
     */
    async getDistributions(params?: Record<string, any>) {
        const { data } = await this.client.get('/distributions', { params });
        return data;
    }
    async createDistribution(payload: any) {
        const { data } = await this.client.post('/distributions', payload);
        return data;
    }
    async updateDistribution(id: string | number, payload: any) {
        const { data } = await this.client.put(`/distributions/${id}`, payload);
        return data;
    }
    async deleteDistribution(id: string | number) {
        const { data } = await this.client.delete(`/distributions/${id}`);
        return data;
    }
    async getPortfolio(params?: Record<string, any>) {
        const { data } = await this.client.get('/portfolio', { params });
        return data;
    }
    async createPortfolioItem(payload: any) {
        const { data } = await this.client.post('/portfolio', payload);
        return data;
    }
    async updatePortfolioItem(id: string | number, payload: any) {
        const { data } = await this.client.put(`/portfolio/${id}`, payload);
        return data;
    }
    async deletePortfolioItem(id: string | number) {
        const { data } = await this.client.delete(`/portfolio/${id}`);
        return data;
    }
    async getWorkEvidence(params?: Record<string, any>) {
        const { data } = await this.client.get('/work-evidence', { params });
        return data;
    }
    async createWorkEvidence(payload: any) {
        const { data } = await this.client.post('/work-evidence', payload);
        return data;
    }
    async updateWorkEvidence(id: string | number, payload: any) {
        const { data } = await this.client.put(`/work-evidence/${id}`, payload);
        return data;
    }
    async deleteWorkEvidence(id: string | number) {
        const { data } = await this.client.delete(`/work-evidence/${id}`);
        return data;
    }
    async getKnowledgeProduction(params?: Record<string, any>) {
        const { data } = await this.client.get('/knowledge-production', { params });
        return data;
    }
    async createKnowledgeProduction(payload: any) {
        const { data } = await this.client.post('/knowledge-production', payload);
        return data;
    }
    async updateKnowledgeProduction(id: string | number, payload: any) {
        const { data } = await this.client.put(`/knowledge-production/${id}`, payload);
        return data;
    }
    async deleteKnowledgeProduction(id: string | number) {
        const { data } = await this.client.delete(`/knowledge-production/${id}`);
        return data;
    }
    async getFollowUpLogs(params?: Record<string, any>) {
        const { data } = await this.client.get('/follow-up-logs', { params });
        return data;
    }
    async createFollowUpLog(payload: any) {
        const { data } = await this.client.post('/follow-up-logs', payload);
        return data;
    }
    async updateFollowUpLog(id: string | number, payload: any) {
        const { data } = await this.client.put(`/follow-up-logs/${id}`, payload);
        return data;
    }
    async deleteFollowUpLog(id: string | number) {
        const { data } = await this.client.delete(`/follow-up-logs/${id}`);
        return data;
    }

    /**
     * =========================
     * Admin - Services & Reports
     * =========================
     */
    async getAdminServices(params?: Record<string, any>) {
        const { data } = await this.client.get('/admin/services', { params });
        return data;
    }
    async createAdminService(payload: any) {
        const { data } = await this.client.post('/admin/services', payload);
        return data;
    }
    async updateAdminService(id: string, payload: any) {
        const { data } = await this.client.put(`/admin/services/${id}`, payload);
        return data;
    }
    async deleteAdminService(id: string) {
        const { data } = await this.client.delete(`/admin/services/${id}`);
        return data;
    }
    async getAdminReports(params?: Record<string, any>) {
        const { data } = await this.client.get('/admin/reports', { params });
        return data;
    }
    async exportAdminReport(type: string, params?: Record<string, any>) {
        const { data } = await this.client.get(`/admin/reports/${type}/export`, { params });
        return data;
    }

    // Backward compatibility aliases
    async getFeaturedProducts() {
        return this.getFeaturedTemplates();
    }

    async getProducts(params?: Record<string, any>) {
        return this.getTemplates(params);
    }

    async getProduct(slug: string) {
        return this.getTemplate(slug);
    }

    async getProductReviews(slug: string) {
        return this.getTemplateReviews(slug);
    }

    async canReviewProduct(slug: string) {
        return this.canReviewTemplate(slug);
    }
}

export const api = new ApiClient();