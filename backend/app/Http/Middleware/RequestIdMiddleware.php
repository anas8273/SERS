<?php
// app/Http/Middleware/RequestIdMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Request ID Middleware [PERF-M4]
 *
 * Attaches a unique X-Request-ID to every request and response.
 * This enables:
 * - Distributed tracing across services
 * - Correlation between frontend errors and backend logs
 * - Easy debugging in production without sensitive data exposure
 *
 * The ID is either taken from the incoming X-Request-ID header
 * (so frontend can pass its own correlation ID) or generated fresh.
 */
class RequestIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Accept from upstream (e.g., frontend, load balancer) or generate new
        $requestId = $request->header('X-Request-ID') ?? (string) Str::uuid();

        // Make available throughout the request via request attributes
        $request->attributes->set('x_request_id', $requestId);

        // Inject into Log context so every log line carries the request ID
        Log::withContext(['request_id' => $requestId]);

        $response = $next($request);

        // Always echo the request ID back to the client
        $response->headers->set('X-Request-ID', $requestId);

        return $response;
    }
}
