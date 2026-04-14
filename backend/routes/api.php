<?php
// routes/api.php
// Last verified clean: 2026-01-20 - No merge conflicts

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\DownloadController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\RecordController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AdminOrderController;
use App\Http\Controllers\Api\InteractiveTemplateController;
use App\Http\Controllers\Api\UserTemplateDataController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\QRCodeController;
use App\Http\Controllers\Api\CustomRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\EvidenceController;
use App\Http\Controllers\Api\ContentLibraryController;
use App\Http\Controllers\Api\ResourceController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\SectionController;
use App\Http\Controllers\Api\EducationalServiceController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\AdminSchemaController;
use App\Http\Controllers\Api\VersionController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\LibraryController;
use App\Http\Controllers\Api\ContactController;
use Illuminate\Support\Facades\Route;


/*
|--------------------------------------------------------------------------
| API Routes - SERS (Smart Educational Records System)
|--------------------------------------------------------------------------
|
| Public Routes      - No authentication required
| Protected Routes   - Requires auth:sanctum
| Admin Routes       - Requires auth:sanctum + is_admin
|
| Database Structure:
| - MySQL: Users, Categories, Orders, Ready Templates, Payments
| - Firebase Firestore: Interactive Templates, Educational Services
|
*/

// ===========================================================================
// API ROOT STATUS
// ===========================================================================
Route::get('/', function () {
    return response()->json([
        'status'  => 'ok',
        'service' => 'SERS API',
        'version' => '2.0.0',
    ]);
});

// [G-08] Health Check — verifies DB, Cache, and Queue connectivity
Route::get('health', function () {
    $checks = [];
    $healthy = true;

    // Database
    try {
        \Illuminate\Support\Facades\DB::select('SELECT 1');
        $checks['database'] = 'ok';
    } catch (\Throwable $e) {
        $checks['database'] = 'error';
        $healthy = false;
    }

    // Cache
    try {
        \Illuminate\Support\Facades\Cache::put('health_check', true, 10);
        $checks['cache'] = \Illuminate\Support\Facades\Cache::get('health_check') ? 'ok' : 'error';
    } catch (\Throwable $e) {
        $checks['cache'] = 'error';
        $healthy = false;
    }

    // Stripe connectivity (just config check, no API call)
    $checks['stripe'] = !empty(config('services.stripe.secret')) ? 'configured' : 'not_configured';

    return response()->json([
        'status'  => $healthy ? 'healthy' : 'degraded',
        'checks'  => $checks,
        'time'    => now()->toIso8601String(),
        'version' => '2.0.0',
    ], $healthy ? 200 : 503);
});

// ===========================================================================
// PUBLIC ROUTES (لا تتطلب مصادقة)
// ===========================================================================

// ---------------------------
// المصادقة (Authentication)
// ---------------------------
Route::prefix('auth')->middleware('throttle:5,5')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('social', [AuthController::class, 'socialLogin']);
    // Password reset - check email exists (before sending Firebase reset email)
    Route::post('check-email', [AuthController::class, 'checkEmail']);

    // [E-02] Email verification — public endpoint (no auth required, token in URL)
    Route::get('email/verify/{token}', [AuthController::class, 'verifyEmail'])
        ->middleware('throttle:10,1')
        ->name('auth.email.verify');
});

// ---------------------------
// الاتصال (Contact) - Public
// ---------------------------
Route::post('contact', [ContactController::class, 'store'])->middleware('throttle:3,1');

// ---------------------------
// القوالب (Templates) - Legacy /products alias
// [PERF] Simplified — redirect to template routes, avoid full duplication
// ---------------------------
Route::get('products', [TemplateController::class, 'index']);
Route::get('products/{template}', [TemplateController::class, 'show']);

// ---------------------------
// القوالب (Templates) - الواجهة الرئيسية للفرونت إند
// Main template routes - unified API for marketplace
// ---------------------------
Route::prefix('templates')->group(function () {
    // قائمة القوالب مع فلترة
    Route::get('/', [TemplateController::class, 'index']);
    Route::get('search', [TemplateController::class, 'index']); // Search via query params
    Route::get('featured', [TemplateController::class, 'featured']);
    Route::get('sections', [TemplateController::class, 'sections']);
    Route::get('section/{slug}', [TemplateController::class, 'bySection']);
    Route::get('category/{slug}', [TemplateController::class, 'byCategory']);
    
    // عرض قالب واحد
    Route::get('{template}', [TemplateController::class, 'show']);
    Route::get('{template}/reviews', [ReviewController::class, 'index']);
    Route::get('{template}/download', [TemplateController::class, 'download'])->middleware('auth:sanctum')->withoutMiddleware(['throttle:api']);
    
    // Favorite toggle (requires auth)
    Route::post('{template}/favorite', [InteractiveTemplateController::class, 'toggleFavorite'])->middleware('auth:sanctum');
});

// ---------------------------
// التصنيفات (Categories) - عامة
// ---------------------------
Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::get('{slug}', [CategoryController::class, 'show']);
});

// ---------------------------
// أكواد الخصم (Coupons) - التحقق العام
// ---------------------------
Route::prefix('coupons')->middleware('throttle:3,1')->group(function () {
    Route::post('validate', [CouponController::class, 'validate']);
});

// ---------------------------
// الإحصائيات العامة (Public Stats) - للصفحة الرئيسية
// ---------------------------
Route::get('stats/public', [StatsController::class, 'publicStats']);

// ---------------------------
// الأقسام (Sections) - عامة
// ---------------------------
Route::prefix('sections')->group(function () {
    Route::get('/', [SectionController::class, 'index']);
    Route::get('{section}', [SectionController::class, 'show']);
    Route::get('slug/{slug}', [SectionController::class, 'bySlug']);
});

// ===========================================================================
// PROTECTED ROUTES (تتطلب مصادقة Sanctum)
// ===========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // ---------------------------
    // المصادقة المحمية
    // ---------------------------
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::post('logout-all', [AuthController::class, 'logoutAll']); // [C-05] Logout from all devices
        Route::get('me', [AuthController::class, 'me']);
        // [E-02] Resend email verification (rate-limited inside the method)
        Route::post('email/resend', [AuthController::class, 'sendVerificationEmail'])
            ->middleware('throttle:3,5'); // max 3 requests per 5 minutes
    });

    // ---------------------------
    // Dashboard Summary — Single endpoint replaces 7+ parallel calls
    // ---------------------------
    Route::get('dashboard/summary', [DashboardController::class, 'summary']);

    // ---------------------------
    // مكتبة المستخدم (Library) — [FIX HL-04] Single source of truth via UserLibrary
    // ---------------------------
    Route::prefix('library')->group(function () {
        Route::get('/', [LibraryController::class, 'index']);
        Route::get('count', [LibraryController::class, 'count']);
    });

    // ---------------------------
    // الملف الشخصي (User Profile)
    // ---------------------------
    Route::prefix('user')->group(function () {
        Route::post('profile', [UserController::class, 'updateProfile']);
        Route::post('password', [UserController::class, 'changePassword']);
    });

    // ---------------------------
    // المفضلة (Wishlist) — Legacy alias, redirects to /wishlists
    // Kept for backward compatibility with older frontend versions
    // ---------------------------
    Route::get('wishlist', [WishlistController::class, 'index']);
    Route::post('wishlist/toggle', [WishlistController::class, 'toggle']);

    // ---------------------------
    // الطلبات (Orders)
    // ---------------------------
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::get('{id}', [OrderController::class, 'show']);
        Route::post('{id}/pay', [OrderController::class, 'pay']);
    });

    // ---------------------------
    // التنزيلات (Downloads)
    // ---------------------------
    Route::prefix('downloads')->group(function () {
        Route::get('/', [DownloadController::class, 'index']);
        Route::get('{orderItemId}', [DownloadController::class, 'download']);
        Route::get('{orderItemId}/info', [DownloadController::class, 'info']);
    });

    // ---------------------------
    // الدفع (Payments)
    // ---------------------------
    Route::prefix('payments')->group(function () {
        Route::post('create-intent', [PaymentController::class, 'createPaymentIntent']);

        // Wallet endpoints
        Route::prefix('wallet')->group(function () {
            Route::get('balance', [PaymentController::class, 'walletBalance']);
            Route::get('transactions', [PaymentController::class, 'walletTransactions']);
            Route::post('topup', [PaymentController::class, 'walletTopup']);
            Route::post('confirm-topup', [PaymentController::class, 'confirmTopup']);
            Route::post('transfer', [PaymentController::class, 'walletTransfer'])->middleware('api.limit:destructive');
        });
    });

    // ---------------------------
    // السجلات التفاعلية (Records)
    // ---------------------------
    Route::prefix('records')->group(function () {
        Route::get('/', [RecordController::class, 'index']);
        Route::get('{recordId}', [RecordController::class, 'show']);
        Route::put('{recordId}', [RecordController::class, 'update']);
    });

    // ---------------------------
    // تصدير القوالب (Export) - PDF & Image
    // ---------------------------
    Route::prefix('export')->middleware('api.limit:export')->group(function () {
        Route::post('pdf', [ExportController::class, 'toPdf']);
        Route::post('image', [ExportController::class, 'toImage']);
        Route::post('word', [ExportController::class, 'toWord']);
        Route::get('download/{filename}', [ExportController::class, 'download']);
    });

    // ---------------------------
    // الذكاء الاصطناعي (AI)
    // ---------------------------
    Route::prefix('ai')->middleware('api.limit:ai')->group(function () {
        Route::post('suggest', [AIController::class, 'suggest']);
        Route::post('fill-all', [AIController::class, 'fillAll']);
        Route::post('suggest-analysis', [AIController::class, 'suggestAnalysis']);
        Route::post('suggest-plan', [AIController::class, 'suggestPlan']);
        Route::post('suggest-certificate', [AIController::class, 'suggestCertificate']);
        Route::post('chat', [AIController::class, 'chat']);
        Route::get('conversations', [AIController::class, 'conversations']);
        Route::get('conversations/{id}', [AIController::class, 'conversation']);
        Route::delete('conversations/{id}', [AIController::class, 'deleteConversation']);
        Route::post('generate-performance-report', [AIController::class, 'generatePerformanceReport']);
        Route::post('generate-achievement-doc', [AIController::class, 'generateAchievementDoc']);
        Route::post('generate-curriculum', [AIController::class, 'generateCurriculumDistribution']);
        Route::post('recommendations', [AIController::class, 'getRecommendations']);
        Route::post('quick-suggestions', [AIController::class, 'quickSuggestions']);
        
        // Dynamic Contextual AI Prompts
        Route::post('contextual-suggest', [AIController::class, 'contextualSuggest']);
        Route::post('bulk-suggest', [AIController::class, 'bulkSuggest']);
        Route::post('analyze-content', [AIController::class, 'analyzeContent']);

        // [E-02] Async AI Job System
        Route::post('async', [AIController::class, 'asyncRequest']);
        Route::get('jobs/{jobId}', [AIController::class, 'jobStatus']);
    });

    // ---------------------------
    // البحث العام (Global Search)
    // ---------------------------
    Route::get('search', [AIController::class, 'search'])->middleware('api.limit:default');

    // ---------------------------
    // التقييمات (Reviews) - المحمية
    // ---------------------------
    Route::prefix('templates/{slug}')->group(function () {
        Route::get('can-review', [ReviewController::class, 'canReview']);
        Route::get('my-review', [ReviewController::class, 'myReview']);
        Route::post('reviews', [ReviewController::class, 'store'])->middleware('api.limit:auth');
    });
    Route::put('reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('reviews/{id}', [ReviewController::class, 'destroy']);

    // ===========================================================================
    // EDUCATIONAL SERVICES (Firebase Firestore)
    // Rate limited to prevent abuse
    // ===========================================================================
    Route::prefix('services/{serviceType}')->middleware('throttle:60,1')->group(function () {
        Route::get('/', [EducationalServiceController::class, 'index']);
        Route::post('/', [EducationalServiceController::class, 'store']);
        Route::get('statistics', [EducationalServiceController::class, 'statistics']);
        Route::get('{id}', [EducationalServiceController::class, 'show']);
        Route::put('{id}', [EducationalServiceController::class, 'update']);
        Route::delete('{id}', [EducationalServiceController::class, 'destroy']);
        Route::post('{id}/export', [EducationalServiceController::class, 'export']);
    });

    // ---------------------------
    // الإحالات (Referrals)
    // ---------------------------
    Route::prefix('referrals')->group(function () {
        Route::get('stats', [ReferralController::class, 'stats']);
        Route::post('generate-code', [ReferralController::class, 'generateCode']);
        Route::get('list', [ReferralController::class, 'referrals']);
        Route::get('earnings', [ReferralController::class, 'earnings']);
        Route::post('validate-code', [ReferralController::class, 'validateCode']);
        Route::post('apply-code', [ReferralController::class, 'applyCode']);
        Route::post('withdraw', [ReferralController::class, 'withdraw']);
    });

    // ---------------------------
    // المفضلة (Wishlist)
    // ---------------------------
    Route::prefix('wishlists')->group(function () {
        Route::get('/', [WishlistController::class, 'index']);
        Route::get('ids', [WishlistController::class, 'ids']);
        Route::post('toggle', [WishlistController::class, 'toggle']);
        Route::get('check/{templateId}', [WishlistController::class, 'check']);
        Route::delete('clear', [WishlistController::class, 'clear']);
        Route::delete('{templateId}', [WishlistController::class, 'destroy']);
    });

    // ---------------------------
    // الإشعارات (Notifications)
    // ---------------------------
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('count', [NotificationController::class, 'unreadCount']);
        Route::put('read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('read', [NotificationController::class, 'deleteAllRead']);
        Route::put('{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::delete('{notification}', [NotificationController::class, 'destroy']);
    });

    // ---------------------------
    // بيانات المستخدم للقوالب
    // ---------------------------
    Route::prefix('user-templates')->group(function () {
        Route::get('/', [UserTemplateDataController::class, 'index']);
        Route::post('/', [UserTemplateDataController::class, 'store']);
        Route::get('{userTemplateData}', [UserTemplateDataController::class, 'show']);
        Route::put('{userTemplateData}', [UserTemplateDataController::class, 'update']);
        Route::delete('{userTemplateData}', [UserTemplateDataController::class, 'destroy']);
        
        // Version Control Routes
        Route::get('{recordId}/versions', [VersionController::class, 'getVersionHistory']);
        Route::post('{recordId}/versions', [VersionController::class, 'createVersion']);
        Route::post('{recordId}/versions/{versionId}/restore', [VersionController::class, 'restoreVersion']);
        Route::get('{recordId}/versions/{version1Id}/compare/{version2Id}', [VersionController::class, 'compareVersions']);
        Route::delete('{recordId}/versions/cleanup', [VersionController::class, 'cleanupOldVersions']);
        
        // Analysis Routes
        Route::post('{recordId}/analyze', [VersionController::class, 'analyzeRecord']);
        Route::post('batch-analyze', [VersionController::class, 'batchAnalyze']);
        
        // PDF Generation Routes (Payment Wall Protected)
        Route::post('{recordId}/pdf', [VersionController::class, 'generatePDF'])->middleware('payment.wall');
        Route::post('{recordId}/cross-template-pdf/{targetTemplateId}', [VersionController::class, 'generateCrossTemplatePDF'])->middleware('payment.wall');
    });


    // ---------------------------
    // رمز QR
    // ---------------------------
    Route::prefix('qrcode')->group(function () {
        Route::post('generate', [QRCodeController::class, 'generate']);
        Route::get('verify/{code}', [QRCodeController::class, 'verify']);
    });

    // ---------------------------
    // الطلبات المخصصة
    // ---------------------------
    Route::prefix('custom-requests')->group(function () {
        Route::get('/', [CustomRequestController::class, 'index']);
        Route::post('/', [CustomRequestController::class, 'store'])->middleware('api.limit:auth');
        Route::get('my-requests', [CustomRequestController::class, 'myRequests']);
        Route::get('{customRequest}', [CustomRequestController::class, 'show']);
        Route::post('{customRequest}/cancel', [CustomRequestController::class, 'cancel']);
        Route::post('{customRequest}/vote', [CustomRequestController::class, 'vote']); // [FIX] Missing vote route
    });


    // ---------------------------
    // الشواهد
    // ---------------------------
    Route::prefix('evidences')->group(function () {
        Route::get('/', [EvidenceController::class, 'index']);
        Route::post('/', [EvidenceController::class, 'store']);
        Route::get('{evidence}', [EvidenceController::class, 'show']);
        Route::put('{evidence}', [EvidenceController::class, 'update']);
        Route::delete('{evidence}', [EvidenceController::class, 'destroy']);
    });

    // ---------------------------
    // مكتبة المحتوى
    // ---------------------------
    Route::prefix('content-library')->group(function () {
        Route::get('/', [ContentLibraryController::class, 'index']);
        Route::get('categories', [ContentLibraryController::class, 'categories']);
        Route::get('{id}', [ContentLibraryController::class, 'show']);
        Route::post('{id}/use', [ContentLibraryController::class, 'use']);
        
        // Extended CRUD for admin fallback or specific perms? 
        // Admin routes are below, this is user facing (if any)
    });

    // ---------------------------
    // الموارد
    // ---------------------------
    Route::prefix('resources')->group(function () {
        Route::get('/', [ResourceController::class, 'index']);
        Route::post('/', [ResourceController::class, 'store']);
        Route::get('{resource}', [ResourceController::class, 'show']);
        Route::put('{resource}', [ResourceController::class, 'update']);
        Route::delete('{resource}', [ResourceController::class, 'destroy']);
        Route::post('{resource}/share', [ResourceController::class, 'share']);
    });

    // ---------------------------
    // التنزيلات — Routes defined in the downloads group above (lines 199-203)
    // ---------------------------

    // ---------------------------
    // الإحصائيات
    // ---------------------------
    Route::prefix('stats')->group(function () {
        Route::get('dashboard', [StatsController::class, 'dashboard']);
        Route::get('usage', [StatsController::class, 'usage']);
    });

    // ---------------------------
    // الإحالات (Referrals) — استخدام المسارات المعرّفة أعلاه فقط (/ المجموعة الأولى في السطر 284)
    // ---------------------------
});

// ===========================================================================
// CUSTOM REQUESTS — Index & Show (unified inside main auth:sanctum group above)
// Legacy standalone block removed — see lines 360-364 for the unified group.
// ===========================================================================
// ===========================================================================
// STRIPE WEBHOOKS (No auth — Stripe calls this directly with signature verification)
// ===========================================================================
Route::prefix('webhooks')->middleware('throttle:120,1')->group(function () { // [C-08] Rate limit: max 120 req/min
    Route::post('stripe', [PaymentController::class, 'handleStripeWebhook']);
});

// ===========================================================================
// ADMIN ROUTES (تتطلب مصادقة + صلاحيات الأدمن)
// ===========================================================================
Route::middleware(['auth:sanctum', 'is_admin'])->prefix('admin')->group(function () {

    // ---------------------------
    // إحصائيات الأدمن
    // ---------------------------
    Route::prefix('stats')->group(function () {
        Route::get('overview', [StatsController::class, 'adminOverview']);
        Route::get('sales', [StatsController::class, 'salesStats']);
        Route::get('users', [StatsController::class, 'usersStats']);
        Route::get('templates', [StatsController::class, 'templatesStats']);
        Route::get('chart', [StatsController::class, 'chart']);
    });

    // ---------------------------
    // إدارة الذكاء الاصطناعي (Admin AI)
    // ---------------------------
    Route::prefix('ai')->group(function () {
        Route::get('stats', [AIController::class, 'adminStats']);
        Route::post('settings', [AIController::class, 'updateSettings']);
    });

    // ---------------------------
    // إدارة المستخدمين
    // ---------------------------
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('{id}', [UserController::class, 'show']);
        Route::put('{id}', [UserController::class, 'update']);
        Route::delete('{id}', [UserController::class, 'destroy'])->middleware('api.limit:destructive');
        Route::post('{id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('{id}/toggle-admin', [UserController::class, 'toggleAdmin']);
        Route::post('{id}/wallet-adjust', [UserController::class, 'adjustWalletBalance'])->middleware('api.limit:destructive');
    });

    // ---------------------------
    // إدارة الطلبات
    // ---------------------------
    Route::prefix('orders')->group(function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('export', [AdminOrderController::class, 'export']); // [H-2] MUST be before {id}
        Route::get('{id}', [AdminOrderController::class, 'show']);
        Route::put('{id}/status', [AdminOrderController::class, 'updateStatus']);
    });

    // ---------------------------
    // إدارة القوالب (Unified Templates)
    // ---------------------------
    Route::prefix('templates')->group(function () {
        // قائمة كل القوالب
        Route::get('/', [TemplateController::class, 'adminIndex']);
        
        // إنشاء قالب
        Route::post('/', [TemplateController::class, 'store']);
        
        // عرض قالب
        Route::get('{template}', [TemplateController::class, 'show']);
        
        // تحديث قالب
        Route::post('{template}', [TemplateController::class, 'update']); // POST for FormData
        Route::put('{template}', [TemplateController::class, 'update']);
        
        // حذف قالب
        Route::delete('{template}', [TemplateController::class, 'destroy'])->middleware('api.limit:destructive');
        
        // Status/Featured toggles
        Route::post('{template}/toggle-status', [TemplateController::class, 'toggleStatus']);
        Route::post('{template}/toggle-featured', [TemplateController::class, 'toggleFeatured']);
        
        // Schema Builder Routes (NO-CODE)
        Route::get('{templateId}/schema', [AdminSchemaController::class, 'getTemplateSchema']);
        Route::put('{templateId}/schema', [AdminSchemaController::class, 'updateTemplateSchema']);
        Route::post('{templateId}/fields', [AdminSchemaController::class, 'addField']);
        Route::delete('{templateId}/fields/{fieldId}', [AdminSchemaController::class, 'removeField']);
        Route::post('{templateId}/fields/reorder', [AdminSchemaController::class, 'reorderFields']);
        Route::post('{templateId}/fields/{fieldId}/toggle-ai', [AdminSchemaController::class, 'toggleFieldAI']);
    });

    // ---------------------------
    // إدارة التصنيفات
    // @deprecated — MySQL categories are deprecated. Firestore service_categories is the single source of truth.
    // These routes are kept temporarily for backward compatibility. Scheduled for removal.
    // ---------------------------
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'adminIndex']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::get('{id}', [CategoryController::class, 'adminShow']);
        Route::put('{id}', [CategoryController::class, 'update']);
        Route::delete('{id}', [CategoryController::class, 'destroy'])->middleware('api.limit:destructive');
    });

    // ---------------------------
    // إدارة الأقسام
    // ---------------------------
    Route::prefix('sections')->group(function () {
        Route::get('/', [SectionController::class, 'adminIndex']);
        Route::post('/', [SectionController::class, 'store']);
        // IMPORTANT: reorder must be before {id} to avoid routing conflict
        Route::post('reorder', [SectionController::class, 'reorder']);
        Route::get('{id}', [SectionController::class, 'adminShow']);
        Route::put('{id}', [SectionController::class, 'update']);
        Route::delete('{id}', [SectionController::class, 'destroy'])->middleware('api.limit:destructive');
    });

    // ---------------------------
    // تقارير الأدمن (Admin Reports)
    // [REFACTOR] Extracted from inline closures into AdminReportController with 5-min caching
    // ---------------------------
    Route::prefix('reports')->group(function () {
        Route::get('sales', [AdminReportController::class, 'sales']);
        Route::get('users', [AdminReportController::class, 'users']);
        Route::get('templates', [AdminReportController::class, 'templates']);
        Route::get('ai', [AdminReportController::class, 'ai']);
    });


    // ---------------------------
    // إدارة التقييمات (Admin Reviews)
    // ---------------------------
    Route::prefix('reviews')->group(function () {
        Route::get('/', [ReviewController::class, 'adminIndex']);
        Route::post('{id}/approve', [ReviewController::class, 'approve']);
        Route::post('{id}/reject', [ReviewController::class, 'reject']);
        Route::delete('{id}', [ReviewController::class, 'adminDestroy'])->middleware('api.limit:destructive');
    });

    // ---------------------------
    // إدارة أكواد الخصم (Admin Coupons)
    // ---------------------------
    Route::prefix('coupons')->group(function () {
        Route::get('/', [CouponController::class, 'index']);
        Route::post('/', [CouponController::class, 'store']);
        Route::put('{id}', [CouponController::class, 'update']);
        Route::patch('{id}', [CouponController::class, 'update']); // Toggle active support
        Route::delete('{id}', [CouponController::class, 'destroy'])->middleware('api.limit:destructive');
    });

    // ---------------------------
    // إدارة القوالب التفاعلية (Interactive Specifics if needed)
    // ---------------------------
    Route::prefix('interactive-templates')->group(function () {
        Route::post('{id}/variants', [InteractiveTemplateController::class, 'addVariant']);
        Route::put('{id}/variants/{variantId}', [InteractiveTemplateController::class, 'updateVariant']);
        Route::delete('{id}/variants/{variantId}', [InteractiveTemplateController::class, 'deleteVariant']);
        
        Route::post('{id}/fields', [InteractiveTemplateController::class, 'addField']);
        Route::put('{id}/fields/{fieldId}', [InteractiveTemplateController::class, 'updateField']);
        Route::delete('{id}/fields/{fieldId}', [InteractiveTemplateController::class, 'deleteField']);
    });

    // ---------------------------
    // إدارة الطلبات المخصصة
    // ---------------------------
    Route::prefix('custom-requests')->group(function () {
        Route::get('/', [CustomRequestController::class, 'adminIndex']);
        Route::get('{id}', [CustomRequestController::class, 'adminShow']);
        Route::put('{id}/status', [CustomRequestController::class, 'updateStatus']);
        Route::post('{id}/assign', [CustomRequestController::class, 'assign']);
        Route::post('{id}/complete', [CustomRequestController::class, 'complete']);
    });

    // ---------------------------
    // إدارة الإشعارات
    // ---------------------------
    Route::prefix('notifications')->group(function () {
        Route::post('send', [NotificationController::class, 'send']);
        Route::post('broadcast', [NotificationController::class, 'broadcast']);
    });

    // ---------------------------
    // إدارة مكتبة المحتوى
    // ---------------------------
    Route::prefix('content-library')->group(function () {
        Route::post('/', [ContentLibraryController::class, 'store']);
        Route::put('{id}', [ContentLibraryController::class, 'update']);
        Route::delete('{id}', [ContentLibraryController::class, 'destroy']);
    });

    // ---------------------------
    // إعدادات النظام
    // ---------------------------
    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index']);
        Route::post('/', [SettingsController::class, 'update']);
        Route::post('clear-cache', [SettingsController::class, 'clearCache']);
        Route::get('logs', [SettingsController::class, 'logs']);
        // [FIX-11] GET = query status, POST = toggle on/off
        Route::get('maintenance', [SettingsController::class, 'maintenanceStatus']);
        Route::post('maintenance', [SettingsController::class, 'toggleMaintenance']);
        Route::get('storage', [SettingsController::class, 'storage']);
    });

    // ---------------------------
    // إدارة سجل النشاطات (Activity Logs) — Admin Only
    // ---------------------------
    Route::prefix('activity-logs')->group(function () {
        Route::get('/', [ActivityLogController::class, 'index']);
        Route::get('summary', [ActivityLogController::class, 'summary']);
    });

    // ---------------------------
    // إدارة رسائل التواصل (Contact Messages) — Admin Only
    // [E-08] Full CRUD: list, mark read, delete
    // ---------------------------
    Route::prefix('contact-messages')->group(function () {
        Route::get('/', [ContactController::class, 'index']);
        Route::put('{contactMessage}/read', [ContactController::class, 'markRead']);
        Route::delete('{contactMessage}', [ContactController::class, 'destroy'])->middleware('api.limit:destructive');
    });

    // ---------------------------
    // إدارة الخدمات التعليمية (Admin Educational Services)
    // Admin can view/edit/delete ALL users' educational records
    // ---------------------------
    Route::prefix('educational-services/{serviceType}')->group(function () {
        Route::get('/', [EducationalServiceController::class, 'adminIndex']);
        Route::post('/', [EducationalServiceController::class, 'adminStore']); // Admin create for any user
        Route::get('statistics', [EducationalServiceController::class, 'adminStatistics']);
        Route::get('{id}', [EducationalServiceController::class, 'adminShow']);
        Route::put('{id}', [EducationalServiceController::class, 'adminUpdate']);
        Route::delete('{id}', [EducationalServiceController::class, 'adminDestroy']);
    });

    // ---------------------------
    // إدارة المنهج السعودي (Curriculum)
    // [REFACTOR] Extracted from inline closures → CurriculumController with validation
    // ---------------------------
    Route::prefix('curriculum')->group(function () {
        Route::get('stages', [\App\Http\Controllers\Api\CurriculumController::class, 'getStages']);
        Route::post('stages', [\App\Http\Controllers\Api\CurriculumController::class, 'storeStage']);
        Route::put('stages/{id}', [\App\Http\Controllers\Api\CurriculumController::class, 'updateStage']);
        Route::delete('stages/{id}', [\App\Http\Controllers\Api\CurriculumController::class, 'deleteStage']);

        Route::get('grades', [\App\Http\Controllers\Api\CurriculumController::class, 'getGrades']);
        Route::post('grades', [\App\Http\Controllers\Api\CurriculumController::class, 'storeGrade']);
        Route::put('grades/{id}', [\App\Http\Controllers\Api\CurriculumController::class, 'updateGrade']);
        Route::delete('grades/{id}', [\App\Http\Controllers\Api\CurriculumController::class, 'deleteGrade']);

        Route::get('subjects', [\App\Http\Controllers\Api\CurriculumController::class, 'getSubjects']);
        Route::post('subjects', [\App\Http\Controllers\Api\CurriculumController::class, 'storeSubject']);
        Route::put('subjects/{id}', [\App\Http\Controllers\Api\CurriculumController::class, 'updateSubject']);
        Route::delete('subjects/{id}', [\App\Http\Controllers\Api\CurriculumController::class, 'deleteSubject']);
    });

    // ---------------------------
    // إدارة طلبات سحب أرباح الإحالة — Admin
    // ---------------------------
    Route::prefix('withdrawals')->group(function () {

        // GET /api/admin/withdrawals
        Route::get('/', [\App\Http\Controllers\Api\AdminWithdrawalController::class, 'index']);
        
        // GET /api/admin/withdrawals/stats
        Route::get('stats', [\App\Http\Controllers\Api\AdminWithdrawalController::class, 'stats']);
        
        // POST /api/admin/withdrawals/{id}/approve
        Route::post('{id}/approve', [\App\Http\Controllers\Api\AdminWithdrawalController::class, 'approve']);
        
        // POST /api/admin/withdrawals/{id}/reject
        Route::post('{id}/reject', [\App\Http\Controllers\Api\AdminWithdrawalController::class, 'reject']);
    });
});

