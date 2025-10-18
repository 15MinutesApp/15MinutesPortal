import { NextRequest, NextResponse } from "next/server";

/**
 * API Route: /api/auth/login
 * This route acts as a secure proxy to our main GraphQL API.
 * 1. It receives login credentials (email, password) from the client.
 * 2. It extracts the real user IP address from the 'x-forwarded-for' header provided by Vercel.
 * 3. It forwards the request to the main GraphQL API, including the real IP in a custom 'X-Client-IP' header.
 * 4. It returns the response from the GraphQL API back to the client.
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

    const userAgent = request.headers.get("user-agent") || "unknown";

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
      "User-Agent": userAgent,
      // IMPORTANT: Forward the real IP in a custom, trusted header.
      "X-Client-IP": clientIp,
    };

    console.log("Sending request to GraphQL API with X-Client-IP:", clientIp);

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
          error: "An error occurred during login.",
          details: data.errors,
        },
        { status: response.status || 400 }
      );
    }

    // Return the challenge token for TOTP verification
    return NextResponse.json({
      message: "Email ve şifre doğrulandı. Lütfen TOTP kodunuzu girin.",
      challengeToken: data.data.Admin_startPasswordLogin,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
