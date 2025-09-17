import { NextResponse } from "next/server";

const API = process.env.BASE_URL;

export async function POST(req: Request) {
  const body = await req.json();
  const { pathname } = new URL(req.url);

  // Extract endpoint from pathname (login or register)
  const endpoint = pathname.split("/").pop();

  const res = await fetch(`${API}/auth/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json(
      { message: data?.message || "Something went wrong" },
      { status: res.status }
    );
  }

  const token = data?.access_token;
  const response = NextResponse.json({ ok: true });
  response.cookies.set("token", token, {
    httpOnly: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
  return response;
}
