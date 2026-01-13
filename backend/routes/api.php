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
use App\Http\Controllers\Api\InteractiveTemplateController;
use App\Http\Controllers\Api\UserTemplateDataController;
use App\Http\Controllers\Api\ExportController;
use App\Http\Controllers\Api\QRCodeController;
use App\Http\Controllers\Api\CustomRequestController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\EvidenceController;
use App\Http\Controllers\Api\ContentLibraryController;
use App\Http\Controllers\Api\ResourceController;
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

// ===========================================================================
// INTERACTIVE TEMPLATES ROUTES (القوالب التفاعلية)
// ===========================================================================

// ---------------------------
// القوالب التفاعلية - عامة
// ---------------------------
Route::prefix('templates')->group(function () {
    // قائمة القوالب
    Route::get('/', [InteractiveTemplateController::class, 'index']);
    
    // القوالب الشائعة
    Route::get('popular', [InteractiveTemplateController::class, 'popular']);
    
    // القوالب المجانية
    Route::get('free', [InteractiveTemplateController::class, 'free']);
    
    // القوالب حسب التصنيف
    Route::get('category/{categoryId}', [InteractiveTemplateController::class, 'byCategory']);
    
    // عرض قالب واحد
    Route::get('{interactiveTemplate}', [InteractiveTemplateController::class, 'show']);
});

// ---------------------------
// مكتبة الموارد - عامة
// ---------------------------
Route::prefix('resources')->group(function () {
    // قائمة الموارد
    Route::get('/', [ResourceController::class, 'index']);
    
    // الموارد الشائعة
    Route::get('popular', [ResourceController::class, 'popular']);
    
    // الموارد حسب النوع
    Route::get('type/{type}', [ResourceController::class, 'byType']);
    
    // عرض مورد واحد
    Route::get('{resource}', [ResourceController::class, 'show']);
    
    // تحميل مورد
    Route::get('{resource}/download', [ResourceController::class, 'download']);
});

// ---------------------------
// الطلبات الخاصة - عامة (للعرض فقط)
// ---------------------------
Route::prefix('custom-requests')->group(function () {
    // قائمة الطلبات الخاصة
    Route::get('/', [CustomRequestController::class, 'index']);
    
    // عرض طلب واحد
    Route::get('{customRequest}', [CustomRequestController::class, 'show']);
});

// ===========================================================================
// PROTECTED INTERACTIVE TEMPLATES ROUTES (تتطلب مصادقة)
// ===========================================================================
Route::middleware('auth:sanctum')->group(function () {

    // ---------------------------
    // القوالب التفاعلية - محمية
    // ---------------------------
    Route::prefix('templates')->group(function () {
        // إضافة/إزالة من المفضلة
        Route::post('{interactiveTemplate}/favorite', [InteractiveTemplateController::class, 'toggleFavorite']);
        
        // قائمة المفضلة
        Route::get('user/favorites', [InteractiveTemplateController::class, 'favorites']);
    });

    // ---------------------------
    // بيانات المستخدم للقوالب
    // ---------------------------
    Route::prefix('user-templates')->group(function () {
        // قائمة بيانات المستخدم
        Route::get('/', [UserTemplateDataController::class, 'index']);
        
        // إنشاء بيانات جديدة
        Route::post('/', [UserTemplateDataController::class, 'store']);
        
        // عرض بيانات واحدة
        Route::get('{userTemplateData}', [UserTemplateDataController::class, 'show']);
        
        // تحديث البيانات
        Route::put('{userTemplateData}', [UserTemplateDataController::class, 'update']);
        
        // حذف البيانات
        Route::delete('{userTemplateData}', [UserTemplateDataController::class, 'destroy']);
        
        // سجل التغييرات
        Route::get('{userTemplateData}/versions', [UserTemplateDataController::class, 'versions']);
        
        // استعادة نسخة سابقة
        Route::post('{userTemplateData}/restore/{versionNumber}', [UserTemplateDataController::class, 'restoreVersion']);
    });

    // ---------------------------
    // التصدير
    // ---------------------------
    Route::prefix('export')->group(function () {
        // معاينة
        Route::get('{userTemplateData}/preview', [ExportController::class, 'preview']);
        
        // تصدير كصورة
        Route::post('{userTemplateData}/image', [ExportController::class, 'exportImage']);
        
        // تصدير كـ PDF
        Route::post('{userTemplateData}/pdf', [ExportController::class, 'exportPdf']);
    });

    // ---------------------------
    // توليد الباركود
    // ---------------------------
    Route::prefix('qrcode')->group(function () {
        // توليد من رابط
        Route::post('url', [QRCodeController::class, 'generateFromUrl']);
        
        // توليد من ملف
        Route::post('file', [QRCodeController::class, 'generateFromFile']);
        
        // توليد من نص
        Route::post('text', [QRCodeController::class, 'generateFromText']);
    });

    // ---------------------------
    // الطلبات الخاصة - محمية
    // ---------------------------
    Route::prefix('custom-requests')->group(function () {
        // إنشاء طلب جديد
        Route::post('/', [CustomRequestController::class, 'store']);
        
        // طلباتي
        Route::get('my', [CustomRequestController::class, 'myRequests']);
        
        // التصويت
        Route::post('{customRequest}/vote', [CustomRequestController::class, 'vote']);
        
        // إلغاء طلب
        Route::delete('{customRequest}', [CustomRequestController::class, 'cancel']);
    });

    // ---------------------------
    // الإشعارات
    // ---------------------------
    Route::prefix('notifications')->group(function () {
        // قائمة الإشعارات
        Route::get('/', [NotificationController::class, 'index']);
        
        // عدد غير المقروءة
        Route::get('unread-count', [NotificationController::class, 'unreadCount']);
        
        // تحديد كمقروء
        Route::post('{notification}/read', [NotificationController::class, 'markAsRead']);
        
        // تحديد الكل كمقروء
        Route::post('read-all', [NotificationController::class, 'markAllAsRead']);
        
        // حذف إشعار
        Route::delete('{notification}', [NotificationController::class, 'destroy']);
        
        // حذف المقروءة
        Route::delete('read', [NotificationController::class, 'deleteAllRead']);
    });

    // ---------------------------
    // الشواهد
    // ---------------------------
    Route::prefix('evidences')->group(function () {
        // قائمة الشواهد
        Route::get('/', [EvidenceController::class, 'index']);
        
        // إنشاء شاهد
        Route::post('/', [EvidenceController::class, 'store']);
        
        // عرض شاهد
        Route::get('{evidence}', [EvidenceController::class, 'show']);
        
        // تحديث شاهد
        Route::put('{evidence}', [EvidenceController::class, 'update']);
        
        // حذف شاهد
        Route::delete('{evidence}', [EvidenceController::class, 'destroy']);
    });

    // ---------------------------
    // مكتبة المحتوى
    // ---------------------------
    Route::prefix('content-library')->group(function () {
        // قائمة المحتوى
        Route::get('/', [ContentLibraryController::class, 'index']);
        
        // إنشاء محتوى
        Route::post('/', [ContentLibraryController::class, 'store']);
        
        // عرض محتوى
        Route::get('{contentLibrary}', [ContentLibraryController::class, 'show']);
        
        // تحديث محتوى
        Route::put('{contentLibrary}', [ContentLibraryController::class, 'update']);
        
        // حذف محتوى
        Route::delete('{contentLibrary}', [ContentLibraryController::class, 'destroy']);
        
        // إضافة/إزالة من المفضلة
        Route::post('{contentLibrary}/favorite', [ContentLibraryController::class, 'toggleFavorite']);
        
        // تسجيل استخدام
        Route::post('{contentLibrary}/use', [ContentLibraryController::class, 'use']);
    });
});

// ===========================================================================
// ADMIN INTERACTIVE TEMPLATES ROUTES (تتطلب صلاحيات مدير)
// ===========================================================================
Route::middleware(['auth:sanctum', 'is_admin'])->prefix('admin')->group(function () {

    // ---------------------------
    // إدارة القوالب التفاعلية
    // ---------------------------
    Route::prefix('templates')->group(function () {
        // قائمة كل القوالب
        Route::get('/', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'index']);
        
        // إنشاء قالب
        Route::post('/', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'store']);
        
        // عرض قالب
        Route::get('{id}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'show']);
        
        // تحديث قالب
        Route::put('{id}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'update']);
        
        // حذف قالب
        Route::delete('{id}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'destroy']);
        
        // إدارة الأشكال
        Route::post('{id}/variants', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'addVariant']);
        Route::put('{id}/variants/{variantId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'updateVariant']);
        Route::delete('{id}/variants/{variantId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'deleteVariant']);
        
        // إدارة الحقول
        Route::post('{id}/fields', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'addField']);
        Route::put('{id}/fields/{fieldId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'updateField']);
        Route::delete('{id}/fields/{fieldId}', [\App\Http\Controllers\Api\Admin\InteractiveTemplateController::class, 'deleteField']);
    });

    // ---------------------------
    // إدارة الطلبات الخاصة
    // ---------------------------
    Route::prefix('custom-requests')->group(function () {
        // قائمة كل الطلبات
        Route::get('/', [\App\Http\Controllers\Api\Admin\CustomRequestController::class, 'index']);
        
        // تحديث حالة الطلب
        Route::patch('{id}/status', [\App\Http\Controllers\Api\Admin\CustomRequestController::class, 'updateStatus']);
        
        // ربط قالب بالطلب
        Route::post('{id}/assign-template', [\App\Http\Controllers\Api\Admin\CustomRequestController::class, 'assignTemplate']);
    });

    // ---------------------------
    // إدارة الموارد
    // ---------------------------
    Route::prefix('resources')->group(function () {
        // قائمة كل الموارد
        Route::get('/', [\App\Http\Controllers\Api\Admin\ResourceController::class, 'index']);
        
        // إنشاء مورد
        Route::post('/', [\App\Http\Controllers\Api\Admin\ResourceController::class, 'store']);
        
        // تحديث مورد
        Route::put('{id}', [\App\Http\Controllers\Api\Admin\ResourceController::class, 'update']);
        
        // حذف مورد
        Route::delete('{id}', [\App\Http\Controllers\Api\Admin\ResourceController::class, 'destroy']);
    });

    // ---------------------------
    // إرسال الإشعارات
    // ---------------------------
    Route::prefix('notifications')->group(function () {
        // إرسال إشعار لمستخدم
        Route::post('send', [\App\Http\Controllers\Api\Admin\NotificationController::class, 'send']);
        
        // إرسال إشعار للجميع
        Route::post('broadcast', [\App\Http\Controllers\Api\Admin\NotificationController::class, 'broadcast']);
    });
});

