import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { totpCode, challengeToken, email } = await request.json();

    if (!challengeToken || !totpCode) {
      return NextResponse.json(
        { error: "Challenge token and TOTP code are required." },
        { status: 400 }
      );
    }

    // Get User-Agent from client
    const userAgent = request.headers.get("user-agent") || "";

    // GraphQL mutation
    const graphqlQuery = {
      query: `
        mutation VerifyTotp($challengeToken: String!, $totpCode: String!) {
          Admin_verifyTotp(challengeToken: $challengeToken, totpCode: $totpCode) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: { challengeToken, totpCode },
    };

    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Forward User-Agent if available
    if (userAgent) {
      headers["User-Agent"] = userAgent;
    }

    // Forward to GraphQL API
    const response = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(graphqlQuery),
    });

    const data = await response.json();

    if (!response.ok || data.errors) {
      return NextResponse.json(
        { error: data.errors?.[0]?.message || "Verification failed" },
        { status: response.status || 400 }
      );
    }

    const { accessToken, refreshToken } = data.data.Admin_verifyTotp;

    // Set tokens as HTTP-only cookies
    const nextResponse = NextResponse.json({
      message: "Giriş başarılı! Yönlendiriliyorsunuz...",
    });

    nextResponse.cookies.set("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    nextResponse.cookies.set("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    // Store admin email (not HTTP-only so client can read it)
    if (email) {
      nextResponse.cookies.set("adminEmail", email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    return nextResponse;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
