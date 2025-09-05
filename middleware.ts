import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  const { pathname } = request.nextUrl;

  // Skip OAuth and auth API routes to prevent redirect interference
  if (pathname.startsWith("/api/auth") || 
      pathname.startsWith("/.well-known") ||
      pathname.includes("/oauth") ||
      pathname.includes("/authorize")) {
    return NextResponse.next();
  }

  // Redirect authenticated users away from login/signup pages
  if (sessionCookie && ["/login", "/signup"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users trying to access protected routes
  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/login", 
    "/signup",
    "/((?!api/auth|.well-known|_next/static|_next/image|favicon.ico).*)"
  ],
};
