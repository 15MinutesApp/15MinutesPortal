import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logged out successfully",
  });

  // Clear all HTTP-only cookies
  response.cookies.delete("accessToken");
  response.cookies.delete("refreshToken");
  response.cookies.delete("challengeToken");
  response.cookies.delete("adminEmail");

  return response;
}
