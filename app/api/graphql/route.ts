import { proxyRequestToBackend } from "@/lib/server/backend-proxy";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Gelen GraphQL isteğinin body'sini alıyoruz.
  const body = await req.json();

  // Merkezi proxy fonksiyonumuzu çağırıyoruz.
  // IP, secret, user-agent gibi tüm detayları o fonksiyon halledecek.
  const backendResponse = await proxyRequestToBackend(req, "graphql", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Backend'den gelen yanıtı okuyoruz.
  const responseData = await backendResponse.json();

  // Yeni bir response oluşturuyoruz.
  const response = NextResponse.json(responseData, {
    status: backendResponse.status,
  });

  // Backend'den gelen tüm set-cookie header'larını frontend'e iletiyoruz.
  // Headers.get() sadece ilk değeri döner, tüm cookie'leri almak için getSetCookie() kullanıyoruz
  const setCookieHeaders = backendResponse.headers.getSetCookie();
  if (setCookieHeaders && setCookieHeaders.length > 0) {
    setCookieHeaders.forEach((cookie) => {
      response.headers.append("set-cookie", cookie);
    });
  }

  return response;
}
