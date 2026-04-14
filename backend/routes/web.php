<?php
// routes/web.php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - SERS (API-Only Backend)
|--------------------------------------------------------------------------
|
| This backend is API-only. The root URL redirects to the Frontend.
| All API endpoints are served from routes/api.php
|
*/

/**
 * Root URL Redirect
 * 
 * When users visit the backend URL directly (localhost:8001),
 * they are automatically redirected to the Frontend Application.
 * The frontend port is resolved dynamically from env vars.
 *
 * [FIX] Using withoutMiddleware to skip ALL database-dependent middleware.
 * This ensures the redirect works instantly even when MySQL is offline.
 * 
 * [FIX-2] Return a raw HTTP 302 redirect instead of using
 * Laravel's redirect() helper to avoid any service container overhead.
 */
Route::get('/', function () {
    $frontendUrl = env('FRONTEND_URL')
        ?: 'http://localhost:' . env('FRONTEND_PORT', '3001');
    return response('', 302)->header('Location', $frontendUrl);
})->withoutMiddleware([
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
]);

/**
 * Catch-all for any other web routes
 * Redirect to frontend to handle SPA routing
 */
Route::get('/{any}', function () {
    $frontendUrl = env('FRONTEND_URL')
        ?: 'http://localhost:' . env('FRONTEND_PORT', '3001');
    return response('', 302)->header('Location', $frontendUrl);
})->where('any', '^(?!api|storage|sanctum).*$')
  ->withoutMiddleware([
    \Illuminate\Session\Middleware\StartSession::class,
    \Illuminate\View\Middleware\ShareErrorsFromSession::class,
    \Illuminate\Cookie\Middleware\EncryptCookies::class,
    \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
    \Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class,
]);
