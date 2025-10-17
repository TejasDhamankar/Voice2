import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Call from "@/models/callModel";
import { OpenAI } from "openai";

const SECRET = process.env.ELEVENLABS_WEBHOOK_SECRET!;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// This is your robust signature validation function, slightly adapted. It's great.
function isValidSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  try {
    const expectedSignature = crypto
      .createHmac("sha256", SECRET)
      .update(rawBody)
      .digest("hex");
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

// Your excellent OpenAI outcome analysis function. No changes needed.
async function analyzeCallOutcome(summary: string): Promise<string> {
    if (!summary?.trim()) return "neutral";
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            temperature: 0,
            messages: [
                { role: "system", content: "You analyze call summaries. Determine the outcome from this list: highly_interested, appointment_scheduled, needs_follow_up, not_interested, do_not_call, neutral, unqualified, call_back_later. Respond with only the outcome name." },
                { role: "user", content: `Call summary: ${summary}` },
            ],
        });
        return completion.choices[0]?.message?.content?.trim().toLowerCase() || "neutral";
    } catch (err) {
        console.error("OpenAI outcome analysis failed:", err);
        return "neutral"; // Fallback on error
    }
}

export async function POST(req: NextRequest) {
    try {
        const rawBody = await req.text();
        const signature = req.headers.get("xi-signature");

        if (!isValidSignature(rawBody, signature)) {
            console.warn("Invalid webhook signature received.");
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
        }

        const event = JSON.parse(rawBody);

        // We only care about the 'call.ended' event
        if (event.type === 'call.ended') {
            const { metadata, conversation_id, summary, status, start_time, end_time, call_duration_seconds, cost, call_sid } = event.data;

            if (!metadata || !metadata.call_id) {
                console.log("Webhook ignored: Event is missing the internal `metadata.call_id`.");
                return NextResponse.json({ message: 'OK' });
            }

            await connectDB();
            
            // Find the call in our database using the internal ID we provided
            const call = await Call.findById(metadata.call_id);
            if (!call) {
                console.error(`Webhook error: Call with internal ID ${metadata.call_id} not found.`);
                return NextResponse.json({ error: 'Call not found' }, { status: 404 });
            }

            // Update the call with all the final data from ElevenLabs
            call.status = status;
            call.summary = summary || '';
            call.conversationId = conversation_id;
            call.elevenLabsCallId = call_sid; // The Twilio Call SID
            call.startTime = start_time ? new Date(start_time * 1000) : call.startTime;
            call.endTime = end_time ? new Date(end_time * 1000) : new Date();
            call.duration = call_duration_seconds || 0;
            call.cost = cost || 0;

            // Generate a more detailed outcome using OpenAI
            if (summary) {
                call.outcome = await analyzeCallOutcome(summary);
            }

            await call.save();
            console.log(`Webhook successfully updated call ${call._id} to status: ${status}`);
        }

        return NextResponse.json({ message: 'Webhook received' });
    } catch (error: any) {
        console.error('Error processing ElevenLabs webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}