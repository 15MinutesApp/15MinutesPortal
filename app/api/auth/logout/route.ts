import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[Auth Logout] Logging out user...");

    // Response oluştur
    const response = NextResponse.json(
      {
        success: true,
        message: "Logged out successfully",
      },
      {
        status: 200,
      }
    );

    // HTTP-only cookie'leri sil
    response.cookies.set("accessToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Immediately expire
    });

    response.cookies.set("refreshToken", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Immediately expire
    });

    console.log("[Auth Logout] Cookies cleared");

    return response;
  } catch (error) {
    console.error("[Auth Logout] Logout error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Logout failed",
      },
      {
        status: 500,
      }
    );
  }
}
