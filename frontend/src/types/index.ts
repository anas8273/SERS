// src/types/index.ts

/**
 * =========================
 * User Types
 * =========================
 */
export interface User {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'user' | 'admin';
    firebase_uid?: string;
    wallet_balance: number;
    avatar_url?: string;
    is_active: boolean;
    email_verified_at?: string;
    created_at: string;
}

/**
 * =========================
 * Category Types
 * =========================
 */
export interface Category {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    description_ar?: string;
    description_en?: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
}

/**
 * =========================
 * Product Types
 * =========================
 */
export interface Product {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    description_ar: string;
    description_en: string;
    price: number;
    discount_price: number | null;
    effective_price: number;
    type: 'downloadable' | 'interactive';
    category?: Category;
    category_id?: string;
    thumbnail_url: string | null;
    preview_images?: string[];
    educational_stage?: string;
    subject?: string;
    tags?: string[];
    downloads_count: number;
    average_rating: number;
    reviews_count: number;
    is_featured: boolean;
    is_active: boolean;
    created_at: string;
}

export interface ProductFormData {
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    price: string;
    discount_price?: string;
    type: 'downloadable' | 'interactive';
    category_id: string;
    educational_stage?: string;
    subject?: string;
    tags?: string[];
    is_featured?: boolean;
    is_active?: boolean;
}

/**
 * =========================
 * Order Types
 * =========================
 */
export interface OrderItem {
    id: string;
    product_id: string;
    product?: Product;
    price: number;
    name_ar: string;
    name_en: string;
}

export interface Order {
    id: string;
    order_number: string;
    user_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'refunded';
    subtotal: number;
    discount: number;
    total: number;
    payment_method?: string;
    payment_id?: string;
    paid_at?: string;
    items: OrderItem[];
    created_at: string;
}

/**
 * =========================
 * Cart Types
 * =========================
 */
export interface CartItem {
    productId: string;
    name: string;
    price: number;
    thumbnail: string | null;
    type: 'downloadable' | 'interactive';
}

/**
 * =========================
 * API Response Types
 * =========================
 */
export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data: T;
    errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
    data: T[];
    links: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta: {
        current_page: number;
        from: number;
        last_page: number;
        per_page: number;
        to: number;
        total: number;
    };
}

/**
 * =========================
 * Template Types (Interactive)
 * =========================
 */
export interface TemplateField {
    name: string;
    type: 'text' | 'textarea' | 'date' | 'select' | 'list';
    label_ar: string;
    label_en: string;
    options?: string[];
    required?: boolean;
}

export interface TemplateStructure {
    fields: TemplateField[];
    ai_enabled_fields?: string[];
}

export interface UserRecord {
    id: string;
    user_id: string;
    product_id: string;
    template_structure: TemplateStructure;
    user_data: Record<string, unknown>;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}

/**
 * =========================
 * Wishlist Types
 * =========================
 */
export interface WishlistItem {
    id: string;
    product_id: string;
    product: Product;
    added_at: string;
}

/**
 * =========================
 * Coupon Types
 * =========================
 */
export interface Coupon {
    id: string;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    formatted_discount: string;
    min_order_amount: number;
    max_discount?: number;
    expires_at?: string;
}

export interface CouponValidationResult {
    valid: boolean;
    error?: 'not_found' | 'invalid' | 'user_limit_exceeded' | 'min_order_not_met';
    coupon?: Coupon;
    calculated_discount?: number;
    new_total?: number;
}

/**
 * =========================
 * Review Types
 * =========================
 */
export interface Review {
    id: string;
    user_id: string;
    product_id: string;
    order_id: string;
    rating: number;
    comment?: string;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
    user?: {
        id: string;
        name: string;
    };
}

export interface ReviewSummary {
    average_rating: number;
    reviews_count: number;
    distribution: Record<number, number>;
}

export interface ReviewFormData {
    rating: number;
    comment?: string;
}

