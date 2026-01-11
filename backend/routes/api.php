<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\DownloadController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RecordController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\AdminOrderController;
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
*/

// ===========================================================================
// API ROOT STATUS
// ===========================================================================
Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'SERS API',
        'version' => '1.0.0',
        'endpoints' => [
            'auth' => '/api/auth/*',
            'products' => '/api/products/*',
            'categories' => '/api/categories/*',
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
    // تسجيل مستخدم جديد
    Route::post('register', [AuthController::class, 'register']);

    // تسجيل الدخول بالبريد وكلمة المرور
    Route::post('login', [AuthController::class, 'login']);

    // تسجيل الدخول عبر Firebase (Google/Social)
    Route::post('social', [AuthController::class, 'socialLogin']);
});

// ---------------------------
// المنتجات (Products) - عامة
// ---------------------------
Route::prefix('products')->group(function () {
    // قائمة المنتجات مع الفلاتر
    Route::get('/', [ProductController::class, 'index']);

    // البحث عن المنتجات
    Route::get('search', [ProductController::class, 'search']);

    // المنتجات المميزة
    Route::get('featured', [ProductController::class, 'featured']);

    // عرض منتج واحد بالـ slug
    Route::get('{slug}', [ProductController::class, 'show']);

    // ---------------------------
    // تقييمات المنتج (Public)
    // ---------------------------
    Route::get('{slug}/reviews', [ReviewController::class, 'index']);
});

// ---------------------------
// التصنيفات (Categories) - عامة
// ---------------------------
Route::prefix('categories')->group(function () {
    // قائمة التصنيفات
    Route::get('/', [CategoryController::class, 'index']);

    // عرض تصنيف واحد بالـ slug
    Route::get('{slug}', [CategoryController::class, 'show']);
});

// ---------------------------
// أكواد الخصم (Coupons) - التحقق العام
// ---------------------------
Route::prefix('coupons')->group(function () {
    // التحقق من صلاحية كود الخصم
    Route::post('validate', [CouponController::class, 'validate']);
});

// ===========================================================================
// PROTECTED ROUTES (تتطلب مصادقة Sanctum)
// ===========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // ---------------------------
    // المصادقة المحمية
    // ---------------------------
    Route::prefix('auth')->group(function () {
        // تسجيل الخروج
        Route::post('logout', [AuthController::class, 'logout']);

        // بيانات المستخدم الحالي
        Route::get('me', [AuthController::class, 'me']);
    });

    // ---------------------------
    // الملف الشخصي (User Profile)
    // ---------------------------
    Route::prefix('user')->group(function () {
        // تحديث الملف الشخصي
        Route::post('profile', [UserController::class, 'updateProfile']);

        // تغيير كلمة المرور
        Route::post('password', [UserController::class, 'changePassword']);
    });

    // ---------------------------
    // الطلبات (Orders)
    // ---------------------------
    Route::prefix('orders')->group(function () {
        // قائمة طلبات المستخدم
        Route::get('/', [OrderController::class, 'index']);

        // إنشاء طلب جديد
        Route::post('/', [OrderController::class, 'store']);

        // عرض طلب واحد
        Route::get('{id}', [OrderController::class, 'show']);

        // دفع قيمة الطلب (محاكاة)
        Route::post('{id}/pay', [OrderController::class, 'pay']);
    });

    // ---------------------------
    // الدفع (Payments)
    // ---------------------------
    Route::prefix('payments')->group(function () {
        // إنشاء نية دفع Stripe
        Route::post('create-intent', [PaymentController::class, 'createPaymentIntent']);
    });

    // ---------------------------
    // السجلات التفاعلية (Records)
    // ---------------------------
    Route::prefix('records')->group(function () {
        // قائمة سجلات المستخدم
        Route::get('/', [RecordController::class, 'index']);

        // عرض سجل واحد
        Route::get('{recordId}', [RecordController::class, 'show']);

        // تحديث بيانات السجل
        Route::put('{recordId}', [RecordController::class, 'update']);
    });

    // ---------------------------
    // الذكاء الاصطناعي (AI)
    // ---------------------------
    Route::prefix('ai')->group(function () {
        // طلب اقتراح من الذكاء الاصطناعي
        Route::post('suggest', [AIController::class, 'suggest']);

        // قبول أو رفض اقتراح
        Route::post('accept', [AIController::class, 'acceptSuggestion']);
    });

    // ---------------------------
    // المفضلة (Wishlist)
    // ---------------------------
    Route::prefix('wishlists')->group(function () {
        // قائمة المفضلة
        Route::get('/', [WishlistController::class, 'index']);
        
        // معرفات المنتجات في المفضلة
        Route::get('ids', [WishlistController::class, 'ids']);
        
        // إضافة/إزالة من المفضلة (Toggle)
        Route::post('toggle', [WishlistController::class, 'toggle']);
        
        // التحقق من وجود منتج في المفضلة
        Route::get('check/{productId}', [WishlistController::class, 'check']);
        
        // إزالة منتج من المفضلة
        Route::delete('{productId}', [WishlistController::class, 'destroy']);
        
        // مسح كل المفضلة
        Route::delete('/', [WishlistController::class, 'clear']);
    });

    // ---------------------------
    // التقييمات (Reviews) - المحمية
    // ---------------------------
    Route::prefix('products/{slug}')->group(function () {
        // التحقق من إمكانية التقييم
        Route::get('can-review', [ReviewController::class, 'canReview']);
        
        // تقييم المستخدم لهذا المنتج
        Route::get('my-review', [ReviewController::class, 'myReview']);
        
        // إضافة تقييم
        Route::post('reviews', [ReviewController::class, 'store']);
    });

    // تحديث/حذف تقييم
    Route::put('reviews/{id}', [ReviewController::class, 'update']);
    Route::delete('reviews/{id}', [ReviewController::class, 'destroy']);
});

// ===========================================================================
// ADMIN ROUTES (تتطلب مصادقة + صلاحيات مدير)
// ===========================================================================
Route::middleware(['auth:sanctum', 'is_admin'])->prefix('admin')->group(function () {

    // ---------------------------
    // الإحصائيات (Dashboard Stats)
    // ---------------------------
    Route::prefix('stats')->group(function () {
        Route::get('/', [StatsController::class, 'index']);
        Route::get('chart', [StatsController::class, 'chart']);
    });

    // ---------------------------
    // إدارة الطلبات (Orders)
    // ---------------------------
    Route::prefix('orders')->group(function () {
        Route::get('/', [AdminOrderController::class, 'index']);
        Route::get('{id}', [AdminOrderController::class, 'show']);
        Route::patch('{id}/status', [AdminOrderController::class, 'updateStatus']);
    });

    // ---------------------------
    // إدارة المنتجات
    // ---------------------------
    Route::prefix('products')->group(function () {
        // قائمة كل المنتجات (بما فيها غير النشطة)
        Route::get('/', [ProductController::class, 'adminIndex']);

        // إنشاء منتج جديد
        Route::post('/', [ProductController::class, 'store']);

        // تحديث منتج
        Route::put('{id}', [ProductController::class, 'update']);

        // حذف منتج
        Route::delete('{id}', [ProductController::class, 'destroy']);

        // عرض منتج واحد (Admin)
        Route::get('{id}', [ProductController::class, 'adminShow']);
    });

    // ---------------------------
    // إدارة أكواد الخصم (Coupons)
    // ---------------------------
    Route::prefix('coupons')->group(function () {
        // قائمة أكواد الخصم
        Route::get('/', [CouponController::class, 'index']);

        // إنشاء كود خصم جديد
        Route::post('/', [CouponController::class, 'store']);

        // تحديث كود خصم
        Route::put('{id}', [CouponController::class, 'update']);

        // حذف كود خصم
        Route::delete('{id}', [CouponController::class, 'destroy']);
    });

    // ---------------------------
    // إدارة التقييمات (Reviews)
    // ---------------------------
    Route::prefix('reviews')->group(function () {
        // قائمة كل التقييمات
        Route::get('/', [ReviewController::class, 'adminIndex']);

        // الموافقة على تقييم
        Route::post('{id}/approve', [ReviewController::class, 'approve']);

        // رفض تقييم
        Route::post('{id}/reject', [ReviewController::class, 'reject']);

        // حذف تقييم
        Route::delete('{id}', [ReviewController::class, 'adminDestroy']);
    });

    // ---------------------------
    // إدارة التصنيفات (Categories)
    // ---------------------------
    Route::prefix('categories')->group(function () {
        // قائمة كل التصنيفات
        Route::get('/', [CategoryController::class, 'adminIndex']);

        // إنشاء تصنيف جديد
        Route::post('/', [CategoryController::class, 'store']);

        // تحديث تصنيف
        Route::put('{id}', [CategoryController::class, 'update']);

        // حذف تصنيف
        Route::delete('{id}', [CategoryController::class, 'destroy']);
    });

    // ---------------------------
    // إدارة المستخدمين (Users)
    // ---------------------------
    Route::prefix('users')->group(function () {
        // قائمة كل المستخدمين
        Route::get('/', [UserController::class, 'index']);

        // تفاصيل مستخدم
        Route::get('{id}', [UserController::class, 'show']);

        // تفعيل/تعطيل مستخدم
        Route::post('{id}/toggle-status', [UserController::class, 'toggleStatus']);

        // ترقية/تخفيض صلاحيات
        Route::post('{id}/toggle-role', [UserController::class, 'toggleRole']);

        // تحديث بيانات مستخدم
        Route::put('{id}', [UserController::class, 'update']);

        // حذف مستخدم
        Route::delete('{id}', [UserController::class, 'destroy']);
    });

    // ---------------------------
    // إعدادات النظام (Settings)
    // ---------------------------
    Route::prefix('settings')->group(function () {
        // جلب إعدادات النظام
        Route::get('/', [\App\Http\Controllers\Api\SettingsController::class, 'index']);
        
        // مسح ذاكرة التخزين المؤقت
        Route::post('clear-cache', [\App\Http\Controllers\Api\SettingsController::class, 'clearCache']);
        
        // سجلات النظام
        Route::get('logs', [\App\Http\Controllers\Api\SettingsController::class, 'logs']);
        
        // وضع الصيانة
        Route::post('maintenance', [\App\Http\Controllers\Api\SettingsController::class, 'toggleMaintenance']);
        
        // معلومات التخزين
        Route::get('storage', [\App\Http\Controllers\Api\SettingsController::class, 'storage']);
    });

    // ---------------------------
    // سجل النشاطات (Activity Logs)
    // ---------------------------
    Route::prefix('activity-logs')->group(function () {
        // قائمة النشاطات
        Route::get('/', [\App\Http\Controllers\Api\ActivityLogController::class, 'index']);
        
        // ملخص النشاطات
        Route::get('summary', [\App\Http\Controllers\Api\ActivityLogController::class, 'summary']);
    });
});

// ===========================================================================
// PROTECTED DOWNLOADS (تتطلب مصادقة + ملكية الطلب)
// ===========================================================================
Route::middleware('auth:sanctum')->prefix('downloads')->group(function () {
    Route::get('{orderItemId}', [DownloadController::class, 'download']);
    Route::get('{orderItemId}/info', [DownloadController::class, 'info']);
});

// ===========================================================================
// WEBHOOKS (بدون مصادقة - تستخدم توقيعات خاصة)
// ===========================================================================
Route::post('webhooks/stripe', [PaymentController::class, 'handleStripeWebhook']);

