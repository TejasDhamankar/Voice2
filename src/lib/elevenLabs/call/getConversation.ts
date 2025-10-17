// /lib/elevenlabs/call/getConversation.ts

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

export async function getConversation(agentId: string) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/agents/${agentId}/conversations`,
    {
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
      },
    }
  );

  const data = await response.json();
  return data;
}
