import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    console.log("[Auth Verify] Starting verification...");
    console.log("[Auth Verify] Cookies:", req.cookies.getAll());

    // HTTP-only cookie'lerin varlığını kontrol et
    const accessToken = req.cookies.get("accessToken");
    const refreshToken = req.cookies.get("refreshToken");

    console.log("[Auth Verify] Access token exists:", !!accessToken);
    console.log("[Auth Verify] Refresh token exists:", !!refreshToken);

    // En az bir token varsa authenticated kabul et
    if (accessToken || refreshToken) {
      console.log("[Auth Verify] Authentication successful - tokens found");
      return NextResponse.json(
        {
          authenticated: true,
          data: {
            // Cookie'den email'i alamayız (HTTP-only), bu yüzden null bırakıyoruz
            email: null,
          },
        },
        {
          status: 200,
        }
      );
    }

    // Token yoksa authenticated değil
    console.log("[Auth Verify] Authentication failed - no tokens found");
    return NextResponse.json(
      {
        authenticated: false,
        data: null,
      },
      {
        status: 401,
      }
    );
  } catch (error) {
    console.error("[Auth Verify] Verification error:", error);
    return NextResponse.json(
      {
        authenticated: false,
        error: "Verification failed",
      },
      {
        status: 500,
      }
    );
  }
}