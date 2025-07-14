import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/BookMyGame', '/profile', '/bookings', '/invitations', '/setPassword', '/games/:path*'];
const adminRoutes = ['/today-bookings'];
const authPageRoutes = ['/login'];
const apiAuthPrefix = '/api/auth';
const rootRedirectPath = '/BookMyGame';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isApiAuthRoute = path.startsWith(apiAuthPrefix);
  const isProtectedRoute = protectedRoutes.some(route => 
    route.includes(':path*') ? path.startsWith(route.split(':')[0]) : path === route
  );
  const isAdminRoute = adminRoutes.includes(path);
  const isAuthPageRoute = authPageRoutes.includes(path);
  const isRootPath = path === '/';

  if (isApiAuthRoute) {
    return NextResponse.next();
  }

  if (isRootPath) {
    return NextResponse.redirect(new URL(rootRedirectPath, request.url));
  }

  // Check auth status for protected and admin routes
  if (isProtectedRoute || isAdminRoute) {
    const authResponse = await fetch('http://localhost:3001/auth/profile', {
      headers: {
        Cookie: request.headers.get('Cookie') || '',
      },
      credentials: 'include',
    });

    if (!authResponse.ok) {
      // Try to refresh the token
      const refreshToken = request.cookies.get('refresh_token')?.value;
      if (refreshToken) {
        try {
          const refreshResponse = await fetch('http://localhost:3001/auth/refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Cookie: request.headers.get('Cookie') || '',
            },
            credentials: 'include',
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (refreshResponse.ok) {
            const { access_token, refresh_token } = await refreshResponse.json();
            const response = NextResponse.next();
            response.cookies.set('access_token', access_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 3600000,
            });
            response.cookies.set('refresh_token', refresh_token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
              maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return response;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }

   
    if (isAdminRoute) {
      const user = await authResponse.json();
      if (user.role !== 'admin') {
        return NextResponse.redirect(new URL('/BookMyGame', request.url));
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
      return NextResponse.redirect(new URL('/BookMyGame', request.url));
    }
  }

  return NextResponse.next();
}