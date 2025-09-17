import { NextResponse } from "next/server";

const API = process.env.BASE_URL;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    console.log("Backend response status:", res.status);
    console.log("Backend response data:", data);

    if (!res.ok) {
      console.error("Backend error:", data);
      return NextResponse.json(
        { message: data?.message || "Login failed" },
        { status: res.status }
      );
    }

    const token = data?.access_token;
    if (!token) {
      console.error("No access token in response:", data);
      return NextResponse.json(
        { message: "No access token received" },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Login successful",
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
