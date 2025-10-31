import { proxyRequestToBackend } from "@/lib/server/backend-proxy";
import { NextRequest, NextResponse } from "next/server";

// Helper function to check if error is unauthorized
const isUnauthorizedError = (error: any): boolean => {
  if (!error) return false;

  const message = error.message || "";
  const extensions = error.extensions || {};

  return (
    message.includes("Admin authentication required") ||
    message.includes("Unauthorized") ||
    message.includes("401") ||
    extensions.code === "UNAUTHENTICATED" ||
    extensions.code === "UNAUTHORIZED" ||
    extensions.originalError?.statusCode === 401
  );
};

// Helper function to refresh tokens
const refreshTokens = async (
  req: NextRequest
): Promise<{ accessToken: string; refreshToken: string } | null> => {
  try {
    console.log("[GraphQL Proxy] Attempting to refresh tokens...");

    // Get refresh token from cookie
    const refreshTokenCookie = req.cookies.get("refreshToken");

    if (!refreshTokenCookie) {
      console.log("[GraphQL Proxy] No refresh token found in cookies");
      return null;
    }

    const refreshToken = refreshTokenCookie.value;
    console.log(
      "[GraphQL Proxy] Refresh token found, calling Admin_refreshTokens mutation"
    );

    // Call Admin_refreshTokens mutation
    const refreshGraphqlBody = {
      query: `
        mutation AdminRefreshTokens($refreshToken: String!) {
          Admin_refreshTokens(refreshToken: $refreshToken) {
            accessToken
            refreshToken
          }
        }
      `,
      variables: {
        refreshToken: refreshToken,
      },
    };

    // Use the backend proxy to send the GraphQL request
    const refreshResponse = await proxyRequestToBackend(req, "graphql", {
      method: "POST",
      body: JSON.stringify(refreshGraphqlBody),
    });

    const refreshData = await refreshResponse.json();
    console.log("[GraphQL Proxy] Refresh response:", refreshData);

    // Check for errors in refresh response
    if (refreshData.errors) {
      console.error(
        "[GraphQL Proxy] Refresh mutation returned errors:",
        refreshData.errors
      );

      // Check if refresh token is invalid - if so, we need to logout
      const hasInvalidRefreshToken = refreshData.errors.some(
        (error: any) =>
          error.message?.includes("Invalid refresh token") ||
          error.message?.includes("refresh token") ||
          (error.extensions?.code === "UNAUTHENTICATED" &&
            error.path?.includes("Admin_refreshTokens"))
      );

      if (hasInvalidRefreshToken) {
        console.log(
          "[GraphQL Proxy] Refresh token is invalid, logout required"
        );
        // Return a special object to indicate logout is needed
        return { needsLogout: true } as any;
      }

      return null;
    }

    // Get the new tokens from the response
    const refreshResult = refreshData.data?.Admin_refreshTokens;

    if (
      !refreshResult ||
      !refreshResult.accessToken ||
      !refreshResult.refreshToken
    ) {
      console.log("[GraphQL Proxy] No valid token data received from refresh");
      return null;
    }

    console.log("[GraphQL Proxy] Token refresh successful");
    return {
      accessToken: refreshResult.accessToken,
      refreshToken: refreshResult.refreshToken,
    };
  } catch (error) {
    console.error("[GraphQL Proxy] Token refresh failed:", error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  // Gelen GraphQL isteğinin body'sini alıyoruz.
  const body = await req.json();

  console.log(
    "[GraphQL Proxy] Request body:",
    JSON.stringify(body).substring(0, 200)
  );

  // Check if this is the refresh mutation itself - if so, don't retry on error
  const isRefreshMutation =
    body.query?.includes("AdminRefreshTokens") ||
    body.query?.includes("Admin_refreshTokens");

  // Merkezi proxy fonksiyonumuzu çağırıyoruz.
  // IP, secret, user-agent gibi tüm detayları o fonksiyon halledecek.
  let backendResponse = await proxyRequestToBackend(req, "graphql", {
    method: "POST",
    body: JSON.stringify(body),
  });

  console.log(
    "[GraphQL Proxy] Backend response status:",
    backendResponse.status
  );

  // Backend'den gelen yanıtı okuyoruz.
  let responseData = await backendResponse.json();

  console.log("[GraphQL Proxy] Backend response data:", responseData);

  // Check for unauthorized errors in response
  let newTokens: { accessToken: string; refreshToken: string } | null = null;

  if (responseData.errors && !isRefreshMutation) {
    const hasUnauthorizedError = responseData.errors.some(isUnauthorizedError);

    if (hasUnauthorizedError) {
      console.log(
        "[GraphQL Proxy] Unauthorized error detected, attempting token refresh..."
      );

      // Attempt to refresh tokens
      const refreshResult = await refreshTokens(req);

      // Check if logout is needed (invalid refresh token)
      if (refreshResult && (refreshResult as any).needsLogout) {
        console.log(
          "[GraphQL Proxy] Refresh token is invalid, performing logout..."
        );

        // Call logout endpoint to clear cookies
        try {
          await fetch(`${req.nextUrl.origin}/api/auth/logout`, {
            method: "POST",
            headers: {
              cookie: req.headers.get("cookie") || "",
            },
          });
          console.log("[GraphQL Proxy] Logout endpoint called successfully");
        } catch (error) {
          console.error("[GraphQL Proxy] Logout request failed:", error);
        }

        // Clear cookies in response
        const logoutResponse = NextResponse.json(
          {
            errors: [
              {
                message: "Session expired. Please login again.",
                extensions: {
                  code: "UNAUTHENTICATED",
                  logoutRequired: true,
                },
              },
            ],
          },
          { status: 401 }
        );

        // Clear cookies
        logoutResponse.cookies.set("accessToken", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });

        logoutResponse.cookies.set("refreshToken", "", {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: 0,
        });

        return logoutResponse;
      }

      if (refreshResult && !(refreshResult as any).needsLogout) {
        newTokens = refreshResult;

        if (newTokens) {
          console.log(
            "[GraphQL Proxy] Token refresh successful, retrying original request..."
          );

          // Create a modified request with new token cookies for retry
          // We'll create a new request object with updated cookie header
          const originalCookieHeader = req.headers.get("cookie") || "";
          const newCookieHeader = `accessToken=${
            newTokens.accessToken
          }; refreshToken=${newTokens.refreshToken}${
            originalCookieHeader
              ? `; ${originalCookieHeader
                  .split(";")
                  .filter(
                    (c) =>
                      !c.trim().startsWith("accessToken=") &&
                      !c.trim().startsWith("refreshToken=")
                  )
                  .join("; ")}`
              : ""
          }`;

          // Create a new headers object with updated cookies
          const retryHeaders = new Headers(req.headers);
          retryHeaders.set("cookie", newCookieHeader);

          // Create a modified request-like object for retry
          // Since we can't modify NextRequest, we'll pass the new cookie header via a custom header
          // and backend-proxy will use it if present
          retryHeaders.set("x-retry-cookies", newCookieHeader);
          retryHeaders.set(
            "x-retry-authorization",
            `Bearer ${newTokens.accessToken}`
          );

          // Create a new NextRequest-like object by cloning the original
          // Actually, we need to modify the request, but NextRequest is immutable
          // So we'll create a temporary request object that backend-proxy can use
          const retryReq = {
            ...req,
            headers: retryHeaders,
            cookies: {
              get: (name: string) => {
                if (newTokens) {
                  if (name === "accessToken") {
                    return { value: newTokens.accessToken };
                  }
                  if (name === "refreshToken") {
                    return { value: newTokens.refreshToken };
                  }
                }
                return req.cookies.get(name);
              },
            },
          } as NextRequest;

          // Retry the original request with new tokens
          backendResponse = await proxyRequestToBackend(retryReq, "graphql", {
            method: "POST",
            body: JSON.stringify(body),
          });

          responseData = await backendResponse.json();
          console.log("[GraphQL Proxy] Retry response:", responseData);
        }
      } else {
        console.log(
          "[GraphQL Proxy] Token refresh failed, returning original error"
        );
        // Continue with original error response
      }
    }
  }

  // Yeni bir response oluşturuyoruz.
  let response = NextResponse.json(responseData, {
    status: backendResponse.status,
  });

  // Admin_verifyTotp mutation'ından token'lar geliyorsa, HTTP-only cookie olarak set et
  if (responseData.data?.Admin_verifyTotp) {
    const { accessToken, refreshToken } = responseData.data.Admin_verifyTotp;

    if (accessToken) {
      console.log("[GraphQL Proxy] Setting accessToken cookie");
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    if (refreshToken) {
      console.log("[GraphQL Proxy] Setting refreshToken cookie");
      response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  }

  // Admin_verifyBackupCode mutation'ından token'lar geliyorsa, HTTP-only cookie olarak set et
  if (responseData.data?.Admin_verifyBackupCode) {
    const { accessToken, refreshToken } =
      responseData.data.Admin_verifyBackupCode;

    if (accessToken) {
      console.log(
        "[GraphQL Proxy] Setting accessToken cookie from backup code"
      );
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    if (refreshToken) {
      console.log(
        "[GraphQL Proxy] Setting refreshToken cookie from backup code"
      );
      response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  }

  // Admin_refreshTokens mutation'ından token'lar geliyorsa, HTTP-only cookie olarak set et
  // Bu hem normal refresh mutation response'undan hem de error handling sırasında refresh edilen token'lardan gelebilir
  if (responseData.data?.Admin_refreshTokens) {
    const { accessToken, refreshToken } = responseData.data.Admin_refreshTokens;

    if (accessToken) {
      console.log("[GraphQL Proxy] Setting accessToken cookie from refresh");
      response.cookies.set("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    if (refreshToken) {
      console.log("[GraphQL Proxy] Setting refreshToken cookie from refresh");
      response.cookies.set("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }
  }

  // If we refreshed tokens during error handling, set them in the response
  if (newTokens) {
    console.log("[GraphQL Proxy] Setting refreshed tokens in response cookies");
    response.cookies.set("accessToken", newTokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    response.cookies.set("refreshToken", newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  // Backend'den gelen tüm set-cookie header'larını frontend'e iletiyoruz.
  // Headers.get() sadece ilk değeri döner, tüm cookie'leri almak için getSetCookie() kullanıyoruz
  const setCookieHeaders = backendResponse.headers.getSetCookie();
  console.log(
    "[GraphQL Proxy] Set-Cookie headers from backend:",
    setCookieHeaders
  );

  if (setCookieHeaders && setCookieHeaders.length > 0) {
    setCookieHeaders.forEach((cookie) => {
      console.log("[GraphQL Proxy] Setting cookie from backend:", cookie);
      response.headers.append("set-cookie", cookie);
    });
  }

  return response;
}
