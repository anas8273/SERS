<?php

/**
 * API v1 Routes — Versioned API Layer
 *
 * [F-04] This file provides a versioned API namespace for future-proofing.
 * When breaking changes are needed, create `api_v2.php` and keep v1 stable.
 *
 * Current state: All v1 routes are proxied from the main `api.php` routes.
 * This file adds the `/api/v1` prefix namespace.
 *
 * Registration in bootstrap/app.php:
 *   Route::middleware('api')->prefix('api/v1')->group(base_path('routes/api_v1.php'));
 *
 * Example usage:
 *   GET /api/v1/templates    → TemplateController@index
 *   POST /api/v1/auth/login  → AuthController@login
 *
 * Migration strategy:
 *   1. New features go in api_v1.php
 *   2. When breaking change needed → copy to api_v2.php, modify
 *   3. Keep v1 routes unchanged for backwards compatibility
 *   4. Deprecate v1 with X-API-Deprecated header after sunset period
 */

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\TemplateController;
use App\Http\Controllers\Api\OrderController;
use Illuminate\Support\Facades\Route;

// ═══════════════════════════════════════════════
// V1 Core Routes (mirrors main api.php structure)
// ═══════════════════════════════════════════════

// Health check for v1
Route::get('health', function () {
    return response()->json([
        'status'  => 'ok',
        'version' => 'v1',
        'time'    => now()->toIso8601String(),
    ]);
});

// Auth
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

// Templates (public)
Route::prefix('templates')->group(function () {
    Route::get('/', [TemplateController::class, 'index']);
    Route::get('{slug}', [TemplateController::class, 'show']);
});

// Orders (authenticated)
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('orders', OrderController::class)->only(['index', 'store', 'show']);
});
