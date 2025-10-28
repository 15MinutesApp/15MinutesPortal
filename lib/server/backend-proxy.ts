import { NextRequest } from "next/server";

interface ProxyOptions extends RequestInit {
  // fetch'in standart options'larına ek olarak kendi parametrelerimizi ekleyebiliriz.
}

/**
 * Gelen Next.js isteğini analiz eder ve ana backend API'mize güvenli bir şekilde proxy'ler.
 * @param req Gelen NextRequest objesi.
 * @param path Backend'de istek atılacak yol (örn: 'auth/login').
 * @param options Standart fetch options (method, body vb.).
 */
export async function proxyRequestToBackend(
  req: NextRequest,
  path: string,
  options: ProxyOptions
) {
  // Gerçek kullanıcı IP'sini ve User-Agent'ını NextRequest'ten alıyoruz.
  const originalUserIp =
    req.headers.get("x-forwarded-for")?.split(",")[0] ??
    req.headers.get("x-real-ip") ??
    "127.0.0.1";
  const originalUserAgent = req.headers.get("user-agent") ?? "";

  const headers = new Headers(options.headers);

  // Kendi özel ve güvenli header'larımızı ekliyoruz.
  headers.set("X-Proxy-Secret", process.env.PROXY_SECRET || "default-secret");
  headers.set("X-Original-User-IP", originalUserIp);
  headers.set("X-Original-User-Agent", originalUserAgent);

  // Gelen isteğin Authorization header'ını (JWT token'ı vb.) backend'e iletiyoruz.
  if (req.headers.has("authorization")) {
    headers.set("authorization", req.headers.get("authorization")!);
  }

  // Gelen isteğin Cookie header'ını backend'e iletiyoruz (TOTP challenge token için gerekli).
  if (req.headers.has("cookie")) {
    const cookieHeader = req.headers.get("cookie")!;
    console.log("[Backend Proxy] Request cookies:", cookieHeader);

    headers.set("cookie", cookieHeader);

    // Cookie'den access_token'ı alıp Bearer token olarak Authorization header'ına ekle
    const accessTokenMatch = cookieHeader.match(/accessToken=([^;]+)/);
    const refreshTokenMatch = cookieHeader.match(/refreshToken=([^;]+)/);

    if (accessTokenMatch) {
      const accessToken = accessTokenMatch[1];
      console.log(
        "[Backend Proxy] Found access token in cookie, setting Authorization header"
      );
      console.log(
        "[Backend Proxy] Access token (first 20 chars):",
        accessToken.substring(0, 20) + "..."
      );
      headers.set("authorization", `Bearer ${accessToken}`);
    } else {
      console.log("[Backend Proxy] No access token found in cookies");
      console.log("[Backend Proxy] Available cookies:", cookieHeader);
    }

    // Refresh token'ı da gönder (Admin_refreshTokens mutation'ı için)
    if (refreshTokenMatch) {
      const refreshToken = refreshTokenMatch[1];
      console.log(
        "[Backend Proxy] Found refresh token in cookie, adding to headers"
      );
      headers.set("x-refresh-token", refreshToken);
    }
  } else {
    console.log("[Backend Proxy] No cookies found in request");
  }

  // Content-Type genelde json olur, değilse options'tan gelenle ezilir.
  // For FormData, we don't set content-type, let fetch set it with boundary
  if (!headers.has("content-type")) {
    if (options.body instanceof FormData) {
      // Don't set content-type for FormData - let fetch set it with boundary
      console.log("[Backend Proxy] FormData detected, skipping content-type");
    } else {
      headers.set("content-type", "application/json");
    }
  }

  const backendUrl = process.env.BACKEND_API_URL
    ? `${process.env.BACKEND_API_URL}/${path}`
    : `http://localhost:4000/${path}`;

  console.log("[Backend Proxy] Backend URL:", backendUrl);
  console.log(
    "[Backend Proxy] Environment BACKEND_API_URL:",
    process.env.BACKEND_API_URL
  );

  // Debug: Backend'e gönderilen header'ları logla
  console.log("[Backend Proxy] Sending headers to backend:");
  console.log("[Backend Proxy] Authorization:", headers.get("authorization"));
  console.log("[Backend Proxy] Cookie:", headers.get("cookie"));
  console.log("[Backend Proxy] Backend URL:", backendUrl);

  try {
    console.log("[Backend Proxy] Making request to:", backendUrl);
    console.log("[Backend Proxy] Request body:", options.body);
    const response = await fetch(backendUrl, {
      ...options,
      headers,
    });

    console.log("[Backend Proxy] Response status:", response.status);
    console.log(
      "[Backend Proxy] Response headers:",
      Object.fromEntries(response.headers.entries())
    );

    // Log response body for debugging
    const responseClone = response.clone();
    const responseText = await responseClone.text();
    console.log("[Backend Proxy] Response body:", responseText);

    return response;
  } catch (error) {
    console.error(
      `[Backend Proxy Error] Failed to fetch ${backendUrl}:`,
      error
    );
    // Hata durumunda standart bir 500 Internal Server Error yanıtı oluşturup döndürüyoruz.
    return new Response(JSON.stringify({ message: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
