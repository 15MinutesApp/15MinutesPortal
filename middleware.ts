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

  // For now, we'll skip middleware auth check since we're using client-side auth
  // You can enhance this later with httpOnly cookies for better security

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
