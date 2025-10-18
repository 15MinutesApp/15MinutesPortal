import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { totpCode, challengeToken, email } = await request.json();

    console.log("TOTP verification request received");

    // Get client IP - Vercel'de en güvenilir yöntem
    // Vercel automatically sets x-forwarded-for with the real client IP as the first value
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realClientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get location info from Vercel (these are based on the real client IP)
    const country = request.headers.get("x-vercel-ip-country") || "";
    const city = request.headers.get("x-vercel-ip-city") || "";
    const region = request.headers.get("x-vercel-ip-region") || "";

    console.log("Real Client IP:", realClientIp);
    console.log("Client Location:", { country, city, region });
    console.log("User Agent:", userAgent);

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

    // Build headers - Keep it simple, only send essential headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      "X-Forwarded-For": realClientIp,
    };

    console.log(
      "Sending TOTP verification to GraphQL API with headers:",
      headers
    );

    // Forward request to GraphQL API
    const response = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(graphqlQuery),
    });

    console.log("GraphQL API response status:", response.status);

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
