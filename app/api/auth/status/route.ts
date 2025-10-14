import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const adminEmail = request.cookies.get("adminEmail")?.value;

  return NextResponse.json({
    isAuthenticated: !!(accessToken && refreshToken),
    adminEmail: adminEmail || null,
  });
}
