// app/api/calls/initiate-exotel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel'; // Your Mongoose Call model
import Agent from '@/models/agentModel'; // Your Mongoose Agent model
import { getUserFromRequest } from '@/lib/jwt'; // Your auth helper
// Import Exotel SDK or fetch helper (you'll need to install/create this)
// import { makeExotelCall } from '@/lib/exotel'; 

export async function POST(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);
    if (!userData) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const userId = typeof userData === 'object' ? userData.userId : userData;

    const body = await request.json();
    const { agentId, phoneNumber, contactName, customMessage } = body;

    if (!agentId || !phoneNumber || !contactName) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    await connectDB();

    // 1. Find the Agent (to get agent details if needed later)
    const agent = await Agent.findOne({ userId, agentId }); // Corrected: Query by agentId field
    if (!agent) {
      return NextResponse.json({ message: 'Agent not found' }, { status: 404 });
    }

    // 2. Create an initial Call record in your DB (status: 'initiating')
    const newCall = new Call({
      userId,
      agentId: agent._id, // Store your DB reference if you have one
      elevenLabsAgentId: agent.agentId, // Corrected: Use agent.agentId from the found agent
      agentName: agent.name,
      contactName,
      phoneNumber,
      status: 'initiating', // New initial status
      notes: customMessage || '',
      callStartTime: new Date(), // Mark when the attempt started
    });
    await newCall.save();

    // 3. Prepare Exotel API Call
    // You'll need your Exotel Account SID, API Key/Token from Exotel dashboard
    const EXOTEL_ACCOUNT_SID = process.env.EXOTEL_ACCOUNT_SID!;
    const EXOTEL_API_KEY = process.env.EXOTEL_API_KEY!;
    const EXOTEL_API_TOKEN = process.env.EXOTEL_API_TOKEN!;
    const EXOTEL_CALLER_ID = process.env.EXOTEL_CALLER_ID!; // Your verified Exotel number

    // Log environment variables (masking sensitive parts)
    console.log(`Exotel Config: Account SID: ${EXOTEL_ACCOUNT_SID}, Caller ID: ${EXOTEL_CALLER_ID}`);
    console.log(`Exotel API Key (first 5 chars): ${EXOTEL_API_KEY.substring(0, 5)}...`);
    console.log(`Exotel API Token (first 5 chars): ${EXOTEL_API_TOKEN.substring(0, 5)}...`);

    // Define the two separate webhook URLs
    const connectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/exotel/connect`;
    const statusCallbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/exotel/webhook`;

    const exotelPayload = {
      CallerId: EXOTEL_CALLER_ID, // Can often be the same as From
      // This URL is hit with a POST request when the call is answered. It must return ExoML.
      Url: connectUrl,
      // Method is inferred by the <Connect> applet being POST
      // This URL is hit with status updates (ringing, completed, etc.).
      StatusCallback: statusCallbackUrl,
      StatusCallbackMethod: "GET", // The method for the 'StatusCallback' URL
      // Pass your internal call ID and agent ID to the webhook
      CustomField: JSON.stringify({ 
          internalCallId: newCall._id.toString(),
          elevenLabsAgentId: agent.agentId // Corrected: Use agent.agentId from the found agent
      }), 
      // Add other Exotel options if needed (recording etc.)
    };

    // 4. Make the API Call to Exotel to initiate the call
    // Replace with your actual Exotel API call logic (using fetch or an SDK)
    const exotelApiUrl = `https://api.exotel.com/v1/Accounts/${EXOTEL_ACCOUNT_SID}/Calls/connect.json?From=${EXOTEL_CALLER_ID}&To=${phoneNumber}`;
    const authHeader = `Basic ${Buffer.from(`${EXOTEL_API_KEY}:${EXOTEL_API_TOKEN}`).toString('base64')}`;
    
    console.log("Exotel API URL:", exotelApiUrl);
    console.log("Authorization Header:", authHeader.substring(0, 30) + "..."); // Masking most of the token
    console.log("Initiating Exotel Call with payload:", exotelPayload);
    const requestBody = new URLSearchParams(exotelPayload as any).toString();
    console.log("Exotel Request Body (form-urlencoded):", requestBody);

    const exotelResponse = await fetch(exotelApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: requestBody,
    });

    if (!exotelResponse.ok) {
        const errorText = await exotelResponse.text();
        console.error("Exotel API Error:", errorText);
        newCall.status = 'failed';
        newCall.failureReason = `Exotel initiation failed: ${errorText}`;
        console.error(`Exotel Response Status: ${exotelResponse.status}`);
        console.error(`Exotel Response Status Text: ${exotelResponse.statusText}`);
        await newCall.save();
        return NextResponse.json({ message: `Exotel error: ${errorText}` }, { status: exotelResponse.status });
    }

    const exotelResult = await exotelResponse.json();
    const exotelCallSid = exotelResult.Call.Sid; // Get the Call SID from Exotel response

    console.log("Exotel Call Initiated:", exotelResult);

    // 5. Update your Call record with Exotel's Call SID
    newCall.exotelCallSid = exotelCallSid;
    newCall.status = 'ringing'; // Update status
    await newCall.save();

    // 6. Respond to Frontend
    // Send back your internal Call ID so the frontend can poll for status/URL
    return NextResponse.json({ 
        message: 'Call initiated via Exotel', 
        callId: newCall._id.toString(), // Your DB call ID
        exotelCallSid: exotelCallSid,
        initialStatus: 'ringing'
    });

  } catch (error: any) {
    console.error('Error initiating Exotel call:', error);
    return NextResponse.json({ message: 'Server error initiating call', error: error.message }, { status: 500 });
  }
}