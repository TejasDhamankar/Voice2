import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel';
import { getUserFromRequest } from '@/lib/jwt';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

export async function GET(request: NextRequest, { params }: { params: { conversationId: string } }) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { conversationId } = params;
        if (!conversationId) {
            return NextResponse.json({ message: 'Conversation ID is required' }, { status: 400 });
        }

        // ✅ FIXED: Fetch from the correct /conversations/{id} endpoint
        const response = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`, {
            headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch conversation details from ElevenLabs: ${errorText}`);
        }

        const details = await response.json();

        await connectDB();
        
        // ✅ FIXED: Find the document in our DB using conversationId
        await Call.findOneAndUpdate(
            { conversationId: conversationId, userId: userData.userId }, 
            {
                $set: {
                    summary: details.summary || '',
                    // The Twilio API returns transcription in a 'messages' array, so we format it
                    transcription: details.messages ? details.messages.map((m: any) => `${m.role}: ${m.text}`).join('\n') : '',
                    outcome: details.outcome || 'No Outcome',
                    status: details.status || 'completed',
                    duration: details.duration_seconds || 0
                }
            }
        );

        return NextResponse.json(details);

    } catch (error: any) {
        console.error("Error in /api/calls/details/[conversationId]:", error);
        return NextResponse.json({ message: 'Failed to fetch call details', error: error.message }, { status: 500 });
    }
}