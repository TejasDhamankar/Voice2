import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const agentId = process.env.AGENT_ID;
    if (!agentId) {
      return NextResponse.json({ error: "Missing AGENT_ID" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY!,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Error fetching signed URL:", errorData);
      return NextResponse.json({ error: errorData }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (err) {
    console.error("Error generating signed URL:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
