import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("Gmail sync triggered - calling n8n webhook");

    // Trigger the Gmail sync webhook
    const n8nGmailWebHook =
      "http://localhost:5678/webhook/4ad0cbb1-1db7-4323-940d-0bf77430cdc2";

    const webhookPayload = {
      provider: "gmail",
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(n8nGmailWebHook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    const responseData = response.ok
      ? await response.text().catch(() => "OK")
      : null;

    console.log(
      "Gmail sync webhook response:",
      response.status,
      response.statusText
    );

    return NextResponse.json({
      success: true,
      message: "Gmail sync webhook triggered successfully",
      webhookResponse: responseData || "OK",
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCause = error instanceof Error ? error.cause : undefined;
    
    console.error("Gmail sync webhook error:", {
      error: errorMessage,
    });

    if (errorCause && typeof errorCause === 'object' && 'code' in errorCause && errorCause.code === "ECONNREFUSED") {
      return NextResponse.json(
        {
          message:
            "n8n service is not available. Please check if n8n is running on localhost:5678",
        },
        { status: 503 }
      );
    }

    if (errorCause && typeof errorCause === 'object' && 'code' in errorCause && errorCause.code === "ENOTFOUND") {
      return NextResponse.json(
        { message: "Cannot reach n8n service. Please check the webhook URL." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        message: `Failed to trigger Gmail sync: ${errorMessage}`,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
