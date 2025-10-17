import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel';
import Contact from '@/models/contactModel';
import Agent from '@/models/agentModel';
import { getUserFromRequest } from '@/lib/jwt';
import { initiateCall } from '@/lib/elevenLabs'; // Assuming this is your service function
import { parse } from 'csv-parse/sync';

export async function GET(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const url = new URL(request.url);
        const limit = parseInt(url.searchParams.get('limit') || '10');

        const calls = await Call.find({ userId: userData.userId })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean(); // Use .lean() for faster, plain JS objects

        return NextResponse.json({ calls });
    } catch (error: any) {
        console.error('Error fetching calls:', error);
        return NextResponse.json({ message: 'Failed to fetch calls', error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { agentId, phoneNumber, contactName, customMessage } = body;

        if (!agentId || !phoneNumber || !contactName) {
            return NextResponse.json({ message: 'Agent, Phone Number, and Name are required' }, { status: 400 });
        }

        const result = await initiateCall(userData.userId, agentId, phoneNumber, contactName);
        
        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Error in POST /api/calls:', error);
        return NextResponse.json({ message: 'Failed to initiate call', error: error.message }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const agentId = formData.get('agentId') as string;

        if (!file || !agentId) {
            return NextResponse.json({ message: 'File and agent ID are required' }, { status: 400 });
        }
        
        await connectDB();
        
        const agent = await Agent.findOne({ userId: userData.userId, agentId: agentId });
        if (!agent) {
            return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const records = parse(buffer, { columns: true, skip_empty_lines: true });

        const results = { created: 0, skipped: 0, failed: 0 };
        const uploadedContacts = [];

        for (const record of records) {
            const name = record.name || record.Name;
            const phone = record.phone || record.Phone || record.phoneNumber;
            const customMessage = record.message || record.customMessage;

            if (!name || !phone) {
                results.skipped++;
                continue;
            }
            
            // This is what the frontend expects for the batch call
            uploadedContacts.push({ name, phoneNumber: phone, customMessage });
            results.created++;
        }

        return NextResponse.json({
            message: `Processed ${records.length} contacts from CSV.`,
            results,
            uploadedContacts,
        });
    } catch (error: any) {
        console.error('Error processing CSV:', error);
        return NextResponse.json({ message: 'Failed to process CSV', error: error.message }, { status: 500 });
    }
}