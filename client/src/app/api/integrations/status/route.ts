import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API = process.env.BASE_URL;

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    console.log("Getting integrations status...");

    const res = await fetch(`${API}/integrations/status`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    console.log("Backend response status:", res.status);
    console.log("Backend response data:", data);

    if (!res.ok) {
      console.error("Backend error:", data);
      return NextResponse.json(
        { message: data?.message || "Failed to get integrations status" },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
