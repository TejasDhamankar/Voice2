import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = params;

    const agent = await Agent.findOne({ agentId: id });

    if (!agent) {
      return NextResponse.json({ message: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching agent:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
