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
 * [SESSION] Cookie expiry now matches backend token expiry.
 */
export function syncAuthCookies(
  token: string | null,
  role: string | null,
  rememberMe: boolean = true
): void {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  const secureAttr = isSecure ? '; Secure' : '';

  if (token) {
    // [SESSION] Smart cookie expiry based on role and remember-me
    const isAdmin = (role || '').toLowerCase() === 'admin';
    let maxAgeSeconds: number;
    if (rememberMe) {
      maxAgeSeconds = isAdmin ? 7 * 24 * 3600 : 30 * 24 * 3600;
    } else {
      maxAgeSeconds = isAdmin ? 8 * 3600 : 24 * 3600;
    }
    document.cookie = `auth-token=${token}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureAttr}`;
    document.cookie = `auth-role=${role || 'user'}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureAttr}`;
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
  localStorage.removeItem('session_last_active');
  sessionStorage.removeItem('auth_session_active');
  clearAuthCookies();
}

/**
 * [SESSION] Track user activity for idle timeout.
 * Called on user interactions (clicks, keystrokes, scrolls).
 */
export function updateLastActive(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem('session_last_active', Date.now().toString());
}

/**
 * [SESSION] Check if user has been idle too long.
 * Admin: 30 min, User: 60 min
 */
export function isSessionIdle(isAdmin: boolean): boolean {
  if (typeof localStorage === 'undefined') return false;
  const lastActive = localStorage.getItem('session_last_active');
  if (!lastActive) return false;
  const elapsed = Date.now() - parseInt(lastActive, 10);
  const maxIdle = isAdmin ? 30 * 60 * 1000 : 60 * 60 * 1000;
  return elapsed > maxIdle;
}
