<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * GzipMiddleware [PERF]
 *
 * Compresses JSON API responses with gzip when the client supports it.
 * Laravel's built-in compress=true compresses HTML (web routes) but NOT API JSON.
 * This middleware fills that gap, reducing transfer size by 70-80%.
 *
 * Only applied to responses > 1KB (no point compressing small responses).
 */
class GzipMiddleware
{
    // Don't compress responses smaller than 1KB — overhead not worth it
    private const MIN_SIZE_BYTES = 1024;

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Only compress if client accepts gzip
        $acceptEncoding = $request->header('Accept-Encoding', '');
        if (!str_contains($acceptEncoding, 'gzip')) {
            return $response;
        }

        // Only compress successful JSON responses
        $contentType = $response->headers->get('Content-Type', '');
        if (!str_contains($contentType, 'application/json')) {
            return $response;
        }

        // Only compress if already set (not a stream)
        $content = $response->getContent();
        if ($content === false || strlen($content) < self::MIN_SIZE_BYTES) {
            return $response;
        }

        // Already compressed? Skip.
        if ($response->headers->has('Content-Encoding')) {
            return $response;
        }

        $compressed = gzencode($content, 6); // Level 6 = good balance speed/ratio
        if ($compressed === false) {
            return $response; // Compression failed — return original
        }

        $response->setContent($compressed);
        $response->headers->set('Content-Encoding', 'gzip');
        $response->headers->set('Content-Length', (string) strlen($compressed));
        $response->headers->set('Vary', 'Accept-Encoding');

        return $response;
    }
}
