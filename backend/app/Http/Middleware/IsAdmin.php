<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * IsAdmin Middleware
 * 
 * Restricts access to admin-only routes.
 * Must be used AFTER auth:sanctum middleware to ensure user is authenticated.
 * 
 * Usage in routes:
 *   Route::middleware(['auth:sanctum', 'is_admin'])->group(function () { ... });
 * 
 * @package App\Http\Middleware
 */
class IsAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please login first.',
                'error' => 'unauthenticated',
            ], 401);
        }

        // Check if user has admin role
        if ($request->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Forbidden. Admin access required.',
                'error' => 'forbidden',
            ], 403);
        }

        return $next($request);
    }
}
