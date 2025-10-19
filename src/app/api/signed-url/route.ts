// /app/api/signed-url/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
    const AGENT_ID = process.env.AGENT_ID!;

    if (!ELEVENLABS_API_KEY || !AGENT_ID) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${AGENT_ID}`,
      {
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs error:", errorText);
      return NextResponse.json({ error: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ signedUrl: data.signed_url });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
    