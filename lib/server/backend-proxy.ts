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
  headers.set("X-Proxy-Secret", process.env.PROXY_SECRET!);
  headers.set("X-Original-User-IP", originalUserIp);
  headers.set("X-Original-User-Agent", originalUserAgent);

  // Gelen isteğin Authorization header'ını (JWT token'ı vb.) backend'e iletiyoruz.
  if (req.headers.has("authorization")) {
    headers.set("authorization", req.headers.get("authorization")!);
  }

  // Gelen isteğin Cookie header'ını backend'e iletiyoruz (TOTP challenge token için gerekli).
  if (req.headers.has("cookie")) {
    headers.set("cookie", req.headers.get("cookie")!);
  }

  // Content-Type genelde json olur, değilse options'tan gelenle ezilir.
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const backendUrl = `${process.env.BACKEND_API_URL}/${path}`;

  try {
    const response = await fetch(backendUrl, {
      ...options,
      headers,
    });
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
