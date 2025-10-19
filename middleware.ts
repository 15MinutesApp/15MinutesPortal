import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define routes that don't require authentication
const publicRoutes = ["/login", "/apollo-test"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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

  // Token yoksa login'e yönlendir
  if (!accessToken && !refreshToken) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Token varsa devam et
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Geçici olarak sadece belirli route'ları kontrol et
    "/",
    "/users",
    "/interests",
    "/reports",
    "/test-api",
  ],
};
