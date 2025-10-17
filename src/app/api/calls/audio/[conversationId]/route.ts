import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/jwt';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

// ✅ THE FIX IS HERE: The function now accepts 'context' as the second argument
export async function GET(request: NextRequest, context: { params: { conversationId: string } }) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Access conversationId from the context object's params
        const { conversationId } = context.params;
        if (!conversationId) {
            return new NextResponse('Conversation ID is required', { status: 400 });
        }
        
        const response = await fetch(`https://api.elevenlabs.io/v1/conversations/${conversationId}/audio`, {
            headers: { 'xi-api-key': ELEVENLABS_API_KEY },
        });

        if (!response.ok || !response.body) {
            const errorText = await response.text();
            console.error(`Failed to fetch audio from ElevenLabs for ${conversationId}:`, errorText);
            return new NextResponse(`Failed to fetch audio from provider: ${errorText}`, { status: response.status });
        }
        
        return new NextResponse(response.body, {
            headers: { 'Content-Type': 'audio/mpeg' },
        });
    } catch (error) {
        console.error("Error in audio route:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}