import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Use Node.js runtime for cookie handling
export const runtime = "nodejs";

/**
 * API Route: /api/login
 * This route acts as a secure proxy to our main GraphQL API for TOTP verification.
 * 1. It receives TOTP code and challenge token from the client.
 * 2. It extracts the real user IP address from the 'x-forwarded-for' header provided by Vercel.
 * 3. It forwards the request to the main GraphQL API, including the real IP in a custom 'X-Client-IP' header.
 * 4. It forwards Cookie header from client to upstream for session continuity.
 * 5. It forwards Set-Cookie headers from upstream to client for session management.
 * 6. It returns the authentication tokens back to the client as HTTP-only cookies.
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

    // Get cookie from client to forward to upstream (important for session continuity)
    const cookie = request.headers.get("cookie") || "";
    const userAgent = request.headers.get("user-agent") || "";

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
      // IMPORTANT: Forward the real IP in a custom, trusted header.
      "X-Client-IP": clientIp,
      // IMPORTANT: Forward cookies from client to upstream for session continuity
      Cookie: cookie,
    };

    // Forward User-Agent if available
    if (userAgent) {
      headers["User-Agent"] = userAgent;
    }

    console.log(
      "Sending TOTP verification to GraphQL API with X-Client-IP:",
      clientIp
    );

    const upstream = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(graphqlQuery),
      cache: "no-store",
    });

    const data = await upstream.json();

    console.log("GraphQL API response status:", upstream.status);

    // 4. Proxy the response back to the client.
    if (!upstream.ok || data.errors) {
      console.error("GraphQL API Error:", data.errors);
      return NextResponse.json(
        {
          error: "An error occurred during TOTP verification.",
          details: data.errors,
        },
        { status: upstream.status || 400 }
      );
    }

    const { accessToken, refreshToken } = data.data.Admin_verifyTotp;

    // Set tokens as HTTP-only cookies
    const nextResponse = NextResponse.json(
      {
        message: "Giriş başarılı! Yönlendiriliyorsunuz...",
      },
      { status: 200 }
    );

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

    // Forward any additional Set-Cookie headers from upstream
    for (const [key, value] of upstream.headers) {
      if (key.toLowerCase() === "set-cookie") {
        nextResponse.headers.append("set-cookie", value);
      }
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
