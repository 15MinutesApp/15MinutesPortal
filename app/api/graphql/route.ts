import { proxyRequestToBackend } from "@/lib/server/backend-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Gelen GraphQL isteğinin body'sini alıyoruz.
  const body = await req.json();

  console.log(
    "[GraphQL Proxy] Request body:",
    JSON.stringify(body).substring(0, 200)
  );

  // Merkezi proxy fonksiyonumuzu çağırıyoruz.
  // IP, secret, user-agent gibi tüm detayları o fonksiyon halledecek.
  const backendResponse = await proxyRequestToBackend(req, "graphql", {
    method: "POST",
    body: JSON.stringify(body),
  });

  console.log(
    "[GraphQL Proxy] Backend response status:",
    backendResponse.status
  );

  // Backend'den gelen yanıtı okuyoruz.
  const responseData = await backendResponse.json();

  console.log("[GraphQL Proxy] Backend response data:", responseData);

  // Yeni bir response oluşturuyoruz.
  const response = NextResponse.json(responseData, {
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
