import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("accessToken")?.value;
    const adminEmail = cookieStore.get("adminEmail")?.value;

    if (accessToken) {
      return NextResponse.json({
        isAuthenticated: true,
        adminEmail: adminEmail || null,
      });
    }

    return NextResponse.json({
      isAuthenticated: false,
      adminEmail: null,
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    return NextResponse.json({
      isAuthenticated: false,
      adminEmail: null,
    });
  }
}
