<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/interactive_pdf_api.php'));

            // [F-04] Versioned API — /api/v1/*
            Route::middleware('api')
                ->prefix('api/v1')
                ->group(base_path('routes/api_v1.php'));
        },
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register custom middleware aliases
        $middleware->alias([
            'is_admin'        => \App\Http\Middleware\IsAdmin::class,
            'payment.wall'    => \App\Http\Middleware\PaymentWall::class,
            'api.limit'       => \App\Http\Middleware\ApiRateLimiter::class,
            'security.headers'=> \App\Http\Middleware\SecurityHeaders::class,
            'http.cache'      => \App\Http\Middleware\HttpCacheMiddleware::class,
            'gzip'            => \App\Http\Middleware\GzipMiddleware::class,
        ]);

        // Apply to ALL API requests:
        // 1. RequestIdMiddleware    — unique trace ID for every request (logging + client debugging)
        // 2. SecurityHeaders        — CORS, X-Frame-Options, etc.
        // 3. HttpCacheMiddleware    — ETag + Cache-Control headers (CDN / browser caching)
        $middleware->api(append: [
            \App\Http\Middleware\RequestIdMiddleware::class,
            \App\Http\Middleware\SecurityHeaders::class,
            \App\Http\Middleware\HttpCacheMiddleware::class,
            // [PERF] Gzip compress all API JSON responses (70-80% smaller payload)
            \App\Http\Middleware\GzipMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // [PERF-M4] Structured JSON error responses for all API exceptions.
        // In production, we NEVER return HTML — JSON only, with correlation ID.
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (!$request->expectsJson() && !str_starts_with($request->getPathInfo(), '/api')) {
                return null; // let web routes render their own error pages
            }

            $requestId   = $request->attributes->get('x_request_id', 'unknown');
            $isProduction = app()->isProduction();
            $statusCode   = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            // Normalize common HTTP status codes
            if ($e instanceof \Illuminate\Validation\ValidationException) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'بيانات غير صالحة',
                    'errors'     => $e->errors(),
                    'request_id' => $requestId,
                ], 422);
            }

            if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'غير مصرح — يرجى تسجيل الدخول',
                    'error'      => 'unauthenticated',
                    'request_id' => $requestId,
                ], 401);
            }

            if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'ليس لديك صلاحية للقيام بهذا الإجراء',
                    'error'      => 'forbidden',
                    'request_id' => $requestId,
                ], 403);
            }

            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'العنصر المطلوب غير موجود',
                    'error'      => 'not_found',
                    'request_id' => $requestId,
                ], 404);
            }

            if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'المسار غير موجود',
                    'error'      => 'route_not_found',
                    'request_id' => $requestId,
                ], 404);
            }

            if ($e instanceof \Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException) {
                return response()->json([
                    'success'    => false,
                    'message'    => 'طلبات كثيرة — يرجى الانتظار قليلاً',
                    'error'      => 'rate_limited',
                    'request_id' => $requestId,
                ], 429);
            }

            // Generic 500 — never expose internals in production
            \Illuminate\Support\Facades\Log::error('[API Exception]', [
                'message'    => $e->getMessage(),
                'class'      => get_class($e),
                'trace'      => $isProduction ? null : $e->getTraceAsString(),
                'request_id' => $requestId,
                'url'        => $request->fullUrl(),
            ]);

            return response()->json([
                'success'    => false,
                'message'    => $isProduction ? 'حدث خطأ في الخادم — يرجى المحاولة لاحقاً' : $e->getMessage(),
                'error'      => 'server_error',
                'request_id' => $requestId,
            ], $statusCode >= 400 && $statusCode < 600 ? $statusCode : 500);
        });
    })->create();
