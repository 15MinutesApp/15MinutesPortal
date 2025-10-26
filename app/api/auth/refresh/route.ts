import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[Auth Refresh] Starting token refresh...");

    // Get refresh token from HTTP-only cookie
    const refreshToken = req.cookies.get("refreshToken");

    if (!refreshToken) {
      console.log("[Auth Refresh] No refresh token found");
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    // Call backend to refresh the token
    const backendUrl = process.env.BACKEND_URL || "http://localhost:4000";
    const refreshResponse = await fetch(`${backendUrl}/api/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken.value}`,
      },
    });

    if (!refreshResponse.ok) {
      console.log(
        "[Auth Refresh] Backend refresh failed:",
        refreshResponse.status
      );
      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      );
    }

    const data = await refreshResponse.json();

    if (data.accessToken) {
      console.log("[Auth Refresh] Setting new access token");

      // Create response with new access token
      const response = NextResponse.json(
        {
          success: true,
          accessToken: data.accessToken,
        },
        { status: 200 }
      );

      // Set new access token as HTTP-only cookie
      response.cookies.set("accessToken", data.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: "No access token received" },
      { status: 401 }
    );
  } catch (error) {
    console.error("[Auth Refresh] Refresh error:", error);
    return NextResponse.json({ error: "Refresh failed" }, { status: 500 });
  }
}
