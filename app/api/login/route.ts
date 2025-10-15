import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { totpCode, challengeToken, email } = await request.json();

    // Get client IP and User Agent
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get challenge token from cookie if not provided in body
    const cookieStore = await cookies();
    const storedChallengeToken =
      challengeToken || cookieStore.get("challengeToken")?.value;

    if (!storedChallengeToken) {
      return NextResponse.json(
        { error: "Challenge token not found. Please start login again." },
        { status: 400 }
      );
    }

    // GraphQL mutation for TOTP verification
    const graphqlQuery = {
      query: `
        mutation VerifyTotp($challengeToken: String!, $totpCode: String!) {
          Admin_verifyTotp(challengeToken: $challengeToken, totpCode: $totpCode) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: {
        challengeToken: storedChallengeToken,
        totpCode,
      },
    };

    // Forward request to GraphQL API
    const response = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-Client-IP": clientIp,
        "X-Client-User-Agent": userAgent,
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "X-Real-IP": request.headers.get("x-real-ip") || "",
        "X-Vercel-IP-Country": request.headers.get("x-vercel-ip-country") || "",
        "X-Vercel-IP-City": request.headers.get("x-vercel-ip-city") || "",
        "X-Vercel-IP-Region": request.headers.get("x-vercel-ip-region") || "",
      },
      body: JSON.stringify(graphqlQuery),
    });

    const contentType = response.headers.get("content-type");

    if (!response.ok) {
      const text = await response.text();
      console.error("GraphQL API error:", {
        status: response.status,
        statusText: response.statusText,
        contentType,
        body: text,
      });
      return NextResponse.json(
        { error: `Verification failed: ${response.statusText}` },
        { status: response.status }
      );
    }

    if (!contentType?.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response from GraphQL API:", {
        contentType,
        body: text,
      });
      return NextResponse.json(
        { error: "Invalid response from authentication server" },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return NextResponse.json(
        { error: data.errors[0]?.message || "Verification failed" },
        { status: 400 }
      );
    }

    const { accessToken, refreshToken } = data.data.Admin_verifyTotp;

    // Set tokens as HTTP-only cookies
    const nextResponse = NextResponse.json({
      message: "Giriş başarılı! Yönlendiriliyorsunuz...",
    });

    // Set cookies with secure flags
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

    // Store admin email in cookie (not HTTP-only so client can read it)
    if (email) {
      nextResponse.cookies.set("adminEmail", email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
      });
    }

    // Clear challenge token
    nextResponse.cookies.delete("challengeToken");

    return nextResponse;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
