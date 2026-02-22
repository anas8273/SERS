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

// Legacy UserRecord moved to dynamic engine types below

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


/**
 * =========================
 * Analysis Types (تحليل النتائج)
 * =========================
 */
export interface StudentData {
    name: string;
    grade: number;
    student_id?: string;
}

export interface AnalysisResults {
    count: number;
    sum: number;
    average: number;
    min: number;
    max: number;
    std_dev: number;
    pass_rate: number;
    distribution: {
        excellent: number;
        very_good: number;
        good: number;
        acceptable: number;
        fail: number;
    };
}

export interface Analysis {
    id: string;
    user_id: string;
    name: string;
    subject?: string;
    grade?: string;
    semester?: string;
    students_data: StudentData[];
    results?: AnalysisResults;
    charts_data?: Record<string, unknown>;
    ai_recommendations?: string;
    status: 'draft' | 'completed';
    created_at: string;
    updated_at: string;
}

/**
 * =========================
 * Certificate Types (الشهادات)
 * =========================
 */
export type CertificateType = 
    | 'appreciation' 
    | 'thanks' 
    | 'graduation' 
    | 'honor' 
    | 'participation' 
    | 'achievement' 
    | 'training' 
    | 'custom';

export interface Certificate {
    id: string;
    user_id: string;
    template_id?: string;
    type: CertificateType;
    recipient_name: string;
    recipient_title?: string;
    issuer_name?: string;
    issuer_title?: string;
    organization?: string;
    reason?: string;
    issue_date?: string;
    custom_fields?: Record<string, unknown>;
    file_path?: string;
    file_type?: string;
    qr_code?: string;
    template?: Template;
    created_at: string;
    updated_at: string;
}

export const CERTIFICATE_TYPES: Record<CertificateType, string> = {
    appreciation: 'شهادة تقدير',
    thanks: 'شهادة شكر',
    graduation: 'شهادة تخرج',
    honor: 'لوحة شرف',
    participation: 'شهادة مشاركة',
    achievement: 'شهادة إنجاز',
    training: 'شهادة تدريب',
    custom: 'مخصصة',
};

/**
 * =========================
 * Plan Types (الخطط التعليمية)
 * =========================
 */
export type PlanType = 
    | 'remedial' 
    | 'enrichment' 
    | 'weekly' 
    | 'curriculum' 
    | 'daily' 
    | 'semester';

export type PlanStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface Plan {
    id: string;
    user_id: string;
    type: PlanType;
    name: string;
    description?: string;
    subject?: string;
    grade?: string;
    semester?: string;
    start_date?: string;
    end_date?: string;
    content: Record<string, unknown>;
    objectives?: string[];
    activities?: Record<string, unknown>[];
    resources?: string[];
    assessment?: Record<string, unknown>;
    ai_suggestions?: string;
    status: PlanStatus;
    file_path?: string;
    created_at: string;
    updated_at: string;
}

export const PLAN_TYPES: Record<PlanType, string> = {
    remedial: 'خطة علاجية',
    enrichment: 'خطة إثرائية',
    weekly: 'خطة أسبوعية',
    curriculum: 'توزيع المنهج',
    daily: 'خطة يومية',
    semester: 'خطة فصلية',
};

export const PLAN_STATUSES: Record<PlanStatus, string> = {
    draft: 'مسودة',
    active: 'نشطة',
    completed: 'مكتملة',
    archived: 'مؤرشفة',
};

/**
 * =========================
 * Achievement Types (الإنجازات)
 * =========================
 */
export type AchievementType = 'daily' | 'weekly' | 'monthly' | 'semester' | 'annual';
export type AchievementCategory = 'teaching' | 'administrative' | 'professional' | 'community' | 'creative' | 'other';

export interface Achievement {
    id: string;
    user_id: string;
    type: AchievementType;
    date: string;
    end_date?: string;
    title: string;
    description: string;
    category?: AchievementCategory;
    goals?: string[];
    metrics?: Record<string, unknown>;
    attachments?: Array<{
        path: string;
        name: string;
        uploaded_at: string;
    }>;
    evidence_id?: string;
    is_verified: boolean;
    verified_by?: string;
    verified_at?: string;
    created_at: string;
    updated_at: string;
}

export const ACHIEVEMENT_TYPES: Record<AchievementType, string> = {
    daily: 'إنجاز يومي',
    weekly: 'إنجاز أسبوعي',
    monthly: 'إنجاز شهري',
    semester: 'إنجاز فصلي',
    annual: 'إنجاز سنوي',
};

export const ACHIEVEMENT_CATEGORIES: Record<AchievementCategory, string> = {
    teaching: 'تعليمي',
    administrative: 'إداري',
    professional: 'مهني',
    community: 'مجتمعي',
    creative: 'إبداعي',
    other: 'أخرى',
};

/**
 * =========================
 * Performance Types (تقييم الأداء)
 * =========================
 */
export type PerformanceSemester = 'first' | 'second' | 'annual';
export type PerformanceStatus = 'draft' | 'submitted' | 'reviewed' | 'approved' | 'rejected';
export type PerformanceGrade = 'excellent' | 'very_good' | 'good' | 'acceptable' | 'weak';

export interface PerformanceCriterion {
    name: string;
    weight: number;
    score?: number;
    items: Record<string, string>;
}

export interface Performance {
    id: string;
    user_id: string;
    evaluator_id?: string;
    year: number;
    semester: PerformanceSemester;
    criteria: Record<string, PerformanceCriterion>;
    total_score?: number;
    grade?: PerformanceGrade;
    strengths?: string;
    weaknesses?: string;
    recommendations?: string;
    notes?: string;
    evidences?: string[];
    status: PerformanceStatus;
    submitted_at?: string;
    reviewed_at?: string;
    approved_at?: string;
    evaluator?: User;
    created_at: string;
    updated_at: string;
}

export const PERFORMANCE_SEMESTERS: Record<PerformanceSemester, string> = {
    first: 'الفصل الأول',
    second: 'الفصل الثاني',
    annual: 'سنوي',
};

export const PERFORMANCE_STATUSES: Record<PerformanceStatus, string> = {
    draft: 'مسودة',
    submitted: 'مُقدم',
    reviewed: 'قيد المراجعة',
    approved: 'معتمد',
    rejected: 'مرفوض',
};

export const PERFORMANCE_GRADES: Record<PerformanceGrade, { name: string; min: number }> = {
    excellent: { name: 'ممتاز', min: 90 },
    very_good: { name: 'جيد جداً', min: 80 },
    good: { name: 'جيد', min: 70 },
    acceptable: { name: 'مقبول', min: 60 },
    weak: { name: 'ضعيف', min: 0 },
};

/**
 * =========================
 * Test Types (الاختبارات)
 * =========================
 */
export type TestType = 'quiz' | 'midterm' | 'final' | 'diagnostic' | 'practice';
export type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'fill_blank' | 'ordering';

export interface TestQuestion {
    id?: number;
    type: QuestionType;
    text: string;
    options?: string[];
    correct_answer: string | string[];
    marks?: number;
    explanation?: string;
}

export interface Test {
    id: string;
    user_id: string;
    title: string;
    description?: string;
    subject?: string;
    grade?: string;
    type: TestType;
    questions: TestQuestion[];
    settings?: Record<string, unknown>;
    duration?: number;
    total_marks: number;
    pass_marks?: number;
    shuffle_questions: boolean;
    shuffle_answers: boolean;
    show_answers: boolean;
    is_published: boolean;
    file_path?: string;
    results_count?: number;
    created_at: string;
    updated_at: string;
}

export interface TestResult {
    id: string;
    test_id: string;
    student_name: string;
    student_id?: string;
    answers: Record<number, string | string[]>;
    score?: number;
    percentage?: number;
    passed?: boolean;
    time_taken?: number;
    started_at?: string;
    completed_at?: string;
    created_at: string;
}

export const TEST_TYPES: Record<TestType, string> = {
    quiz: 'اختبار قصير',
    midterm: 'اختبار نصفي',
    final: 'اختبار نهائي',
    diagnostic: 'اختبار تشخيصي',
    practice: 'تدريب',
};

export const QUESTION_TYPES: Record<QuestionType, string> = {
    multiple_choice: 'اختيار من متعدد',
    true_false: 'صح أو خطأ',
    short_answer: 'إجابة قصيرة',
    essay: 'مقالي',
    matching: 'مطابقة',
    fill_blank: 'ملء الفراغ',
    ordering: 'ترتيب',
};

/**
 * =========================
 * School Types (المدارس)
 * =========================
 */
export type SchoolType = 'kindergarten' | 'primary' | 'intermediate' | 'secondary' | 'combined';
export type SchoolGender = 'male' | 'female' | 'mixed';
export type SchoolMemberRole = 'principal' | 'vice_principal' | 'teacher' | 'counselor' | 'admin' | 'supervisor';

export interface School {
    id: string;
    name: string;
    name_en?: string;
    type: SchoolType;
    gender: SchoolGender;
    country: string;
    city?: string;
    district?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
    owner_id: string;
    settings?: Record<string, unknown>;
    is_active: boolean;
    owner?: User;
    members?: SchoolMember[];
    members_count?: number;
    created_at: string;
    updated_at: string;
}

export interface SchoolMember {
    id: number;
    school_id: string;
    user_id: string;
    role: SchoolMemberRole;
    department?: string;
    specialization?: string;
    joined_at?: string;
    is_active: boolean;
    user?: User;
    created_at: string;
    updated_at: string;
}

export const SCHOOL_TYPES: Record<SchoolType, string> = {
    kindergarten: 'روضة أطفال',
    primary: 'ابتدائي',
    intermediate: 'متوسط',
    secondary: 'ثانوي',
    combined: 'مجمع تعليمي',
};

export const SCHOOL_GENDERS: Record<SchoolGender, string> = {
    male: 'بنين',
    female: 'بنات',
    mixed: 'مختلط',
};

export const SCHOOL_MEMBER_ROLES: Record<SchoolMemberRole, string> = {
    principal: 'مدير',
    vice_principal: 'وكيل',
    teacher: 'معلم',
    counselor: 'مرشد',
    admin: 'إداري',
    supervisor: 'مشرف',
};

/**
 * =========================
 * AI Conversation Types
 * =========================
 */
export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AIConversation {
    id: string;
    user_id: string;
    title?: string;
    messages: AIMessage[];
    context_type?: string;
    context_id?: string;
    tokens_used: number;
    created_at: string;
    updated_at: string;
}

/**
 * =========================
 * Notification Types
 * =========================
 */
export interface Notification {
    id: string;
    user_id: string;
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
    is_read: boolean;
    read_at?: string;
    created_at: string;
}

/**
 * =========================
 * Custom Request Types
 * =========================
 */
export type CustomRequestStatus = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface CustomRequest {
    id: string;
    user_id: string;
    title: string;
    description: string;
    category?: string;
    attachments?: string[];
    status: CustomRequestStatus;
    votes_count: number;
    assigned_template_id?: string;
    admin_notes?: string;
    user?: User;
    created_at: string;
    updated_at: string;
}

/**
 * =========================
 * Dashboard Statistics Types
 * =========================
 */
export interface DashboardStats {
    templates_count: number;
    analyses_count: number;
    certificates_count: number;
    plans_count: number;
    achievements_count: number;
    tests_count: number;
    orders_count: number;
    recent_activities: Array<{
        type: string;
        title: string;
        date: string;
    }>;
}


/**
 * =========================
 * Dynamic Engine Types (Firestore)
 * =========================
 * These types define the dynamic template engine architecture.
 * All dynamic data is stored in Firestore, while relational data stays in MySQL.
 *
 * Firestore Collections:
 *   - template_canvas/{templateId}  → TemplateCanvas
 *   - dynamic_forms/{templateId}    → DynamicFormConfig
 *   - ai_prompts/{templateId}       → AIPromptConfig
 *   - user_records/{recordId}       → UserRecord
 */

/** Canvas element that maps a form field to X/Y coordinates on the template image */
export interface CanvasElement {
    id: string;
    field_id: string;          // Links to DynamicFormField.id
    label: string;
    x: number;                 // X coordinate on canvas (percentage 0-100)
    y: number;                 // Y coordinate on canvas (percentage 0-100)
    width: number;             // Width in percentage
    height: number;            // Height in percentage
    font_size: number;         // Font size in pt
    font_family: string;       // e.g., 'Cairo', 'Arial'
    font_weight: 'normal' | 'bold';
    color: string;             // Hex color e.g., '#000000'
    text_align: 'right' | 'center' | 'left';
    rotation: number;          // Rotation in degrees
    max_lines: number;         // Max lines before truncation
    is_visible: boolean;
}

/** Template Canvas: background image + mapped elements (stored in Firestore) */
export interface TemplateCanvas {
    template_id: string;
    background_url: string;    // URL of the blank PDF/Image template
    background_type: 'image' | 'pdf';
    canvas_width: number;      // Original width in px
    canvas_height: number;     // Original height in px
    orientation: 'portrait' | 'landscape';
    elements: CanvasElement[];
    variants: CanvasVariant[];
    updated_at: string;
}

/** Canvas variant: different design for the same template */
export interface CanvasVariant {
    id: string;
    name_ar: string;
    name_en: string;
    background_url: string;
    preview_url: string;
    is_default: boolean;
    elements_override?: Partial<CanvasElement>[]; // Override specific element positions
}

/** Dynamic form field definition (stored in Firestore) */
export interface DynamicFormField {
    id: string;
    name: string;              // Machine name e.g., 'student_name'
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multi_select' | 'image' | 'signature' | 'qrcode' | 'barcode' | 'checkbox' | 'radio' | 'file' | 'color' | 'time';
    label_ar: string;
    label_en: string;
    placeholder_ar?: string;
    placeholder_en?: string;
    default_value?: string;
    options?: FieldOption[];    // For select/radio/checkbox
    validation: FieldValidation;
    ai_fillable: boolean;      // Can AI fill this field?
    ai_hint?: string;          // Hint for AI on how to fill
    group?: string;            // Group name for organizing fields
    sort_order: number;
    is_visible: boolean;
    conditional?: FieldConditional; // Show/hide based on another field
}

export interface FieldOption {
    value: string;
    label_ar: string;
    label_en: string;
}

export interface FieldValidation {
    required: boolean;
    min_length?: number;
    max_length?: number;
    min_value?: number;
    max_value?: number;
    pattern?: string;          // Regex pattern
    custom_message_ar?: string;
    custom_message_en?: string;
}

export interface FieldConditional {
    field_id: string;          // The field to watch
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string;
}

/** Dynamic form configuration (stored in Firestore) */
export interface DynamicFormConfig {
    template_id: string;
    fields: DynamicFormField[];
    field_groups: FieldGroup[];
    settings: FormSettings;
    updated_at: string;
}

export interface FieldGroup {
    id: string;
    name_ar: string;
    name_en: string;
    sort_order: number;
    collapsible: boolean;
    default_collapsed: boolean;
}

export interface FormSettings {
    auto_save: boolean;
    auto_save_interval: number; // seconds
    show_progress: boolean;
    allow_partial_save: boolean;
    require_all_fields: boolean;
    enable_ai_assist: boolean;
}

/** AI Prompt configuration (stored in Firestore) */
export interface AIPromptConfig {
    template_id: string;
    system_prompt: string;     // Hidden system prompt for the template
    field_prompts: AIFieldPrompt[];
    global_context?: string;   // Additional context for all fields
    model: 'gpt-4.1-mini' | 'gpt-4.1-nano' | 'gemini-2.5-flash';
    temperature: number;       // 0-1
    max_tokens: number;
    updated_at: string;
}

export interface AIFieldPrompt {
    field_id: string;
    prompt_type: 'auto_fill' | 'suggest' | 'validate' | 'transform' | 'generate';
    prompt_template: string;   // Template with {{field_name}} placeholders
    context_fields?: string[]; // Other field IDs to include as context
    output_format?: string;    // Expected output format
}

/** User record: a filled template instance (stored in Firestore) */
export interface UserRecord {
    id: string;
    user_id: string;
    template_id: string;
    variant_id?: string;
    field_values: Record<string, any>; // field_id → value
    status: 'draft' | 'completed' | 'exported';
    generated_pdf_url?: string;
    generated_image_url?: string;
    created_at: string;
    updated_at: string;
}

/** Service definition (stored in Firestore for dynamic management) */
export interface ServiceDefinition {
    id: string;
    slug: string;
    name_ar: string;
    name_en: string;
    description_ar: string;
    description_en: string;
    icon: string;
    color: string;
    category: string;
    route: string;             // The actual route to navigate to
    features: ServiceFeature[];
    is_active: boolean;
    sort_order: number;
    requires_auth: boolean;
    requires_subscription: boolean;
}

export interface ServiceFeature {
    title_ar: string;
    title_en: string;
    description_ar: string;
    description_en: string;
    icon: string;
}
