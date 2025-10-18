import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * API Route: /api/login
 * This route acts as a secure proxy to our main GraphQL API for TOTP verification.
 * 1. It receives TOTP code and challenge token from the client.
 * 2. It extracts the real user IP address from the 'x-forwarded-for' header provided by Vercel.
 * 3. It forwards the request to the main GraphQL API, including the real IP in a custom 'X-Client-IP' header.
 * 4. It returns the authentication tokens back to the client as HTTP-only cookies.
 */
export async function POST(request: NextRequest) {
  try {
    const { totpCode, challengeToken, email } = await request.json();

    // Get challenge token from cookie if not provided in body
    const cookieStore = await cookies();
    const storedChallengeToken =
      challengeToken || cookieStore.get("challengeToken")?.value;

    if (!storedChallengeToken || !totpCode) {
      return NextResponse.json(
        { error: "Challenge token and TOTP code are required." },
        { status: 400 }
      );
    }

    console.log("TOTP verification request received");

    // 1. Get the real client IP address.
    // Vercel populates 'x-forwarded-for' with the real client IP as the first value.
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    console.log("Real Client IP:", clientIp);
    console.log("User Agent:", userAgent);

    // 2. Prepare the GraphQL mutation.
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

    // 3. Make the server-to-server request to the main GraphQL API.
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      // IMPORTANT: Forward the real IP in a custom, trusted header.
      "X-Client-IP": clientIp,
    };

    console.log(
      "Sending TOTP verification to GraphQL API with X-Client-IP:",
      clientIp
    );

    const response = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(graphqlQuery),
    });

    const data = await response.json();

    console.log("GraphQL API response status:", response.status);

    // 4. Proxy the response back to the client.
    if (!response.ok || data.errors) {
      console.error("GraphQL API Error:", data.errors);
      return NextResponse.json(
        {
          error: "An error occurred during TOTP verification.",
          details: data.errors,
        },
        { status: response.status || 400 }
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
