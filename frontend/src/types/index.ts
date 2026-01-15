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
 * Section Types
 * =========================
 */
export interface Section {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    description_ar?: string;
    description_en?: string;
    icon?: string;
    sort_order: number;
    is_active: boolean;
    categories?: Category[];
}

/**
 * =========================
 * Category Types
 * =========================
 */
export interface Category {
    id: string;
    section_id?: string;
    section?: Section;
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
 * Template Types (Unified - replaces Product)
 * =========================
 */
export interface Template {
    id: string;
    name_ar: string;
    name_en: string;
    slug: string;
    description_ar: string;
    description_en: string;
    price: number;
    discount_price: number | null;
    type: 'ready' | 'interactive';
    category?: Category;
    category_id?: string;
    thumbnail_url: string | null;
    preview_images?: string[];
    ready_file?: string;
    educational_stage?: string;
    subject?: string;
    tags?: string[];
    is_featured: boolean;
    is_active: boolean;
    is_free?: boolean;
    created_at: string;
    variants?: TemplateVariant[];
    fields?: TemplateField[];
    average_rating?: number;
    reviews_count?: number;
    sales_count?: number;
    downloads_count?: number;
}

// Alias for backward compatibility
export type Product = Template;

export interface TemplateVariant {
    id: string;
    template_id: string;
    name_ar: string;
    name_en: string;
    color_code?: string;
    preview_image?: string;
    is_default: boolean;
    sort_order: number;
}

export interface TemplateFormData {
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    price: string;
    discount_price?: string;
    type: 'ready' | 'interactive';
    category_id: string;
    educational_stage?: string;
    subject?: string;
    tags?: string[];
    is_featured?: boolean;
    is_active?: boolean;
}

// Alias for backward compatibility
export type ProductFormData = TemplateFormData;

/**
 * =========================
 * Template Field Types
 * =========================
 */
export interface TemplateField {
    id?: string;
    name: string;
    type: 'text' | 'textarea' | 'date' | 'select' | 'list' | 'image' | 'signature' | 'qrcode' | 'barcode' | 'number' | 'checkbox';
    label_ar: string;
    label_en: string;
    placeholder_ar?: string;
    placeholder_en?: string;
    options?: string[];
    is_required?: boolean;
    min_length?: number;
    max_length?: number;
    ai_fillable?: boolean;
    ai_prompt_hint?: string;
    sort_order?: number;
    // Styling
    position_x?: number;
    position_y?: number;
    width?: number;
    height?: number;
    font_size?: number;
    font_family?: string;
    color?: string;
    text_align?: string;
}

/**
 * =========================
 * Order Types
 * =========================
 */
export interface OrderItem {
    id: string;
    template_id: string;
    template?: Template;
    template_name: string;
    template_type: 'ready' | 'interactive';
    price: number;
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
    items_count?: number;
    created_at: string;
}

/**
 * =========================
 * Cart Types
 * =========================
 */
export interface CartItem {
    templateId: string;
    name: string;
    price: number;
    thumbnail: string | null;
    type: 'ready' | 'interactive';
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
 * User Template Data Types
 * =========================
 */
export interface UserTemplateData {
    id: string;
    user_id: string;
    template_id: string;
    variant_id?: string;
    title: string;
    data: Record<string, unknown>;
    status: 'draft' | 'completed' | 'exported';
    exported_file?: string;
    exported_at?: string;
    created_at: string;
    updated_at: string;
    template?: Template;
    variant?: TemplateVariant;
}

export interface TemplateDataVersion {
    id: string;
    user_template_data_id: string;
    version_number: number;
    data: Record<string, unknown>;
    note?: string;
    change_type: 'manual' | 'auto_save' | 'ai_fill';
    created_at: string;
}

// Legacy alias
export interface UserRecord {
    id: string;
    user_id: string;
    template_id: string;
    user_data: Record<string, unknown>;
    status: 'active' | 'archived';
    created_at: string;
    updated_at: string;
}

/**
 * =========================
 * Evidence Types
 * =========================
 */
export interface Evidence {
    id: string;
    user_id: string;
    user_template_data_id: string;
    name: string;
    description?: string;
    type: 'image' | 'file' | 'link' | 'qrcode' | 'barcode';
    file_path?: string;
    file_url?: string;
    link?: string;
    qr_code?: string;
    barcode?: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
}

/**
 * =========================
 * Wishlist Types
 * =========================
 */
export interface WishlistItem {
    id: string;
    template_id: string;
    template: Template;
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
    template_id: string;
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
