// /api/exotel/connect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel';
import Agent from '@/models/agentModel';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

/**
 * Creates the ExoML response to instruct Exotel to stream audio to a WebSocket.
 * @param webSocketUrl The signed URL from ElevenLabs.
 * @returns An XML string (ExoML).
 */
function createExotelStreamResponse(webSocketUrl: string): string {
    // Ensure the URL is properly XML-escaped
    const escapedUrl = webSocketUrl.replace(/&/g, '&amp;');
    return `
        <Response>
            <Stream url="${escapedUrl}" />
        </Response>
    `.trim();
}

/**
 * This webhook is called by Exotel's <Connect> applet when the call is answered.
 * Its sole purpose is to fetch the signed WebSocket URL from ElevenLabs and return
 * the <Stream> ExoML to start the audio stream.
 */
export async function POST(request: NextRequest) {
    await connectDB();

    const formData = await request.formData();
    const callSid = formData.get('CallSid') as string | null;
    const customFieldString = formData.get('CustomField') as string | null;

    console.log(`Exotel Connect Webhook (POST) - CallSid: ${callSid}, CustomField: ${customFieldString}`);

    if (!customFieldString) {
        console.error("Connect Webhook: Missing CustomField data.");
        return new Response("<Response><Hangup/></Response>", { status: 200, headers: { 'Content-Type': 'application/xml' } });
    }

    try {
        const { internalCallId, elevenLabsAgentId } = JSON.parse(customFieldString);

        if (!internalCallId || !elevenLabsAgentId) {
            throw new Error("Invalid CustomField data. Missing internalCallId or elevenLabsAgentId.");
        }

        const call = await Call.findById(internalCallId);
        if (!call) {
            throw new Error(`Call record not found for internal ID: ${internalCallId}`);
        }

        // Find the agent to get its name
        const agent = await Agent.findOne({ agentId: elevenLabsAgentId });
        if (agent) {
            call.agentName = agent.name;
        }

        // Fetch the signed URL from ElevenLabs
        const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${elevenLabsAgentId}`;
        const elResponse = await fetch(url, { headers: { 'xi-api-key': ELEVENLABS_API_KEY } });

        if (!elResponse.ok) {
            throw new Error(`ElevenLabs API error: ${elResponse.status}`);
        }

        const data = await elResponse.json();
        if (!data.signed_url) {
            throw new Error("ElevenLabs response missing signed_url");
        }

        // Save the URL and update status
        call.elevenLabsSignedUrl = data.signed_url;
        call.status = 'connected';
        if (!call.callStartTime) call.callStartTime = new Date();
        await call.save();

        console.log(`Connect Webhook: Successfully fetched signed URL for call ${internalCallId}. Returning <Stream> ExoML.`);
        const exoML = createExotelStreamResponse(data.signed_url);
        return new Response(exoML, { status: 200, headers: { 'Content-Type': 'application/xml' } });

    } catch (error: any) {
        console.error("CRITICAL ERROR in Connect Webhook:", error.message);
        // Hangup the call if we fail to get the stream URL
        return new Response("<Response><Hangup/></Response>", { status: 200, headers: { 'Content-Type': 'application/xml' } });
    }
}
