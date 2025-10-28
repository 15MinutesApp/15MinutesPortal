import { proxyRequestToBackend } from "@/lib/server/backend-proxy";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[Upload Thumbnail] Received upload request");

    const formData = await req.formData();

    console.log(
      "[Upload Thumbnail] Form data keys:",
      Array.from(formData.keys())
    );

    // Log form data entries
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(
          `[Upload Thumbnail] ${key}: File (${value.size} bytes, type: ${value.type})`
        );
      } else {
        console.log(`[Upload Thumbnail] ${key}: ${value}`);
      }
    }

    // Proxy the upload request to backend
    const backendResponse = await proxyRequestToBackend(
      req,
      "upload/thumbnail",
      {
        method: "POST",
        body: formData,
      }
    );

    console.log(
      "[Upload Thumbnail] Backend response status:",
      backendResponse.status
    );

    // Return the response from backend
    const responseData = await backendResponse.text();

    console.log("[Upload Thumbnail] Backend response:", responseData);

    return new Response(responseData, {
      status: backendResponse.status,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[Upload Thumbnail] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Upload failed",
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
