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
    
    // Simple Google OAuth URL - redirect to n8n webhook
    const oauthUrl = "https://accounts.google.com/o/oauth2/auth?" + new URLSearchParams({
      client_id: "1090717084294-bn8lgskqv5vjnik5kk12edg1eqn7lq8h.apps.googleusercontent.com",
      redirect_uri: "http://localhost:5678/rest/oauth2-credential/callback",
      scope: "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.labels https://www.googleapis.com/auth/gmail.modify",
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      state: encodeURIComponent(JSON.stringify({ token, source: "frontend" }))
    }).toString();

    console.log("Generated OAuth URL:", oauthUrl);
    
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
