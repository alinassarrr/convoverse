import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log("Connecting Gmail integration...");
    
    // Call NestJS backend to get Gmail OAuth URL
    const backendResponse = await fetch("http://localhost:3000/integrations/gmail/connect", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.status}`);
    }

    const oauthUrl = await backendResponse.text();
    console.log("Gmail OAuth URL from backend:", oauthUrl);
    
    return NextResponse.json({
      redirect: true,
      url: oauthUrl,
      message: "Redirecting to Gmail authorization"
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
