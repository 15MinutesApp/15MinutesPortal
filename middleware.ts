import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define routes that don't require authentication
const publicRoutes = [
  "/login",
  "/apollo-test",
  "/debug-auth",
  "/test-login",
  "/test-backend",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Root path'i /site'e yönlendir
  if (pathname === "/") {
    const siteUrl = new URL("/site", request.url);
    return NextResponse.redirect(siteUrl);
  }

  // Check if it's a public route
  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Public route ise direkt geç
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Protected route için HTTP-only cookie kontrolü yap
  const accessToken = request.cookies.get("accessToken");
  const refreshToken = request.cookies.get("refreshToken");

  console.log("[Middleware] Checking cookies for path:", pathname);
  console.log("[Middleware] Access token exists:", !!accessToken);
  console.log("[Middleware] Refresh token exists:", !!refreshToken);

  // Token yoksa login'e yönlendir
  if (!accessToken && !refreshToken) {
    console.log("[Middleware] No tokens found, redirecting to login");
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token varsa devam et
  console.log("[Middleware] Tokens found, allowing access");
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Root path ve protected routes
    "/",
    "/site/:path*",
    "/users",
    "/interests",
    "/reports",
    "/test-api",
  ],
};
