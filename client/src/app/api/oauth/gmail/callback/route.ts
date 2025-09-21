import { NextResponse } from "next/server";

const API = process.env.BASE_URL;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    console.log("Gmail OAuth callback received");

    // Handle OAuth error
    if (error) {
      console.error("OAuth error:", error);
      return NextResponse.redirect("http://localhost:3001/integration?gmail=error");
    }

    // Handle missing code
    if (!code) {
      console.error("No authorization code received");
      return NextResponse.redirect("http://localhost:3001/integration?gmail=error");
    }

    // Decode state to get user token
    let userToken;
    try {
      const decodedState = JSON.parse(decodeURIComponent(state || "{}"));
      userToken = decodedState.token;
    } catch (e) {
      console.error("Invalid state parameter:", e);
      return NextResponse.redirect("http://localhost:3001/integration?gmail=error");
    }

    if (!userToken) {
      console.error("No user token in state");
      return NextResponse.redirect("http://localhost:3001/integration?gmail=error");
    }

    console.log("Processing Gmail connection for user...");

    // 1. Mark Gmail as connected in your backend DB
    try {
      const connectResponse = await fetch(`${API}/integrations/gmail/connect`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connected: true,
          fake: true // Let backend know this is a fake connection
        })
      });

      if (!connectResponse.ok) {
        console.error("Failed to mark Gmail as connected in DB");
      }
    } catch (e) {
      console.error("Error marking Gmail as connected:", e);
    }

    // 2. Hit the n8n webhook to start fetching messages
    try {
      const webhookResponse = await fetch("http://localhost:5678/webhook/4ad0cbb1-1db7-4323-940d-0bf77430cdc2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "start_gmail_sync",
          userToken,
          trigger: "oauth_connected"
        })
      });

      console.log("Webhook triggered, status:", webhookResponse.status);
    } catch (e) {
      console.error("Error triggering webhook:", e);
    }

    // 3. Redirect back to frontend with success
    console.log("Gmail connection faked successfully, redirecting...");
    return NextResponse.redirect("http://localhost:3001/integration?gmail=connected");

  } catch (error) {
    console.error("Gmail callback error:", error);
    return NextResponse.redirect("http://localhost:3001/integration?gmail=error");
  }
}
