<?php
// app/Http/Middleware/HttpCacheMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * HTTP Cache Middleware [PERF-M2]
 *
 * Adds standard HTTP caching headers to public API responses so that
 * browsers, CDNs, and reverse proxies (Nginx, Cloudflare) can cache
 * them without hitting the Laravel process at all.
 *
 * Strategy:
 * - Public read-only endpoints (templates, sections, categories):
 *   Cache-Control: public, max-age=300, stale-while-revalidate=60
 * - User-specific endpoints (dashboard, library, wallet):
 *   Cache-Control: private, no-store (never cached by intermediaries)
 * - Mutation endpoints (POST/PUT/DELETE/PATCH):
 *   Cache-Control: no-store (never cache state-changing responses)
 * - ETag generated from response hash for 304 Not Modified support
 */
class HttpCacheMiddleware
{
    /**
     * Public-safe endpoints: safe to cache by CDN and browser.
     * Must be read-only and return the same response for the same URL.
     */
    private const PUBLIC_PREFIXES = [
        '/api/templates',
        '/api/sections',
        '/api/categories',
        '/api/content-library',
        '/api/health',
        '/api/version',
    ];

    /**
     * Endpoints that are always private (user-specific data).
     */
    private const PRIVATE_PREFIXES = [
        '/api/auth',
        '/api/dashboard',
        '/api/library',
        '/api/wallet',
        '/api/notifications',
        '/api/referrals',
        '/api/user',
    ];

    public function handle(Request $request, Closure $next): SymfonyResponse
    {
        $response = $next($request);

        // Never cache error responses or non-GET requests
        if (!$request->isMethod('GET') || $response->getStatusCode() >= 400) {
            $response->headers->set('Cache-Control', 'no-store, must-revalidate');
            return $response;
        }

        $path = $request->getPathInfo();

        // Check if this is a public cacheable endpoint
        $isPublic = false;
        foreach (self::PUBLIC_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $isPublic = true;
                break;
            }
        }

        // Check if this is a private endpoint
        $isPrivate = false;
        foreach (self::PRIVATE_PREFIXES as $prefix) {
            if (str_starts_with($path, $prefix)) {
                $isPrivate = true;
                break;
            }
        }

        // If user is authenticated, downgrade to private even for public routes
        if ($isPublic && $request->bearerToken()) {
            $isPublic = false;
            $isPrivate = true;
        }

        if ($isPublic) {
            // Public: cache for 5 minutes, stale-while-revalidate for 1 minute
            $response->headers->set('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
            $response->headers->set('Vary', 'Accept-Language, Accept-Encoding');

            // ETag based on content hash for 304 Not Modified support
            $content = $response->getContent();
            if ($content) {
                $etag = '"' . hash('xxh64', $content) . '"';
                $response->headers->set('ETag', $etag);

                // Check If-None-Match header to return 304
                $ifNoneMatch = $request->header('If-None-Match');
                if ($ifNoneMatch === $etag) {
                    return response('', 304, $response->headers->all());
                }
            }
        } elseif ($isPrivate) {
            // Private: browser can cache but CDN cannot
            $response->headers->set('Cache-Control', 'private, max-age=0, must-revalidate');
        } else {
            // Unknown endpoint — safe default: no caching
            $response->headers->set('Cache-Control', 'no-store');
        }

        return $response;
    }
}
