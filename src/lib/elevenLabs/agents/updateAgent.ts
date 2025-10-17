// /lib/elevenlabs/agent/updateAgent.ts

import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";
import { sanitizeAgentConfigForEL } from "./utils";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

export async function updateAgent(agentId: string, updates: any) {
  await connectDB();

  const agent = await Agent.findById(agentId);
  if (!agent) throw new Error("Agent not found");

  const sanitizedData = sanitizeAgentConfigForEL(updates);

  await fetch(`https://api.elevenlabs.io/v1/agents/${agent.elevenlabsAgentId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": ELEVENLABS_API_KEY,
    },
    body: JSON.stringify(sanitizedData),
  });

  Object.assign(agent, updates);
  await agent.save();

  return agent;
}
