import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

const BACKEND_API_URL = process.env.BASE_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, sessionId } = body;

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query is required and must be a string" },
        { status: 400 }
      );
    }

    // Get the JWT token from httpOnly cookies
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json(
        { 
          error: "Authentication required", 
          message: "Please log in to use the AI Assistant." 
        },
        { status: 401 }
      );
    }

    // Forward the request to the backend AI assistant service with authentication
    const backendResponse = await fetch(`${BACKEND_API_URL}/ai-assistant/ask`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token.value}`,
      },
      body: JSON.stringify({
        query,
        sessionId,
      }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error(
        `Backend API error (${backendResponse.status}):`,
        errorText
      );

      return NextResponse.json(
        {
          error: "Failed to get response from AI assistant",
          details:
            backendResponse.status >= 500 ? "Internal server error" : errorText,
        },
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in AI assistant API route:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        message: "Failed to process the AI assistant request",
      },
      { status: 500 }
    );
  }
}
