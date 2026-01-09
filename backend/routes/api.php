<?php
// routes/api.php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RecordController;
use App\Http\Controllers\Api\AIController;
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
// PUBLIC ROUTES (لا تتطلب مصادقة)
// ===========================================================================

// ---------------------------
// المصادقة (Authentication)
// ---------------------------
Route::prefix('auth')->group(function () {
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
    // الطلبات (Orders)
    // ---------------------------
    Route::prefix('orders')->group(function () {
        // قائمة طلبات المستخدم
        Route::get('/', [OrderController::class, 'index']);

        // إنشاء طلب جديد
        Route::post('/', [OrderController::class, 'store']);

        // عرض طلب واحد
        Route::get('{id}', [OrderController::class, 'show']);
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
});

// ===========================================================================
// ADMIN ROUTES (تتطلب مصادقة + صلاحيات مدير)
// ===========================================================================
Route::middleware(['auth:sanctum', 'is_admin'])->prefix('admin')->group(function () {

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
    });
});

// ===========================================================================
// WEBHOOKS (بدون مصادقة - تستخدم توقيعات خاصة)
// ===========================================================================
Route::post('webhooks/stripe', [PaymentController::class, 'handleStripeWebhook']);
