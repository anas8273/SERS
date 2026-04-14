<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    /**
     * Rate limit configurations per endpoint type.
     *
     * [TUNED] AI: 20/min —  Better UX while protecting Groq API quota.
     * [TUNED] export: 3 per 5 min — prevents PDF/Word generation abuse.
     * Auth remains strict at 5/min to block brute-force credential stuffing.
     */
    protected array $limits = [
        'default'     => ['max' => 60,  'decay' => 60],   // 60 req/min
        'auth'        => ['max' => 5,   'decay' => 60],   // 5 req/min  (brute-force guard)
        'ai'          => ['max' => 20,  'decay' => 60],   // 20 req/min (Groq cost control)
        'export'      => ['max' => 3,   'decay' => 300],  // 3 per 5 min (PDF/Word gen)
        'upload'      => ['max' => 10,  'decay' => 300],  // 10 per 5 min
        'destructive' => ['max' => 10,  'decay' => 60],   // 10 del/min  (anti-batch-delete)
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $type = 'default'): Response
    {
        $key = $this->resolveRequestKey($request, $type);
        $limit = $this->limits[$type] ?? $this->limits['default'];

        // Use Laravel's built-in RateLimiter for atomic increment
        if (\Illuminate\Support\Facades\RateLimiter::tooManyAttempts($key, $limit['max'])) {
            $retryAfter = \Illuminate\Support\Facades\RateLimiter::availableIn($key);
            return response()->json([
                'success' => false,
                'message' => 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
                'retry_after' => $retryAfter,
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $limit['max'],
                'X-RateLimit-Remaining' => 0,
                'Retry-After' => $retryAfter,
            ]);
        }

        \Illuminate\Support\Facades\RateLimiter::hit($key, $limit['decay']);

        $response = $next($request);
        $remaining = \Illuminate\Support\Facades\RateLimiter::remaining($key, $limit['max']);

        $response->headers->set('X-RateLimit-Limit', (string) $limit['max']);
        $response->headers->set('X-RateLimit-Remaining', (string) max(0, $remaining));

        return $response;
    }

    /**
     * Resolve the request key for rate limiting
     */
    protected function resolveRequestKey(Request $request, string $type): string
    {
        $identifier = $request->user()?->id ?? $request->ip();
        return "rate_limit:{$type}:{$identifier}";
    }
}
