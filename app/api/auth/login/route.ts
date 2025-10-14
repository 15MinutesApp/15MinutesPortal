import { NextRequest, NextResponse } from "next/server";
import { startPasswordLogin } from "@/lib/auth/authService";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const challengeToken = await startPasswordLogin(email, password);

    // Set challenge token as HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Email ve şifre doğrulandı. Lütfen TOTP kodunuzu girin.",
    });

    response.cookies.set("challengeToken", challengeToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 300, // 5 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    console.error("Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      {
        error: "Giriş başarısız. Lütfen bilgilerinizi kontrol edin.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 401 }
    );
  }
}
