import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Get client IP and User Agent from Vercel headers
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const userAgent = request.headers.get("user-agent") || "unknown";

    // Get access token from HTTP-only cookie
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;

    // Forward request to GraphQL API with client info
    const response = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-Client-IP": clientIp,
        "X-Client-User-Agent": userAgent,
        // Forward authorization header if token exists
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        // Forward other relevant headers
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
        "X-Real-IP": request.headers.get("x-real-ip") || "",
        "X-Vercel-IP-Country": request.headers.get("x-vercel-ip-country") || "",
        "X-Vercel-IP-City": request.headers.get("x-vercel-ip-city") || "",
        "X-Vercel-IP-Region": request.headers.get("x-vercel-ip-region") || "",
      },
      body: JSON.stringify(body),
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
        { error: `GraphQL API error: ${response.statusText}`, details: text },
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
        { error: "Invalid response from GraphQL API", details: text },
        { status: 502 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    console.error("GraphQL proxy error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
