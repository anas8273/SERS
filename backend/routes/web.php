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
 * When users visit the backend URL directly (localhost:8000),
 * they are automatically redirected to the Frontend Application.
 */
Route::get('/', function () {
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
    return redirect($frontendUrl);
});

/**
 * Catch-all for any other web routes
 * Redirect to frontend to handle SPA routing
 */
Route::get('/{any}', function () {
    $frontendUrl = env('FRONTEND_URL', 'http://localhost:3000');
    return redirect($frontendUrl);
})->where('any', '^(?!api).*$');
