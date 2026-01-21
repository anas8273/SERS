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
        'status' => 'ok',
        'service' => 'SERS API',
        'version' => '2.0.0',
        'description' => 'نظام السجلات التعليمية الذكي - حقل الخدمات التعليمية',
        'database' => [
            'mysql' => 'Users, Categories, Orders, Ready Templates',
            'firebase' => 'Interactive Templates, Educational Services',
        ],
        'endpoints' => [
            'auth' => '/api/auth/*',
            'templates' => '/api/templates/*',
            'categories' => '/api/categories/*',
            'services' => '/api/services/{type}/*',
            'ai' => '/api/ai/*',
            'admin' => '/api/admin/* (requires auth)',
        ],
    ]);
});

// ===========================================================================
// PUBLIC ROUTES (لا تتطلب مصادقة)
// ===========================================================================

// ---------------------------
// المصادقة (Authentication)
// ---------------------------
Route::prefix('auth')->middleware('throttle:5,1')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('social', [AuthController::class, 'socialLogin']);
});

// ---------------------------
// المنتجات (Products) - إعادة توجيه للقوالب
// For backward compatibility, redirect to templates
// ---------------------------
Route::prefix('products')->group(function () {
    // Redirect all product routes to templates
    Route::get('/', [TemplateController::class, 'index']);
    Route::get('search', [TemplateController::class, 'index']); // Search via query params
    Route::get('featured', [TemplateController::class, 'featured']);
    Route::get('{template}', [TemplateController::class, 'show']);
    Route::get('{template}/reviews', [ReviewController::class, 'index']);
});

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
    Route::get('{template}/download', [TemplateController::class, 'download']);
    
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
Route::prefix('coupons')->group(function () {
    Route::post('validate', [CouponController::class, 'validate']);
});

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
        Route::get('me', [AuthController::class, 'me']);
    });

    // ---------------------------
    // الملف الشخصي (User Profile)
    // ---------------------------
    Route::prefix('user')->group(function () {
        Route::post('profile', [UserController::class, 'updateProfile']);
        Route::post('password', [UserController::class, 'changePassword']);
    });

    // ---------------------------
    // المفضلة (Wishlist)
    // ---------------------------
    Route::prefix('wishlist')->group(function () {
        Route::get('/', [InteractiveTemplateController::class, 'favorites']);
        Route::post('toggle', [InteractiveTemplateController::class, 'toggleFavorite']);
    });

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
    // الدفع (Payments)
    // ---------------------------
    Route::prefix('payments')->group(function () {
        Route::post('create-intent', [PaymentController::class, 'createPaymentIntent']);
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
    // الذكاء الاصطناعي (AI)
    // ---------------------------
    Route::prefix('ai')->group(function () {
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
    });

    // ---------------------------
    // البحث العام (Global Search)
    // ---------------------------
    Route::get('search', [AIController::class, 'search']);

    // ---------------------------
    // التقييمات (Reviews) - المحمية
    // ---------------------------
    Route::prefix('products/{slug}')->group(function () {
        Route::get('can-review', [ReviewController::class, 'canReview']);
        Route::get('my-review', [ReviewController::class, 'myReview']);
        Route::post('reviews', [ReviewController::class, 'store']);
    });
    Route::put('reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('reviews/{id}', [ReviewController::class, 'destroy']);

    // ===========================================================================
    // EDUCATIONAL SERVICES (Firebase Firestore)
    // ===========================================================================
    Route::prefix('services/{serviceType}')->group(function () {
        Route::get('/', [EducationalServiceController::class, 'index']);
        Route::post('/', [EducationalServiceController::class, 'store']);
        Route::get('statistics', [EducationalServiceController::class, 'statistics']);
        Route::get('{id}', [EducationalServiceController::class, 'show']);
        Route::put('{id}', [EducationalServiceController::class, 'update']);
        Route::delete('{id}', [EducationalServiceController::class, 'destroy']);
        Route::post('{id}/export', [EducationalServiceController::class, 'export']);
    });

    // Specific Service Types
    Route::prefix('certificates')->group(function () {
        Route::get('/', fn($r) => app(EducationalServiceController::class)->index($r, 'certificates'));
        Route::post('/', fn($r) => app(EducationalServiceController::class)->store($r, 'certificates'));
        Route::get('{id}', fn($r, $id) => app(EducationalServiceController::class)->show('certificates', $id));
        Route::put('{id}', fn($r, $id) => app(EducationalServiceController::class)->update($r, 'certificates', $id));
        Route::delete('{id}', fn($r, $id) => app(EducationalServiceController::class)->destroy('certificates', $id));
    });

    Route::prefix('plans')->group(function () {
        Route::get('/', fn($r) => app(EducationalServiceController::class)->index($r, 'plans'));
        Route::post('/', fn($r) => app(EducationalServiceController::class)->store($r, 'plans'));
        Route::get('{id}', fn($r, $id) => app(EducationalServiceController::class)->show('plans', $id));
        Route::put('{id}', fn($r, $id) => app(EducationalServiceController::class)->update($r, 'plans', $id));
        Route::delete('{id}', fn($r, $id) => app(EducationalServiceController::class)->destroy('plans', $id));
    });

    Route::prefix('achievements')->group(function () {
        Route::get('/', fn($r) => app(EducationalServiceController::class)->index($r, 'achievements'));
        Route::post('/', fn($r) => app(EducationalServiceController::class)->store($r, 'achievements'));
        Route::get('{id}', fn($r, $id) => app(EducationalServiceController::class)->show('achievements', $id));
        Route::put('{id}', fn($r, $id) => app(EducationalServiceController::class)->update($r, 'achievements', $id));
        Route::delete('{id}', fn($r, $id) => app(EducationalServiceController::class)->destroy('achievements', $id));
    });

    Route::prefix('performances')->group(function () {
        Route::get('/', fn($r) => app(EducationalServiceController::class)->index($r, 'performances'));
        Route::post('/', fn($r) => app(EducationalServiceController::class)->store($r, 'performances'));
        Route::get('{id}', fn($r, $id) => app(EducationalServiceController::class)->show('performances', $id));
        Route::put('{id}', fn($r, $id) => app(EducationalServiceController::class)->update($r, 'performances', $id));
        Route::delete('{id}', fn($r, $id) => app(EducationalServiceController::class)->destroy('performances', $id));
    });

    Route::prefix('tests')->group(function () {
        Route::get('/', fn($r) => app(EducationalServiceController::class)->index($r, 'tests'));
        Route::post('/', fn($r) => app(EducationalServiceController::class)->store($r, 'tests'));
        Route::get('{id}', fn($r, $id) => app(EducationalServiceController::class)->show('tests', $id));
        Route::put('{id}', fn($r, $id) => app(EducationalServiceController::class)->update($r, 'tests', $id));
        Route::delete('{id}', fn($r, $id) => app(EducationalServiceController::class)->destroy('tests', $id));
    });

    // ---------------------------
    // الإحالات (Referrals)
    // ---------------------------
    Route::prefix('referrals')->group(function () {
        Route::get('/', [ReferralController::class, 'index']);
        Route::get('code', [ReferralController::class, 'getCode']);
        Route::post('apply', [ReferralController::class, 'apply']);
        Route::get('stats', [ReferralController::class, 'stats']);
        Route::get('rewards', [ReferralController::class, 'rewards']);
        Route::post('claim/{rewardId}', [ReferralController::class, 'claimReward']);
    });

    // ---------------------------
    // القوالب التفاعلية - محمية
    // ---------------------------
    Route::prefix('templates')->group(function () {
        // Shared favorites routes handled above in 'wishlist', but also mapped here for compat
        Route::post('{interactiveTemplate}/favorite', [InteractiveTemplateController::class, 'toggleFavorite']);
        Route::get('user/favorites', [InteractiveTemplateController::class, 'favorites']);
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
    });

    // ---------------------------
    // التصدير (Export)
    // ---------------------------
    Route::prefix('export')->group(function () {
        Route::post('pdf', [ExportController::class, 'toPdf']);
        Route::post('image', [ExportController::class, 'toImage']);
        Route::post('word', [ExportController::class, 'toWord']);
        Route::get('download/{filename}', [ExportController::class, 'download']);
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
        Route::post('/', [CustomRequestController::class, 'store']);
        Route::get('my-requests', [CustomRequestController::class, 'myRequests']);
        Route::post('{customRequest}/cancel', [CustomRequestController::class, 'cancel']);
    });

    // ---------------------------
    // الإشعارات
    // ---------------------------
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('{id}/read', [NotificationController::class, 'markAsRead']);
        Route::post('read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('{id}', [NotificationController::class, 'destroy']);
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
    // التنزيلات
    // ---------------------------
    Route::prefix('downloads')->group(function () {
        Route::get('/', [DownloadController::class, 'index']);
        Route::get('{id}', [DownloadController::class, 'download']);
    });

    // ---------------------------
    // الإحصائيات
    // ---------------------------
    Route::prefix('stats')->group(function () {
        Route::get('dashboard', [StatsController::class, 'dashboard']);
        Route::get('usage', [StatsController::class, 'usage']);
    });
});

// ===========================================================================
// PUBLIC CUSTOM REQUESTS ROUTES
// ===========================================================================
Route::prefix('custom-requests')->group(function () {
    Route::get('/', [CustomRequestController::class, 'index']);
    Route::get('{customRequest}', [CustomRequestController::class, 'show']);
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
    });

    // ---------------------------
    // إدارة المستخدمين
    // ---------------------------
    Route::prefix('users')->group(function () {
        Route::get('/', [UserController::class, 'index']);
        Route::get('{id}', [UserController::class, 'show']);
        Route::put('{id}', [UserController::class, 'update']);
        Route::delete('{id}', [UserController::class, 'destroy']);
        Route::post('{id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::post('{id}/toggle-admin', [UserController::class, 'toggleAdmin']);
    });

    // ---------------------------
    // إدارة الطلبات
    // ---------------------------
    Route::prefix('orders')->group(function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('{id}', [AdminOrderController::class, 'show']);
        Route::put('{id}/status', [AdminOrderController::class, 'updateStatus']);
        Route::get('export', [AdminOrderController::class, 'export']);
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
        Route::delete('{template}', [TemplateController::class, 'destroy']);
        
        // Status/Featured toggles
        Route::post('{template}/toggle-status', [TemplateController::class, 'toggleStatus']);
        Route::post('{template}/toggle-featured', [TemplateController::class, 'toggleFeatured']);
    });

    // ---------------------------
    // إدارة التصنيفات
    // ---------------------------
    Route::prefix('categories')->group(function () {
        Route::get('/', [CategoryController::class, 'adminIndex']);
        Route::post('/', [CategoryController::class, 'store']);
        Route::get('{id}', [CategoryController::class, 'adminShow']);
        Route::put('{id}', [CategoryController::class, 'update']);
        Route::delete('{id}', [CategoryController::class, 'destroy']);
    });

    // ---------------------------
    // إدارة الأقسام
    // ---------------------------
    Route::prefix('sections')->group(function () {
        Route::get('/', [SectionController::class, 'adminIndex']);
        Route::post('/', [SectionController::class, 'store']);
        Route::get('{id}', [SectionController::class, 'adminShow']);
        Route::put('{id}', [SectionController::class, 'update']);
        Route::delete('{id}', [SectionController::class, 'destroy']);
    });

    // ---------------------------
    // إدارة القوالب التفاعلية (Interactive Specifics if needed)
    // ---------------------------
    Route::prefix('interactive-templates')->group(function () {
        Route::post('{id}/variants', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'addVariant']);
        Route::put('{id}/variants/{variantId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'updateVariant']);
        Route::delete('{id}/variants/{variantId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'deleteVariant']);
        
        Route::post('{id}/fields', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'addField']);
        Route::put('{id}/fields/{fieldId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'updateField']);
        Route::delete('{id}/fields/{fieldId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'deleteField']);
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
        Route::get('/', [StatsController::class, 'getSettings']);
        Route::put('/', [StatsController::class, 'updateSettings']);
    });
});
