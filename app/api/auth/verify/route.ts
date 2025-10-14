import { NextRequest, NextResponse } from "next/server";
import { verifyTotp, verifyBackupCode } from "@/lib/auth/authService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, backupCode, useBackupCode } = body;
    const challengeToken = request.cookies.get("challengeToken")?.value;

    if (!challengeToken) {
      return NextResponse.json(
        { error: "Challenge token not found. Please login again." },
        { status: 400 }
      );
    }

    let result;
    if (useBackupCode) {
      if (!backupCode) {
        return NextResponse.json(
          { error: "Backup code is required" },
          { status: 400 }
        );
      }
      result = await verifyBackupCode(challengeToken, backupCode);
    } else {
      if (!otp) {
        return NextResponse.json(
          { error: "TOTP code is required" },
          { status: 400 }
        );
      }
      result = await verifyTotp(challengeToken, otp);
    }

    const { accessToken, refreshToken } = result;

    // Set tokens as HTTP-only cookies
    const response = NextResponse.json({
      success: true,
      message: "Giriş başarılı! Yönlendiriliyorsunuz...",
    });

    response.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600, // 1 hour
      path: "/",
    });

    response.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 3600, // 7 days
      path: "/",
    });

    // Set admin email cookie (non-HTTP-only for frontend access)
    const adminEmail = request.headers.get("x-admin-email");
    if (adminEmail) {
      response.cookies.set("adminEmail", adminEmail, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 3600, // 7 days
        path: "/",
      });
    }

    // Clear challenge token
    response.cookies.delete("challengeToken");

    return response;
  } catch (error) {
    console.error("Verification error:", error);

    // Use the parsed body to determine error message
    const errorMessage = body?.useBackupCode
      ? "Backup kodu hatalı. Lütfen tekrar deneyin."
      : "TOTP kodu hatalı. Lütfen tekrar deneyin.";

    return NextResponse.json({ error: errorMessage }, { status: 401 });
  }
}
