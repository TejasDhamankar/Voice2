import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

// Paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/api/agents',
  '/api/calls',
  '/api/wallet',
  '/api/contacts',
];

// Paths that are excluded from authentication
const publicPaths = [
  '/api/auth/login',
  '/api/auth/register',
  '/login',
  '/register',
  '/'
];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Check if path is protected
  const isProtectedPath = protectedPaths.some(pp => path.startsWith(pp));
  const isPublicPath = publicPaths.some(pp => path === pp || path.startsWith(pp));

  if (!isProtectedPath || isPublicPath) {
    return NextResponse.next();
  }

  // Get token from authorization header or cookies
  const authHeader = request.headers.get('authorization');
  let token = authHeader ? authHeader.split(' ')[1] : null;

  if (!token) {
    // Try to get token from cookies
    const tokenCookie = request.cookies.get('token');
    if (tokenCookie) {
      token = tokenCookie.value;
    }
  }

  // If no token, redirect to login
  if (!token) {
    // For API routes, return 401
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  const decoded = verifyToken(token);
  if (!decoded) {
    // For API routes, return 401
    if (path.startsWith('/api/')) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public assets)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
};
