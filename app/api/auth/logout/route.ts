import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      message: "Logout successful",
    });

    // Clear all auth cookies
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    response.cookies.delete("adminEmail");
    response.cookies.delete("challengeToken");

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
