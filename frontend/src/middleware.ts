// src/middleware.ts
// Next.js Middleware for Route Protection
// Runs on the Edge Runtime before every request

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ===== Route Definitions =====

/** Routes that require authentication (any role) */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/editor',
  '/batch-generate',
  '/analyses',
  '/certificates',
  '/my-templates',
  '/my-library',
  '/orders',
  '/wishlist',
  '/settings',
  '/notifications',
  '/ai-assistant',
  '/custom-requests',
  '/performance',
  '/portfolio',
  '/achievements',
  '/follow-up-log',
  '/knowledge-production',
  '/remedial-plans',
  '/sections',
  '/distributions',
  '/work-evidence',
  '/tests',
  '/plans',
];

/** Routes that require admin role */
const ADMIN_ROUTES = [
  '/admin',
];

/** Auth routes (login, register) - redirect to dashboard if already authenticated */
const AUTH_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
];

/** Public routes that don't require any authentication */
const PUBLIC_ROUTES = [
  '/',
  '/services',
  '/marketplace',
  '/categories',
  '/templates',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/cart',
  '/checkout',
];

// ===== Helper Functions =====

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Extract auth data from the persisted Zustand store cookie/localStorage.
 * Since middleware runs on Edge, we read from cookies.
 * The auth-provider also stores token in a cookie for middleware access.
 */
function getAuthFromCookies(request: NextRequest): {
  isAuthenticated: boolean;
  token: string | null;
  role: string | null;
} {
  // Try to read from the auth-token cookie (set by auth-provider)
  const authToken = request.cookies.get('auth-token')?.value;
  const authRole = request.cookies.get('auth-role')?.value;

  if (authToken) {
    return {
      isAuthenticated: true,
      token: authToken,
      role: authRole?.toLowerCase() || 'user',
    };
  }

  // Fallback: Try to parse from auth-storage cookie (Zustand persist)
  const authStorage = request.cookies.get('auth-storage')?.value;
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      const state = parsed.state || parsed;
      if (state.token && state.isAuthenticated) {
        return {
          isAuthenticated: true,
          token: state.token,
          role: state.user?.role?.toLowerCase() || 'user',
        };
      }
    } catch {
      // Invalid JSON, ignore
    }
  }

  return { isAuthenticated: false, token: null, role: null };
}

// ===== Middleware =====

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.') // Static files like .css, .js, .png
  ) {
    return NextResponse.next();
  }

  const { isAuthenticated, role } = getAuthFromCookies(request);

  // ===== Admin Route Protection =====
  if (isAdminRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== 'admin') {
      // Non-admin users get redirected to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ===== Protected Route Protection =====
  if (isProtectedRoute(pathname)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // ===== Auth Route Redirect =====
  if (isAuthRoute(pathname)) {
    if (isAuthenticated) {
      // Already logged in, redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // ===== Public Routes =====
  return NextResponse.next();
}

// ===== Middleware Config =====
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
