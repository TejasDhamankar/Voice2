import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/jwt';
import { initiateCall } from '@/lib/elevenLabs';

export async function POST(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { agentId, contacts } = await request.json();

        if (!agentId || !Array.isArray(contacts) || contacts.length === 0) {
            return NextResponse.json({ message: 'Agent ID and a list of contacts are required' }, { status: 400 });
        }

        let initiatedCount = 0;
        
        for (const contact of contacts) {
            try {
                await initiateCall(
                    userData.userId,
                    agentId,
                    contact.phoneNumber,
                    contact.name,
                );
                initiatedCount++;
            } catch (callError) {
                console.error(`Failed to initiate call for ${contact.name}:`, callError);
            }
        }

        return NextResponse.json({
            message: `Successfully initiated ${initiatedCount} of ${contacts.length} calls.`,
            initiated: initiatedCount,
        });

    } catch (error: any) {
        console.error('Error in POST /api/calls/batch:', error);
        return NextResponse.json({ message: 'Failed to start batch calls', error: error.message }, { status: 500 });
    }
}