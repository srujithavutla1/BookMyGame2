// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/BookMyGame', 
  '/profile', 
  '/bookings', 
  '/invitations', 
  '/setPassword',
  '/games/:path*'
];
const authPageRoutes = ['/login'];
const apiAuthPrefix = '/api/auth';
const rootRedirectPath = '/BookMyGame';
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiAuthRoute = path.startsWith(apiAuthPrefix);
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route.includes(':path*')) {
      const basePath = route.split(':')[0];
      return path.startsWith(basePath);
    }
    return path === route;
  });
  const isAuthPageRoute = authPageRoutes.includes(path);
  const isRootPath = path === '/';
  const isSetPasswordPage = path === '/setPassword';

  // Skip middleware for API auth routes
  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  // Handle root path redirect
  if (isRootPath) {
    return NextResponse.redirect(new URL(rootRedirectPath, request.url));
  }

  // Check authentication status
  const authResponse = await fetch(`${apiBaseUrl}/auth/profile`, {
    headers: {
      Cookie: request.headers.get('Cookie') || '',
    },
    credentials: 'include',
  });
  const isAuthenticated = authResponse.ok;

  // Handle undefined routes
  if (!isProtectedRoute && !isAuthPageRoute && !isRootPath && !isApiAuthRoute) {
    return isAuthenticated 
      ? NextResponse.redirect(new URL('/BookMyGame', request.url))
      : NextResponse.redirect(new URL('/login', request.url));
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isSetPasswordPage && !path.startsWith('/games')) {
      const hasPasswordResponse = await fetch(`${apiBaseUrl}/auth/has-password`, {
        headers: {
          Cookie: request.headers.get('Cookie') || '',
        },
        credentials: 'include',
      });

      if (hasPasswordResponse.ok) {
        const { hasPassword } = await hasPasswordResponse.json();
        if (!hasPassword) {
          return NextResponse.redirect(new URL('/setPassword', request.url));
        }
      }
    }
  }

  // Handle auth pages when already authenticated
  if (isAuthPageRoute && isAuthenticated) {
    const hasPasswordResponse = await fetch(`${apiBaseUrl}/auth/has-password`, {
      headers: {
        Cookie: request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (hasPasswordResponse.ok) {
      const { hasPassword } = await hasPasswordResponse.json();
      return hasPassword
        ? NextResponse.redirect(new URL('/BookMyGame', request.url))
        : NextResponse.redirect(new URL('/setPassword', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};