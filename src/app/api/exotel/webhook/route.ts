// /api/exotel/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call, { ICall } from '@/models/callModel'; // Your Mongoose Call model

// This function is NO LONGER expected to return ExoML to control the call via Passthru GET response,
// based on the provided documentation focusing on metadata reporting.
// It will now just return a standard success response code if processing is okay.
// function createExotelConnectWebSocketResponse(webSocketUrl: string): string { ... } // REMOVED

export async function GET(request: NextRequest) { // Changed to GET
    await connectDB();
    
    // --- Parse Query Parameters ---
    const queryParams = request.nextUrl.searchParams;
    const allParams: { [key: string]: string | string[] } = {}; // Store all params for logging

    // Iterate through all query parameters
    queryParams.forEach((value, key) => {
        // Handle potential nested keys like Stream[Status] by storing them as is
        if (allParams[key]) {
            // Handle multiple values for the same key if needed (though less common here)
            if (Array.isArray(allParams[key])) {
                (allParams[key] as string[]).push(value);
            } else {
                allParams[key] = [allParams[key] as string, value];
            }
        } else {
            allParams[key] = value;
        }
    });

    console.log("Exotel Webhook (GET) - Received Query Params:", allParams);

    // --- Extract Key Information ---
    const callStatus = queryParams.get('CallStatus') as string | null; // Standard Exotel status
    const callSid = queryParams.get('CallSid') as string | null;
    const customFieldString = queryParams.get('CustomField') as string | null;
    const streamStatus = queryParams.get('Stream[Status]') as string | null; // Specific stream status
    const streamSid = queryParams.get('Stream[StreamSID]') as string | null;
    const streamUrl = queryParams.get('Stream[StreamUrl]') as string | null; // URL Exotel *tried* to stream TO (if applicable)
    const streamError = queryParams.get('Stream[Error]') as string | null;
    const streamDisconnectedBy = queryParams.get('Stream[DisconnectedBy]') as string | null;
    const streamDuration = queryParams.get('Stream[Duration]') as string | null;

     // --- Logic to Identify Call (remains similar) ---
    let internalCallId: string | null = null;
    let elevenLabsAgentId: string | null = null; // Still needed if we fetch URL here

    if (customFieldString) { 
        try {
            const customData = JSON.parse(customFieldString);
            internalCallId = customData.internalCallId;
            elevenLabsAgentId = customData.elevenLabsAgentId; // Agent ID passed during initiation
            console.log(`Parsed CustomField: internalCallId=${internalCallId}, elevenLabsAgentId=${elevenLabsAgentId}`);
        } catch (e) { console.error("Failed to parse CustomField:", customFieldString, e); }
    }
    
    if (!internalCallId && callSid) { 
         console.log(`Internal Call ID missing, attempting lookup by Exotel SID: ${callSid}`);
         const call = await Call.findOne({ exotelCallSid: callSid });
        if (call) {
            internalCallId = call._id.toString();
            elevenLabsAgentId = call.elevenLabsAgentId; 
            console.log(`Found call ${internalCallId} via Exotel SID.`);
        } else { console.warn(`No call found matching Exotel SID: ${callSid}`); }
    }
    
    if (!internalCallId) { 
        console.error(`Webhook error: Could not determine internalCallId. CallSid: ${callSid}`);
        // Cannot update DB without ID. Respond with error code (though Passthru might ignore it).
        // Returning 200 OK might be safer to prevent Exotel retries.
        return new Response("Error: Missing call identifier", { status: 400 }); // Or maybe 200 OK
    }

    try {
        const call = await Call.findById(internalCallId);
        if (!call) { 
            console.error(`Webhook error: Call record not found for internal ID: ${internalCallId}. Exotel SID: ${callSid}`);
            return new Response("Error: Call record not found", { status: 404 }); // Or maybe 200 OK
        }

        console.log(`Processing webhook for call ${internalCallId}. Exotel Status: ${callStatus}. Stream Status: ${streamStatus}. Current DB Status: ${call.status}`);

        // --- Update DB based on received status ---
        let updatedStatus: ICall['status'] | null = null;
        let needsSave = false;

        // Prioritize Stream status if available for final states
        if (streamStatus === 'completed' || callStatus === 'completed') {
            updatedStatus = 'ended';
        } else if (streamStatus === 'failed' || callStatus === 'failed') {
            updatedStatus = 'failed';
            call.failureReason = streamError || call.failureReason || 'Exotel reported failure';
        } else if (streamStatus === 'cancelled') {
             updatedStatus = call.status === 'connected' ? 'ended' : 'failed'; // If connected then cancelled, likely user hangup. If not, failed setup.
             call.failureReason = call.failureReason || `Stream cancelled by ${streamDisconnectedBy || 'unknown'}`;
        } else if (callStatus === 'busy') {
            updatedStatus = 'busy';
        } else if (callStatus === 'no-answer') {
            updatedStatus = 'no-answer';
        } else if (callStatus === 'answered' || callStatus === 'in-progress') {
             // If we get 'answered' but don't have a URL yet, maybe fetch it here?
             // BUT the Passthru might not trigger exactly on answer if placed *after* a Stream applet.
             if (!call.elevenLabsSignedUrl && call.status !== 'connected' && elevenLabsAgentId) {
                  console.log(`Call ${internalCallId} answered/in-progress, attempting to fetch Signed URL *now*...`);
                  // *** ATTENTION: This fetch might be too late if Passthru runs *after* Stream fails/ends ***
                  // *** It's better if the Stream applet itself gets the URL somehow ***
                  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
                  const url = `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${elevenLabsAgentId}`;
                  try {
                      const elResponse = await fetch(url, { headers: { 'xi-api-key': ELEVENLABS_API_KEY } });
                      if (elResponse.ok) {
                          const data = await elResponse.json();
                           if (data.signed_url) {
                              console.log(`Fetched Signed URL for ${internalCallId} during webhook processing.`);
                              call.elevenLabsSignedUrl = data.signed_url;
                              call.status = 'connected'; // Optimistically set status
                              if (!call.callStartTime) call.callStartTime = new Date();
                              needsSave = true; 
                              // We CANNOT send instructions back to Exotel via this GET response per docs.
                              // How does Exotel's Stream applet GET this URL? This is the missing piece.
                           } else { throw new Error("ElevenLabs response missing signed_url"); }
                      } else { throw new Error(`ElevenLabs API error: ${elResponse.status}`); }
                  } catch (fetchErr: any) {
                      console.error(`Failed to get Signed URL during webhook for ${internalCallId}:`, fetchErr.message);
                      updatedStatus = 'failed';
                      call.failureReason = `Failed to get agent stream URL: ${fetchErr.message}`;
                  }
             } else if (call.status === 'ringing' || call.status === 'initiating') {
                 // Update status if it just got answered
                 updatedStatus = 'answered'; // Or maybe 'in-progress'
             }
        } else if (callStatus === 'ringing') {
             if (call.status === 'initiating' || call.status === 'queued') {
                updatedStatus = 'ringing';
             }
        }

        // Apply status update if changed
        if (updatedStatus && call.status !== updatedStatus) {
            call.status = updatedStatus;
            needsSave = true;
            console.log(`Webhook updating call ${internalCallId} status to ${updatedStatus}`);
        }

        // Update end time and duration for terminal states
        if (['ended', 'failed', 'busy', 'no-answer'].includes(call.status) && !call.callEndTime) {
            call.callEndTime = new Date();
             const durationVal = streamDuration || queryParams.get('Duration') as string | null;
            if (durationVal && !isNaN(parseInt(durationVal))) {
                call.duration = parseInt(durationVal, 10);
            }
            needsSave = true;
            console.log(`Webhook setting end time for call ${internalCallId}. Duration: ${call.duration ?? 'N/A'}`);
        }
        
        // Save if any changes were made
        if (needsSave) {
            await call.save();
        }

        // --- Respond to Exotel ---
        // Since we cannot send ExoML back in response to GET Passthru according to docs,
        // we just return 200 OK to acknowledge receipt.
        console.log(`Webhook for call ${internalCallId} processed. Responding 200 OK.`);
        // Exotel documentation for Sync Passthru mentions 200 or 302. Let's use 200.
        return new Response("OK", { status: 200 }); 
        // If the Passthru *was* Async, an empty XML <Response/> might be better.
        // return new Response('<Response></Response>', { headers: { 'Content-Type': 'application/xml; charset=utf-8' }, status: 200 });

    } catch (error: any) { 
        console.error(`Webhook CRITICAL error for call ${internalCallId || callSid || 'UNKNOWN'}:`, error);
        // Even on internal errors, respond 200 OK to prevent Exotel retries if Passthru is Sync
        return new Response("Internal Server Error", { status: 500 }); // Or maybe 200 OK
    }
}