import { NextRequest, NextResponse } from "next/server";

const GRAPHQL_ENDPOINT = "https://api.15minutes.app/graphql";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    console.log("Proxy GraphQL Request:", {
      endpoint: GRAPHQL_ENDPOINT,
      query: body.query?.substring(0, 100) + "...",
      variables: body.variables,
    });

    // Clean headers - remove problematic ones that might cause issues
    const cleanHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Only add Authorization header if present
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      cleanHeaders["Authorization"] = authHeader;
    }

    const response = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: cleanHeaders,
      body: JSON.stringify(body),
    });

    const data = await response.json();

    console.log("Proxy GraphQL Response:", {
      status: response.status,
      hasErrors: !!data.errors,
      hasData: !!data.data,
    });

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Proxy GraphQL Error:", error);
    return NextResponse.json(
      {
        errors: [
          {
            message: "Internal server error",
            extensions: { code: "INTERNAL_ERROR" },
          },
        ],
      },
      { status: 500 }
    );
  }
}
