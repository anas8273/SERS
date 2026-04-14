/**
 * SERS Auth Helpers
 * Shared cookie and auth cleanup utilities.
 * Used by: authStore, DashboardLayout, AdminGuard, api interceptor.
 *
 * [DRY-MED-01] Extracted from 3 duplicate implementations.
 */

/** Clear auth cookies so Edge middleware won't see stale auth state */
export function clearAuthCookies(): void {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const secureAttr = isSecure ? '; Secure' : '';
  document.cookie = `auth-token=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
  document.cookie = `auth-role=; path=/; max-age=0; SameSite=Lax${secureAttr}`;
}

/**
 * Sync auth state to cookies so Next.js Edge middleware can read it.
 * Must be called after every login/register/socialLogin.
 *
 * [AUTH-HIGH-01 FIX] Without this, the middleware never sees auth-token
 * and keeps redirecting /dashboard → /login in an infinite loop.
 */
export function syncAuthCookies(token: string | null, role: string | null): void {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const secureAttr = isSecure ? '; Secure' : '';

  if (token) {
    // Set cookies with 30-day expiry (they're also cleared on logout)
    const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
    document.cookie = `auth-role=${role || 'user'}; path=/; max-age=${maxAge}; SameSite=Lax${secureAttr}`;
  } else {
    clearAuthCookies();
  }
}

/**
 * Full cleanup of all auth state from browser storage.
 * Used during logout and session expiry.
 */
export function purgeAllAuthState(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_remember');
  sessionStorage.removeItem('auth_session_active');
  clearAuthCookies();
}
