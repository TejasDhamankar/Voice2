import connectDB from '@/lib/db';
import Agent from '@/models/agentModel';
import KnowledgeDocument from '@/models/knowledgeModel';

export async function syncGlobalKnowledgeToAgent(agentId: string, userId: string) {
  try {
    await connectDB();

    // Get all global knowledge documents for this user
    const globalDocs = await KnowledgeDocument.find({ userId, isGlobal: true });

    // Get the agent
    const agent = await Agent.findOne({ agentId, userId });
    if (!agent) {
      throw new Error('Agent not found');
    }

    // Get existing knowledge documents to avoid duplicates
    const existingDocIds = agent.knowledgeDocuments?.map((doc: any) => doc.document_id) || [];

    // Filter out global docs that are already in the agent
    const newGlobalDocs = globalDocs.filter(doc =>
      doc.elevenLabsDocumentId && !existingDocIds.includes(doc.elevenLabsDocumentId)
    );

    if (newGlobalDocs.length === 0) {
      return { synced: 0, message: 'No new global documents to sync' };
    }

    // Format the new documents
    const formattedDocs = newGlobalDocs.map(doc => ({
      document_id: doc.elevenLabsDocumentId,
      name: doc.name,
      type: doc.type,
      content: doc.content,
      url: doc.url,
      created_at: doc.uploadedAt
    }));

    // Update the agent's knowledge documents
    const updatedKnowledgeDocs = [...(agent.knowledgeDocuments || []), ...formattedDocs];

    await Agent.findOneAndUpdate(
      { agentId, userId },
      { knowledgeDocuments: updatedKnowledgeDocs },
      { new: true }
    );

    // Update the knowledge documents to include this agent in their agentIds
    await KnowledgeDocument.updateMany(
      {
        userId,
        isGlobal: true,
        elevenLabsDocumentId: { $in: newGlobalDocs.map(doc => doc.elevenLabsDocumentId) },
        agentIds: { $ne: agent._id }
      },
      { $push: { agentIds: agent._id } }
    );

    console.log(`Synced ${newGlobalDocs.length} global documents to agent ${agentId}`);

    return {
      synced: newGlobalDocs.length,
      documents: formattedDocs,
      message: `Synced ${newGlobalDocs.length} global documents`
    };

  } catch (error) {
    console.error('Error syncing global knowledge to agent:', error);
    throw error;
  }
}

export async function syncGlobalKnowledgeToAllAgents(userId: string) {
  try {
    await connectDB();

    // Get all agents for this user
    const agents = await Agent.find({ userId });

    if (agents.length === 0) {
      return { totalSynced: 0, agentsSynced: 0, message: 'No agents found' };
    }

    let totalSynced = 0;
    let agentsSynced = 0;
    const results = [];

    for (const agent of agents) {
      try {
        const result = await syncGlobalKnowledgeToAgent(agent.agentId, userId);
        if (result.synced > 0) {
          totalSynced += result.synced;
          agentsSynced++;
        }
        results.push({ agentId: agent.agentId, agentName: agent.name, ...result });
      } catch (error) {
        console.error(`Error syncing to agent ${agent.agentId}:`, error);
        results.push({
          agentId: agent.agentId,
          agentName: agent.name,
          synced: 0,
          error: error.message
        });
      }
    }

    return {
      totalSynced,
      agentsSynced,
      totalAgents: agents.length,
      results,
      message: `Synced ${totalSynced} documents across ${agentsSynced} agents`
    };

  } catch (error) {
    console.error('Error syncing global knowledge to all agents:', error);
    throw error;
  }
}

export async function updateElevenLabsAgentKnowledge(agentId: string, knowledgeDocuments: any[]) {
  try {
    const patch = {
      conversation_config: {
        agent: {
          prompt: {
            knowledge_base: knowledgeDocuments
              .filter(doc => doc.document_id)
              .map(doc => ({
                id: doc.document_id,
                document_id: doc.document_id,
                name: doc.name,
                type: doc.type
              }))
          }
        }
      }
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify(patch),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs knowledge sync error:", errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const result = await response.json();
    console.log("ElevenLabs agent knowledge updated successfully");
    return result;

  } catch (error) {
    console.error("Error updating ElevenLabs agent knowledge:", error);
    throw error;
  }
}
