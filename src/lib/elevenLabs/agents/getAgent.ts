// /lib/elevenlabs/agent/getAgent.ts

import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";

export async function getAgent(agentId: string) {
  await connectDB();
  const agent = await Agent.findById(agentId);
  if (!agent) throw new Error("Agent not found");
  return agent;
}
