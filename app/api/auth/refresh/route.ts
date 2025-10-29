import { proxyRequestToBackend } from "@/lib/server/backend-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[Auth Refresh] Starting token refresh...");

    // Get refresh token from HTTP-only cookie
    const refreshTokenCookie = req.cookies.get("refreshToken");

    if (!refreshTokenCookie) {
      console.log("[Auth Refresh] No refresh token found in cookies");
      return NextResponse.json({ error: "No refresh token" }, { status: 401 });
    }

    const refreshToken = refreshTokenCookie.value;

    console.log("[Auth Refresh] Refresh token found, calling GraphQL mutation");

    console.log("refresh token deneniyor ", refreshToken);

    // Call GraphQL mutation to refresh tokens
    // The mutation needs the refresh token in variables
    const graphqlBody = {
      query: `
        mutation AdminRefreshTokens($refreshToken: String!) {
          Admin_refreshTokens(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: {
        refreshToken: refreshToken,
      },
    };

    // Use the backend proxy to send the GraphQL request
    const backendResponse = await proxyRequestToBackend(req, "graphql", {
      method: "POST",
      body: JSON.stringify(graphqlBody),
    });

    console.log(
      "[Auth Refresh] Backend response status:",
      backendResponse.status
    );

    // Parse the response
    const responseData = await backendResponse.json();

    console.log("[Auth Refresh] Backend response data:", responseData);

    // Check for errors
    if (responseData.errors) {
      console.error("[Auth Refresh] GraphQL errors:", responseData.errors);
      return NextResponse.json(
        { error: "Token refresh failed" },
        { status: 401 }
      );
    }

    // Get the new tokens from the response
    const refreshData = responseData.data?.Admin_refreshTokens;

    if (!refreshData) {
      console.log("[Auth Refresh] No token data in response");
      return NextResponse.json(
        { error: "No token data received" },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken: newRefreshToken } = refreshData;

    if (accessToken && newRefreshToken) {
      console.log("[Auth Refresh] Setting new tokens as HTTP-only cookies");

      // Create response
      const response = NextResponse.json(
        {
          data: {
            Admin_refreshTokens: {
              accessToken,
              refreshToken: newRefreshToken,
            },
          },
        },
        { status: 200 }
      );

      // Set new access token as HTTP-only cookie
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      // Set new refresh token as HTTP-only cookie
      response.cookies.set("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
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
