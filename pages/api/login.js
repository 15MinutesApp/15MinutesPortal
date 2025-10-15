/**
 * API Route: /api/login
 * This route acts as a secure proxy to our main GraphQL API.
 * 1. It receives TOTP verification credentials (totpCode) from the client.
 * 2. It reads the challengeToken from HTTP-only cookies.
 * 3. It extracts the real user IP address from the 'x-forwarded-for' header provided by Vercel.
 * 4. It extracts the real user User-Agent from the 'user-agent' header.
 * 5. It forwards the request to the main GraphQL API, including the real IP and User-Agent in custom headers.
 * 6. It returns the response from the GraphQL API back to the client.
 */
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  try {
    const { totpCode } = req.body;

    if (!totpCode) {
      return res.status(400).json({ error: "TOTP code is required." });
    }

    // Get challenge token from HTTP-only cookie
    const challengeToken = req.cookies.challengeToken;

    if (!challengeToken) {
      return res
        .status(400)
        .json({ error: "Challenge token not found. Please login again." });
    }

    // 1. Get the real client IP address.
    // Vercel populates 'x-forwarded-for'. For local dev, we fall back to remoteAddress.
    const clientIp = req.headers["x-forwarded-for"]
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : req.socket.remoteAddress;

    // 2. Get the client User Agent
    const clientUserAgent = req.headers["user-agent"] || "Unknown";

    // 2. Prepare the GraphQL mutation.
    const graphqlQuery = {
      query: `
        mutation AdminVerifyTotp($challengeToken: String!, $totpCode: String!) {
          Admin_verifyTotp(challengeToken: $challengeToken, totpCode: $totpCode) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: { challengeToken, totpCode },
    };

    // 3. Make the server-to-server request to the main GraphQL API.
    const response = await fetch("https://api.15minutes.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // IMPORTANT: Forward the real IP in a custom, trusted header.
        "X-Client-IP": clientIp,
        // IMPORTANT: Forward the real User Agent in a custom, trusted header.
        "X-Client-User-Agent": clientUserAgent,
        // Add any other necessary headers like an API key if required
        // 'Authorization': ⁠ Bearer ${process.env.INTERNAL_API_KEY} ⁠
      },
      body: JSON.stringify(graphqlQuery),
    });

    const data = await response.json();

    // 4. Proxy the response back to the client.
    if (!response.ok || data.errors) {
      console.error("GraphQL API Error:", data.errors);
      return res.status(response.status).json({
        error: "An error occurred during login.",
        details: data.errors,
      });
    }

    const { accessToken, refreshToken } = data.data.Admin_verifyTotp;

    // Set tokens as HTTP-only cookies
    res.setHeader("Set-Cookie", [
      `accessToken=${accessToken}; HttpOnly; Secure=${
        process.env.NODE_ENV === "production"
      }; SameSite=Lax; Path=/; Max-Age=3600`,
      `refreshToken=${refreshToken}; HttpOnly; Secure=${
        process.env.NODE_ENV === "production"
      }; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`,
    ]);

    return res.status(200).json({
      success: true,
      message: "Giriş başarılı! Yönlendiriliyorsunuz...",
    });
  } catch (error) {
    console.error("API route error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
