/**
 * Server-side rate limiter for Next.js API routes.
 * Uses an in-memory Map with automatic TTL cleanup.
 * 
 * [AUDIT FIX] Prevents abuse of AI endpoints that consume Groq API credits.
 * In production, replace with Redis-backed solution for multi-instance deployments.
 */

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

interface RateLimitConfig {
  maxRequests: number;   // Max requests per window
  windowMs: number;      // Window duration in milliseconds
}

/**
 * Check rate limit for a given identifier (e.g., IP address).
 * Returns { allowed: true } if under limit, or { allowed: false, retryAfter } if exceeded.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 10, windowMs: 60_000 }
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = identifier;
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitMap.set(key, { count: 1, resetTime: now + config.windowMs });
    return { allowed: true };
  }

  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count++;
  return { allowed: true };
}

/**
 * Extract client IP from Next.js request headers.
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}
