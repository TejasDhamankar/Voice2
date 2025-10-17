import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/jwt"; // Assuming this is your JWT helper
import Agent from "@/models/agentModel"; // Your Mongoose model
import connectDB from "@/lib/db";

/**
 * GET a single agent by its ID
 * This function is called by the EditAgentPage to fetch the agent's initial data.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();
        
        // FIX: Use params.id to match the folder name '[id]' in your route.
        const agent = await Agent.findOne({ agentId: params.id, userId: user.userId });

        if (!agent) {
            return NextResponse.json({ message: "Agent not found" }, { status: 404 });
        }

        return NextResponse.json({ agent });

    } catch (error) {
        console.error("Error fetching agent:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

/**
 * UPDATE an agent by its ID
 * This function is called when the user saves changes on the EditAgentPage.
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        
        await connectDB();
        
        // FIX: Use params.id to find the correct agent to update.
        const updatedAgent = await Agent.findOneAndUpdate(
            { agentId: params.id, userId: user.userId },
            { $set: body }, // Update agent with the new data from the form
            { new: true }   // Return the updated document
        );

        if (!updatedAgent) {
            return NextResponse.json({ message: "Agent not found or update failed" }, { status: 404 });
        }

        // TODO: Add a call to the ElevenLabs API here to update the external agent as well.
        // Example: await updateElevenLabsAgent(params.id, body);

        return NextResponse.json({ message: "Agent updated successfully", agent: updatedAgent });

    } catch (error) {
        console.error("Error updating agent:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}

/**
 * DELETE an agent by its ID
 * This function is called from your main AgentsPage when a user confirms deletion.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user || !user.userId) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectDB();

        // FIX: Use params.id to find the correct agent to delete.
        const deletedAgent = await Agent.findOneAndDelete({
            agentId: params.id,
            userId: user.userId
        });

        if (!deletedAgent) {
            return NextResponse.json({ message: "Agent not found" }, { status: 404 });
        }

        // TODO: Add a call to the ElevenLabs API to delete the external agent.
        // Example: await deleteElevenLabsAgent(params.id);

        return NextResponse.json({ message: "Agent deleted successfully" });

    } catch (error) {
        console.error("Error deleting agent:", error);
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}