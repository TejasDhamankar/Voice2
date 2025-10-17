// /lib/elevenlabs/agent/deleteAgent.ts

import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

export async function deleteAgent(agentId: string) {
  await connectDB();

  const agent = await Agent.findById(agentId);
  if (!agent) throw new Error("Agent not found");

  await fetch(`https://api.elevenlabs.io/v1/agents/${agent.elevenlabsAgentId}`, {
    method: "DELETE",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
    },
  });

  await agent.deleteOne();

  return { message: "Agent deleted successfully" };
}
