// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/BookMyGame', '/profile', '/bookings', '/invitations'];
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