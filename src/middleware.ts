import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple auth check via cookies
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/api/auth", "/api/seed"];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  // Static files and internal Next.js paths
  const isStaticPath =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/offline.html" ||
    pathname === "/logo.svg";

  if (isPublicPath || isStaticPath) {
    return NextResponse.next();
  }

  // Check for session token
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;

  if (!sessionToken) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|offline.html|logo.svg).*)",
  ],
};
