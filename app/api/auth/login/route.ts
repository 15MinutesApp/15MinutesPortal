import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Get client IP and User Agent
    // Vercel'de gerçek client IP'yi almak için öncelik sırası:
    // 1. x-real-ip (en güvenilir)
    // 2. x-forwarded-for'un ilk IP'si (client IP)
    // 3. x-vercel-forwarded-for (Vercel specific)
    const clientIp =
      request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0].trim() ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    // GraphQL mutation for password login
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
        { error: `Authentication failed: ${response.statusText}` },
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
        { error: data.errors[0]?.message || "Authentication failed" },
        { status: 400 }
      );
    }

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
