    // app/api/calls/[callId]/hangup/route.ts
    import { NextRequest, NextResponse } from 'next/server';
    import connectDB from '@/lib/db';
    import Call from '@/models/callModel';
    import { getUserFromRequest } from '@/lib/jwt';
    import mongoose from 'mongoose';

    type UrlParams = {
    params: {
        callId: string;
    };
    };

    export async function POST(request: NextRequest, { params }: UrlParams) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        const userId = typeof userData === 'object' ? userData.userId : userData;
        const { callId } = params;

        if (!callId || !mongoose.Types.ObjectId.isValid(callId)) {
            return NextResponse.json({ message: 'Invalid Call ID' }, { status: 400 });
        }

        await connectDB();

        const call = await Call.findOne({ _id: callId, userId });

        if (!call) {
        return NextResponse.json({ message: 'Call not found' }, { status: 404 });
        }

        if (!call.exotelCallSid) {
            return NextResponse.json({ message: 'Exotel Call SID not found for this call.' }, { status: 400 });
        }

        // Call Exotel API to hang up the call
        const EXOTEL_ACCOUNT_SID = process.env.EXOTEL_ACCOUNT_SID!;
        const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY!;
        const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN!;
        
        const exotelApiUrl = `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Calls/${call.exotelCallSid}.json`;
        const authHeader = `Basic ${Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64')}`;

        console.log(`Sending Hangup request to Exotel for SID: ${call.exotelCallSid}`);

        const exotelResponse = await fetch(exotelApiUrl, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({ Status: 'completed' }).toString(), // 'completed' usually hangs up
        });

        if (!exotelResponse.ok) {
            const errorText = await exotelResponse.text();
            console.error("Exotel Hangup API Error:", errorText);
            // Don't necessarily fail the frontend, maybe the call already ended
            // But log the error
            return NextResponse.json({ message: `Exotel hangup error: ${errorText}` }, { status: exotelResponse.status });
        }

        console.log(`Hangup request successful for Exotel SID: ${call.exotelCallSid}`);

        // Update call status in DB (optional, webhook might do this too)
        if (call.status !== 'ended' && call.status !== 'failed') {
            call.status = 'ended'; // Mark as ended manually
            call.callEndTime = new Date();
            await call.save();
        }

        return NextResponse.json({ message: 'Hangup request sent to Exotel' });

    } catch (error: any) {
        console.error(`Error hanging up call ${params.callId}:`, error);
        return NextResponse.json({ message: 'Server error hanging up call', error: error.message }, { status: 500 });
    }
    }