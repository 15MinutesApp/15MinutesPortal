import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // Get User-Agent from client
    const userAgent = request.headers.get("user-agent") || "";

    // GraphQL mutation
    const graphqlQuery = {
      query: `
        mutation StartPasswordLogin($email: String!, $password: String!) {
          Admin_startPasswordLogin(email: $email, password: $password)
        }
      `,
      variables: { email, password },
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
        { error: data.errors?.[0]?.message || "Login failed" },
        { status: response.status || 400 }
      );
    }

    // Return challenge token
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
