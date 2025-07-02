// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/BookMyGame', 
  '/profile', 
  '/bookings', 
  '/invitations', 
  '/setPassword',
  '/games/:path*' // This will match all routes under /games
];
const authPageRoutes = ['/login'];
const apiAuthPrefix = '/api/auth';
const rootRedirectPath = '/BookMyGame';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiAuthRoute = path.startsWith(apiAuthPrefix);
  const isProtectedRoute = protectedRoutes.some(route => {
    // Handle dynamic routes
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

    if (!isSetPasswordPage && !path.startsWith('/games')) {
      const hasPasswordResponse = await fetch('http://localhost:3001/auth/has-password', {
        headers: {
          Cookie: request.headers.get('Cookie') || '',
        },
        credentials: 'include',
      });

      if (hasPasswordResponse.ok) {
        const { hasPassword } = await hasPasswordResponse.json();
          console.log(hasPassword);

        if (!hasPassword) {
          return NextResponse.redirect(new URL('/setPassword', request.url));
        }
      }
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
      const hasPasswordResponse = await fetch('http://localhost:3001/auth/has-password', {
        headers: {
          Cookie: request.headers.get('Cookie') || '',
        },
        credentials: 'include',
      });

      if (hasPasswordResponse.ok) {
        const { hasPassword } = await hasPasswordResponse.json();
         // console.log(hasPassword);

        if (hasPassword) {
          return NextResponse.redirect(new URL('/BookMyGame', request.url));
        } else {
          return NextResponse.redirect(new URL('/setPassword', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};