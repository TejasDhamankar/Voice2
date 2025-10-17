


const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
async function registerWebhook() {
  console.log("Using AGENT_ID:", AGENT_ID);

  const YOUR_PUBLIC_URL='https://tejas.tail98d2be.ts.net'; // your public URL

  if (!ELEVENLABS_API_KEY) {
    console.error('❌ Missing ELEVENLABS_API_KEY in your .env.local');
    return;
  }

  const WEBHOOK_URL = `${YOUR_PUBLIC_URL}/api/webhooks/elevenlabs`;

  console.log('Attempting to register webhook...');
  console.log(`🔗 Webhook URL: ${WEBHOOK_URL}`);

  try {
     // set in .env.local
const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}/webhooks`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'xi-api-key': ELEVENLABS_API_KEY,
  },
  body: JSON.stringify({
    url: WEBHOOK_URL,
    event_types: ['call.ended'],
  }),
});

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    console.log('\n✅ Webhook Registered Successfully!');
    console.log('🔑 Add this to your .env.local:');
    console.log(`ELEVENLABS_WEBHOOK_SECRET=${data.signing_secret}`);

  } catch (error: any) {
    console.error('\n❌ Failed to register webhook:');
    console.error(error.message);
  }
}

registerWebhook();
