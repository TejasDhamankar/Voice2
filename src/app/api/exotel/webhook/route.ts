// app/api/exotel/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel'; // Your Mongoose Call model

// This function generates the XML/JSON response Exotel needs
// to connect the call to the WebSocket.
// You MUST check Exotel's specific documentation for the correct format!
// This is a likely structure based on TwiML <Connect><Stream> concept.
function createExotelConnectWebSocketResponse(webSocketUrl: string): string {
    // IMPORTANT: Replace this with the ACTUAL XML or JSON format Exotel expects.
    // Check Exotel's <Connect> or similar verb documentation.
    // Example using a TwiML-like structure (conceptual):
    const response = `
        <Response>
            <Connect>
                <Stream url="${webSocketUrl}" />
            </Connect>
            <Say>Connecting you to the agent.</Say> 
        </Response>
    `; 
    // If Exotel uses JSON, construct the appropriate JSON object.
    return response;
}

export async function POST(request: NextRequest) {
    await connectDB();
    const formData = await request.formData(); // Exotel often sends form data

    // Log the entire request body for debugging
    console.log("Exotel Webhook Received:", Object.fromEntries(formData.entries()));

    const callStatus = formData.get('CallStatus') as string | null;
    const callSid = formData.get('CallSid') as string | null;
    const customFieldString = formData.get('CustomField') as string | null; // Your custom data

    let internalCallId: string | null = null;
    let elevenLabsAgentId: string | null = null;

    if (customFieldString) {
        try {
            const customData = JSON.parse(customFieldString);
            internalCallId = customData.internalCallId;
            elevenLabsAgentId = customData.elevenLabsAgentId;
        } catch (e) {
            console.error("Failed to parse CustomField:", customFieldString);
        }
    }

    // If we don't have our internal ID, try finding by Exotel SID (less reliable if webhook retries)
    if (!internalCallId && callSid) {
        const call = await Call.findOne({ exotelCallSid: callSid });
        if (call) {
            internalCallId = call._id.toString();
            elevenLabsAgentId = call.elevenLabsAgentId; // Assuming you stored it
        }
    }
    
    if (!internalCallId || !elevenLabsAgentId) {
        console.error('Webhook received without identifiable internalCallId or agentId.');
        // Return a generic response or hangup if necessary, but don't crash
         return new Response('<Response><Say>An internal error occurred.</Say><Hangup/></Response>', { headers: { 'Content-Type': 'application/xml' } });
    }

    try {
        // Find the call record in your database
        const call = await Call.findById(internalCallId);
        if (!call) {
            console.error(`Call record not found for ID: ${internalCallId}`);
             return new Response('<Response><Hangup/></Response>', { headers: { 'Content-Type': 'application/xml' } });
        }

        // --- Handle Different Call Statuses ---

        if (callStatus === 'in-progress' || callStatus === 'answered') {
            console.log(`Call ${internalCallId} answered. Fetching ElevenLabs Signed URL for agent ${elevenLabsAgentId}...`);

            // Check if we already have a WebSocket URL (avoid re-fetching on potential retries)
            if (call.elevenLabsSignedUrl && call.status === 'connected') {
                 console.log(`Call ${internalCallId} already connected. Resending Connect instructions.`);
                 const xmlResponse = createExotelConnectWebSocketResponse(call.elevenLabsSignedUrl);
                 return new Response(xmlResponse, { headers: { 'Content-Type': 'application/xml' } }); // Or application/json
            }


            // 1. Fetch Signed URL from ElevenLabs
            const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
            const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${elevenLabsAgentId}`;
            
            const elResponse = await fetch(url, { headers: { 'xi-api-key': ELEVENLABS_API_KEY } });

            if (!elResponse.ok) {
                const errorText = await elResponse.text();
                console.error(`Failed to get ElevenLabs signed URL for agent ${elevenLabsAgentId}:`, errorText);
                call.status = 'failed';
                call.failureReason = 'Failed to get ElevenLabs URL';
                await call.save();
                return new Response('<Response><Say>Sorry, could not connect to the agent.</Say><Hangup/></Response>', { headers: { 'Content-Type': 'application/xml' } });
            }

            const data = await elResponse.json();
            const signedUrl = data.signed_url;

            if (!signedUrl) {
                 console.error(`ElevenLabs response missing signed_url for agent ${elevenLabsAgentId}`);
                 call.status = 'failed';
                 call.failureReason = 'ElevenLabs response missing signed_url';
                 await call.save();
                 return new Response('<Response><Say>Sorry, could not connect to the agent due to an internal error.</Say><Hangup/></Response>', { headers: { 'Content-Type': 'application/xml' } });
            }

            console.log(`Obtained Signed URL for call ${internalCallId}: ${signedUrl.substring(0, 50)}...`);

            // 2. Save Signed URL and update status in your DB
            call.elevenLabsSignedUrl = signedUrl;
            call.status = 'connected'; // Mark as connected in your system
            call.callStartTime = new Date(); // Update start time to when it connected
            await call.save();

            // 3. Respond to Exotel to connect to WebSocket
            const xmlResponse = createExotelConnectWebSocketResponse(signedUrl);
             console.log(`Responding to Exotel for call ${internalCallId} to connect to WebSocket.`);
            return new Response(xmlResponse, { headers: { 'Content-Type': 'application/xml' } }); // Adjust Content-Type if Exotel needs JSON

        } else if (['completed', 'failed', 'busy', 'no-answer'].includes(callStatus || '')) {
            console.log(`Call ${internalCallId} ended with status: ${callStatus}`);
            // Update call status and potentially duration, cost etc.
            call.status = callStatus === 'completed' ? 'ended' : (callStatus || 'failed'); // Map Exotel status
            call.callEndTime = new Date();
            // You might receive duration/cost from Exotel here too
            // const duration = formData.get('Duration');
            // if (duration) call.duration = parseInt(duration as string, 10);
            await call.save();
            // Just acknowledge Exotel, no further action needed
            return new Response('<Response></Response>', { headers: { 'Content-Type': 'application/xml' } }); 

        } else if (callStatus === 'ringing') {
             console.log(`Call ${internalCallId} is ringing.`);
             if(call.status !== 'ringing') { // Update only if not already ringing
                 call.status = 'ringing';
                 await call.save();
             }
             // No specific action needed, just acknowledge
             return new Response('<Response></Response>', { headers: { 'Content-Type': 'application/xml' } });
        } else {
             console.log(`Received unhandled Exotel status: ${callStatus} for call ${internalCallId}`);
             // Acknowledge Exotel
             return new Response('<Response></Response>', { headers: { 'Content-Type': 'application/xml' } });
        }

    } catch (error: any) {
        console.error('Error processing Exotel webhook:', error);
        // Return a generic error response to Exotel
        return new Response('<Response><Say>An error occurred processing the call.</Say><Hangup/></Response>', { headers: { 'Content-Type': 'application/xml' } });
    }
}