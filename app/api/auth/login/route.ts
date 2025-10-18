import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log("Login request received for email:", email);

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

    // Build headers - Send ONLY the real client IP without proxy chain
    // Backend parses these headers, so we must send clean values
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      "X-Real-IP": realClientIp,
      "X-Forwarded-For": realClientIp,
      "CF-Connecting-IP": realClientIp,
      "True-Client-IP": realClientIp,
    };

    // Add location info as custom headers
    if (country) {
      headers["X-Client-Country"] = country;
    }
    if (city) {
      headers["X-Client-City"] = city;
    }
    if (region) {
      headers["X-Client-Region"] = region;
    }

    console.log("Sending request to GraphQL API with headers:", headers);

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
