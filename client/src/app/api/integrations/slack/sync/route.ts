import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtDecode } from "jwt-decode";

const API = process.env.BASE_URL;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Decode JWT to get userId
    let userId: string;
    try {
      const decoded: any = jwtDecode(token);
      userId = decoded.userId;
      if (!userId) {
        throw new Error("No userId in token");
      }
    } catch (error) {
      console.error("Token decode error:", error);
      return NextResponse.json({ message: "Invalid token" }, { status: 401 });
    }

    console.log("Starting Slack sync for userId:", userId);

    const res = await fetch(`${API}/integrations/slack/sync/${userId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    console.log("Slack sync response status:", res.status);
    console.log("Slack sync response data:", data);

    if (!res.ok) {
      console.error("Slack sync error:", data);
      return NextResponse.json(
        { message: data?.message || "Failed to sync Slack data" },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Slack sync started successfully",
      ...data,
    });
  } catch (error) {
    console.error("Slack sync API route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
