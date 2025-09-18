import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.BASE_URL;

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("Connecting Slack integration...");

    const res = await fetch(`${API}/integrations/slack/connect`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("Backend error:", errorData);
      return NextResponse.json(
        { message: errorData?.message || "Failed to connect Slack" },
        { status: res.status }
      );
    }

    // The slack connect endpoint returns a URL string for OAuth redirect
    const oauthUrl = await res.text();

    console.log(
      "Slack OAuth URL generated:",
      oauthUrl.substring(0, 50) + "..."
    );

    return NextResponse.json({
      success: true,
      redirect: true,
      url: oauthUrl,
      message: "Redirecting to Slack authorization...",
    });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
