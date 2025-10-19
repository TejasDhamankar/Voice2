// app/api/calls/[callId]/status/route.ts
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

    // Return relevant status information, including the signed URL if available
    return NextResponse.json({
      status: call.status,
      signedUrl: call.elevenLabsSignedUrl || null, // Send URL only when connected
      callSid: call.exotelCallSid || null,
      failureReason: call.failureReason || null,
      // Add other relevant fields if needed
    });

  } catch (error: any) {
    console.error(`Error fetching status for call ${params.callId}:`, error);
    return NextResponse.json({ message: 'Server error fetching call status', error: error.message }, { status: 500 });
  }
}