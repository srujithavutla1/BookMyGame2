// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import SetPassword from './app/setPassword/page';

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
const rootRedirectPath = '/BookMyGame';
const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:3001';

async function checkAuthentication(request: NextRequest): Promise<boolean> {
  const authResponse = await fetch(`${apiBaseUrl}/auth/profile`, {
    headers: {
      Cookie: request.headers.get('Cookie') || '',
    },
    credentials: 'include',
  });
  return authResponse.ok;
}

async function checkHasPassword(request: NextRequest): Promise<boolean> {
  const hasPasswordResponse = await fetch(`${apiBaseUrl}/auth/has-password`, {
    headers: {
      Cookie: request.headers.get('Cookie') || '',
    },
    credentials: 'include',
  });

  if (hasPasswordResponse.ok) {
    const { hasPassword } = await hasPasswordResponse.json();
    return hasPassword;
  }
  return false;
}

function isProtectedPath(path: string): boolean {
  return protectedRoutes.some(route => {
    if (route.includes(':path*')) {
      const basePath = route.split(':')[0];
      return path.startsWith(basePath);
    }
    return path === route;
  });
}

export async function middleware(request: NextRequest) {
  console.log("hit");
  const path = request.nextUrl.pathname;
  const isProtectedRoute = isProtectedPath(path);
  const isAuthPageRoute = authPageRoutes.includes(path);
  const isRootPath = path === '/';
  const isSetPasswordPage = path === '/setPassword';

  if (isRootPath) {
    return NextResponse.redirect(new URL(rootRedirectPath, request.url));
  }
  
  const isAuthenticated = await checkAuthentication(request);

  if (!isProtectedRoute && !isAuthPageRoute && !isRootPath) {
    return isAuthenticated 
      ? NextResponse.redirect(new URL('/BookMyGame', request.url))
      : NextResponse.redirect(new URL('/login', request.url));
  }

  if (isProtectedRoute) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    if (!isSetPasswordPage) {
      const hasPassword = await checkHasPassword(request);
      if (!hasPassword) {
        return NextResponse.redirect(new URL('/setPassword', request.url));
      }
    }
  }

  if (isAuthPageRoute && isAuthenticated) {
    const hasPassword = await checkHasPassword(request);
    return hasPassword
      ? NextResponse.redirect(new URL('/BookMyGame', request.url))
      : NextResponse.redirect(new URL('/setPassword', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};