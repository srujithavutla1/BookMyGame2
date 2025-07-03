// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/BookMyGame', 
  '/profile', 
  '/bookings', 
  '/invitations', 
  '/setPassword',
  '/games/:path*',
  '/login/success'
];
const authPageRoutes = ['/login'];
const apiAuthPrefix = '/api/auth';
const rootRedirectPath = '/BookMyGame';
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

export async function middleware(request: NextRequest) {
 // console.log(request);
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

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isRootPath) {
    return NextResponse.redirect(new URL(rootRedirectPath, request.url));
  }

  const authResponse = await fetch(`${apiBaseUrl}/auth/profile`, {
    headers: {
      Cookie: request.headers.get('Cookie') || '',
    },
    credentials: 'include',
  });
  const isAuthenticated = authResponse.ok;

  if (!isProtectedRoute && !isAuthPageRoute && !isRootPath && !isApiAuthRoute) {
    return isAuthenticated 
      ? NextResponse.redirect(new URL('/BookMyGame', request.url))
      : NextResponse.redirect(new URL('/login', request.url));
  }

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




/*
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/BookMyGame', '/profile', '/bookings', '/invitations','/setPassword', '/games/:path*'];
const authPageRoutes = ['/login'];
const apiAuthPrefix = '/api/auth';
const rootRedirectPath = '/BookMyGame';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiAuthRoute = path.startsWith(apiAuthPrefix);
  const isProtectedRoute = protectedRoutes.includes(path);
  const isAuthPageRoute = authPageRoutes.includes(path);
  const isRootPath = path === '/';

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isRootPath) {
    return NextResponse.redirect(new URL(rootRedirectPath, request.url));
  }

  // Check auth status for protected routes
  if (isProtectedRoute) {
    const authResponse = await fetch('http://localhost:3001/auth/profile', {
      headers: {
        Cookie: request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (!authResponse.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (isAuthPageRoute) {
    const authResponse = await fetch('http://localhost:3001/auth/profile', {
      headers: {
        Cookie: request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (authResponse.ok) {
      return NextResponse.redirect(new URL('/BookMyGame', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
*/