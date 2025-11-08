// app/api/calls/[callId]/route.ts
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

/**
 * GET /api/calls/[callId]
 * Fetches the status of a specific call.
 */
export async function GET(request: NextRequest, { params }: UrlParams) {
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

    return NextResponse.json({
      status: call.status,
      signedUrl: call.elevenLabsSignedUrl || null,
      callSid: call.exotelCallSid || null,
      failureReason: call.failureReason || null,
    });

  } catch (error: any) {
    console.error(`Error fetching status for call ${params.callId}:`, error);
    return NextResponse.json({ message: 'Server error fetching call status', error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/calls/[callId]
 * Hangs up a specific call.
 */
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

    // --- Full Exotel Hangup Logic ---
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
        body: new URLSearchParams({ Status: 'completed' }).toString(),
    });

    if (!exotelResponse.ok) {
        const errorText = await exotelResponse.text();
        console.error("Exotel Hangup API Error:", errorText);
        return NextResponse.json({ message: `Exotel hangup error: ${errorText}` }, { status: exotelResponse.status });
    }

    console.log(`Hangup request successful for Exotel SID: ${call.exotelCallSid}`);

    call.status = 'ended';
    await call.save();

    return NextResponse.json({ message: 'Hangup request sent to Exotel' });

  } catch (error: any) {
    console.error(`Error processing POST for call ${params.callId}:`, error);
    return NextResponse.json({ message: 'Server error processing request', error: error.message }, { status: 500 });
  }
}