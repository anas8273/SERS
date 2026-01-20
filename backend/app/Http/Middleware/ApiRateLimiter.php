<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class ApiRateLimiter
{
    /**
     * Rate limit configurations per endpoint type
     */
    protected array $limits = [
        'default' => ['max' => 60, 'decay' => 60],      // 60 requests per minute
        'auth' => ['max' => 5, 'decay' => 60],          // 5 requests per minute for auth
        'ai' => ['max' => 10, 'decay' => 60],           // 10 requests per minute for AI
        'export' => ['max' => 5, 'decay' => 300],       // 5 requests per 5 minutes for export
        'upload' => ['max' => 10, 'decay' => 300],      // 10 uploads per 5 minutes
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

        $attempts = Cache::get($key, 0);

        if ($attempts >= $limit['max']) {
            return response()->json([
                'success' => false,
                'message' => 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.',
                'retry_after' => $limit['decay'],
            ], 429)->withHeaders([
                'X-RateLimit-Limit' => $limit['max'],
                'X-RateLimit-Remaining' => 0,
                'Retry-After' => $limit['decay'],
            ]);
        }

        Cache::put($key, $attempts + 1, $limit['decay']);

        $response = $next($request);

        return $response->withHeaders([
            'X-RateLimit-Limit' => $limit['max'],
            'X-RateLimit-Remaining' => max(0, $limit['max'] - $attempts - 1),
        ]);
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
