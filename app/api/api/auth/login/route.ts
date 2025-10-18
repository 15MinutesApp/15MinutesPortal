import { NextRequest, NextResponse } from "next/server";

// Use Node.js runtime for cookie handling
export const runtime = "nodejs";

/**
 * API Route: /api/auth/login
 * This route acts as a secure proxy to our main GraphQL API.
 * 1. It receives login credentials (email, password) from the client.
 * 2. It extracts the real user IP address from the 'x-forwarded-for' header provided by Vercel.
 * 3. It forwards the request to the main GraphQL API, including the real IP in a custom 'X-Client-IP' header.
 * 4. It forwards Set-Cookie headers from upstream to client for session management.
 * 5. It returns the response from the GraphQL API back to the client.
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    console.log("Login request received for email:", email);

    // 1. Get the real client IP address.
    // Vercel populates 'x-forwarded-for' with the real client IP as the first value.
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : "unknown";

    const userAgent = request.headers.get("user-agent") || "";

    console.log("Real Client IP:", clientIp);
    console.log("User Agent:", userAgent);

    // 2. Prepare the GraphQL mutation.
    const graphqlQuery = {
      query: `
        mutation StartPasswordLogin($email: String!, $password: String!) {
          Admin_startPasswordLogin(email: $email, password: $password)
        }
      `,
      variables: {
        email,
        password,
      },
    };

    // 3. Make the server-to-server request to the main GraphQL API.
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      // IMPORTANT: Forward the real IP in a custom, trusted header.
      "X-Client-IP": clientIp,
    };

    // Forward User-Agent if available
    if (userAgent) {
      headers["User-Agent"] = userAgent;
    }

    console.log("Sending request to GraphQL API with X-Client-IP:", clientIp);

    const upstream = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers,
      body: JSON.stringify(graphqlQuery),
    });

    const data = await upstream.json();

    console.log("GraphQL API response status:", upstream.status);

    // 4. Proxy the response back to the client.
    if (!upstream.ok || data.errors) {
      console.error("GraphQL API Error:", data.errors);
      return NextResponse.json(
        {
          error: "An error occurred during login.",
          details: data.errors,
        },
        { status: upstream.status || 400 }
      );
    }

    // Proxy response + SET-COOKIE FORWARD
    const res = NextResponse.json(
      {
        message: "Email ve şifre doğrulandı. Lütfen TOTP kodunuzu girin.",
        challengeToken: data.data.Admin_startPasswordLogin,
      },
      { status: 200 }
    );

    // Forward all Set-Cookie headers from upstream to client
    for (const [key, value] of upstream.headers) {
      if (key.toLowerCase() === "set-cookie") {
        res.headers.append("set-cookie", value);
      }
    }

    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
