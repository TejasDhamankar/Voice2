
import connectDB from '@/lib/db';
import Call from '@/models/callModel';
import Agent from '@/models/agentModel';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

export async function initiateCall(
    userId: string,
    agentId: string,
    phoneNumber: string,
    contactName: string,
    customMessage?: string
    // this 
) {
    await connectDB();

    const agent = await Agent.findOne({ userId, agentId });
    if (!agent) {
        throw new Error("Agent not found or does not belong to the user.");
    }

    const newCall = new Call({
        userId,
        agentId: agent._id,
        agentName: agent.name,
        contactName,
        phoneNumber,
        status: 'queued',
        notes: customMessage || '',
    });
    await newCall.save();

    const elevenLabsPayload = {
        agent_id: agentId,
        phone_number: phoneNumber,
        metadata: {
            call_id: newCall._id.toString(), // Your internal DB call ID
            contact_name: contactName,
            custom_message: customMessage || null
        }
    };

    const response = await fetch("https://api.elevenlabs.io/v1/calls", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify(elevenLabsPayload),
    });

    if (!response.ok) {
        const errorData = await response.text();
        newCall.status = 'failed';
        newCall.failureReason = `ElevenLabs API Error: ${errorData}`;
        await newCall.save();
        throw new Error(`Failed to initiate call via ElevenLabs: ${errorData}`);
    }

    const result = await response.json();

    // ✅ **THIS IS THE CRITICAL CHANGE**
    // Save both IDs from the ElevenLabs response to your database.
    newCall.elevenLabsCallId = result.call_id; 
    newCall.conversationId = result.conversation_id; // <-- ADD THIS LINE
    newCall.status = 'initiated';
    await newCall.save();

    return {
        message: 'Call initiated successfully.',
        callId: newCall._id,
        elevenLabsCallId: result.call_id,
        conversationId: result.conversation_id, // <-- Also return it
        status: newCall.status
    };
}