import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') // Skip files with extensions
  ) {
    return NextResponse.next();
  }

  const sessionCookie = await getSessionCookie(request);
  const session = sessionCookie || null;
  
  const isAuthPage = ["/login", "/register"].includes(pathname);
  const isRootPath = pathname === "/";

  // Root redirect
  if (isRootPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // If logged in and trying to access auth pages, redirect to dashboard
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If not logged in and trying to access protected pages, redirect to login
  if (!session && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}