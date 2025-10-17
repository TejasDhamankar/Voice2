import mongoose from "mongoose";
import connectDB from "./db";
import Agent from "@/models/agentModel";
import callModel from "@/models/callModel";
import KnowledgeDocument from "@/models/knowledgeModel"; // Import the model
import { getDefaultSystemTools, combineTools } from "./systemTools";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;
const ELEVENLABS_PHONE_ID = process.env.ELEVENLABS_PHONE_ID!;

type AnyObj = Record<string, any>;

function buildBuiltInTools(agentData: AnyObj) {
  const bi: AnyObj = {};
  if (agentData.enableEndCall !== false) {
    bi.end_call = { type: "system", name: "end_call", params: { system_tool_type: "end_call" } };
  }
  if (agentData.enableLanguageDetection) {
    bi.language_detection = { type: "system", name: "language_detection", params: { system_tool_type: "language_detection" } };
  }
  if (agentData.enableTransferToAgent) {
    bi.transfer_to_agent = { type: "system", name: "transfer_to_agent", params: { system_tool_type: "transfer_to_agent", transfers: agentData.transferToAgentTransfers || [] } };
  }
  if (agentData.enableTransferToNumber) {
    bi.transfer_to_number = { type: "system", name: "transfer_to_number", params: { system_tool_type: "transfer_to_number", transfers: agentData.transferToNumberTransfers || [] } };
  }
  if (agentData.enableSkipTurn) {
    bi.skip_turn = { type: "system", name: "skip_turn", params: { system_tool_type: "skip_turn" } };
  }
  if (agentData.enableKeypadTouchTone) {
    bi.play_keypad_touch_tone = { type: "system", name: "play_keypad_touch_tone", params: { system_tool_type: "play_keypad_touch_tone" } };
  }
  if (agentData.enableVoicemailDetection) {
    bi.voicemail_detection = { type: "system", name: "voicemail_detection", params: { system_tool_type: "voicemail_detection", voicemail_message: agentData.voicemailMessage ?? null } };
  }
  return bi;
}

function sanitizeAgentConfigForEL(cfg: AnyObj) {
  const prompt = cfg?.conversation_config?.agent?.prompt;
  if (prompt?.knowledge_base) {
    prompt.knowledge_base = (prompt.knowledge_base as AnyObj[]).map((d) => ({
      id: d.id ?? d.document_id,
      name: d.name,
      type: d.type,
      usage_mode: d.usage_mode ?? "auto",
    }));
  }
  if (prompt && typeof prompt.max_tokens !== "undefined" && prompt.max_tokens <= 0) {
    delete prompt.max_tokens;
  }
  if (prompt?.tools?.length) {
    prompt.tools = (prompt.tools as AnyObj[]).filter((t) => t?.type !== "system");
  }
  const tts = cfg?.conversation_config?.tts;
  if (tts) {
    tts.optimize_streaming_latency = String(
      tts.optimize_streaming_latency ?? "3"
    );
  }
  return cfg;
}

export async function createAgent(agentData: AnyObj) {
  try {
    await connectDB();
    const { userId } = agentData;

    // --- Start: Knowledge Document Processing Logic ---
    const globalDocs = await KnowledgeDocument.find({ userId, isGlobal: true });
    let processedKnowledgeDocuments = globalDocs.map(doc => ({
      document_id: doc.elevenLabsDocumentId,
      name: doc.name,
      type: doc.type,
    })).filter(doc => doc.document_id);

    if (agentData.knowledge_documents && agentData.knowledge_documents.length > 0) {
      for (const doc of agentData.knowledge_documents) {
        if (!doc.content && !doc.url && !doc.file) continue;

        const elevenLabsFormData = new FormData();
        let elevenLabsDocumentId = null;

        if (doc.type === 'file' && doc.file) {
          elevenLabsFormData.append("file", doc.file as Blob, doc.name);
          elevenLabsFormData.append("name", doc.name || "File Document");
        } else if (doc.type === 'url' && doc.url) {
          elevenLabsFormData.append("url", doc.url);
          elevenLabsFormData.append("name", doc.name || "URL Document");
        } else if (doc.type === 'text' && doc.content) {
          const tempFile = new Blob([doc.content], { type: "text/plain" });
          elevenLabsFormData.append("file", tempFile, doc.name || "content.txt");
          elevenLabsFormData.append("name", doc.name || "Text Document");
        } else {
            continue;
        }

        const kbRes = await fetch("https://api.elevenlabs.io/v1/knowledge-base/documents", {
          method: "POST",
          headers: { "xi-api-key": ELEVENLABS_API_KEY },
          body: elevenLabsFormData
        });

        if (kbRes.ok) {
          const kbData = await kbRes.json();
          elevenLabsDocumentId = kbData.id || kbData.document_id;
          processedKnowledgeDocuments.push({ document_id: elevenLabsDocumentId, name: doc.name, type: doc.type });

          const knowledgeDoc = new KnowledgeDocument({
            userId,
            name: doc.name || 'Document',
            type: doc.type,
            content: doc.type === 'text' ? doc.content : undefined,
            url: doc.type === 'url' ? doc.url : undefined,
            elevenLabsDocumentId,
            isGlobal: false,
          });
          await knowledgeDoc.save();
        } else {
          console.error("Failed to upload knowledge doc to ElevenLabs:", await kbRes.text());
        }
      }
    }
    // --- End: Knowledge Document Processing Logic ---

    // --- FIX: Dynamically set ASR model based on language ---
    const effectiveLanguage = agentData.language || "en";
    const asrModel = effectiveLanguage === 'en' ? 'eleven_turbo_v2' : 'nova-2-general';

    const allTools = combineTools(agentData.tools || []);
    const builtInTools = buildBuiltInTools(agentData);
    const ttsModel = agentData.ttsModel || "eleven_turbo_v2_5";

    const agentConfig: AnyObj = {
      name: agentData.name,
      conversation_config: {
        agent: {
          first_message: agentData.first_message,
          language: effectiveLanguage,
          prompt: {
            prompt: agentData.system_prompt,
            llm: agentData.llm_model || "gpt-4o-mini",
            temperature: agentData.temperature || 0.3,
            knowledge_base: processedKnowledgeDocuments,
            tools: allTools.filter((t: AnyObj) => t?.type !== "system"),
            built_in_tools: builtInTools,
          },
        },
        tts: {
          model_id: ttsModel,
          voice_id: agentData.voice_id,
        },
        asr: {
          model: asrModel,
        },
        conversation: {
          max_duration_seconds: agentData.max_duration_seconds || 1800,
        },
      },
    };

    const cleanConfig = sanitizeAgentConfigForEL(agentConfig);

    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "xi-api-key": ELEVENLABS_API_KEY },
        body: JSON.stringify(cleanConfig),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ElevenLabs API Error (${response.status}): ${errorText}`);
    }

    const elevenLabsAgent = await response.json();
    
    const agent = new Agent({
        ...agentData,
        agentId: elevenLabsAgent.agent_id,
        systemTools: getDefaultSystemTools(),
        knowledgeDocuments: processedKnowledgeDocuments,
    });
    await agent.save();
    
    await KnowledgeDocument.updateMany(
        { elevenLabsDocumentId: { $in: processedKnowledgeDocuments.map(d => d.document_id).filter(Boolean) } },
        { $addToSet: { agentIds: agent._id } }
    );

    return {
      agent_id: elevenLabsAgent.agent_id,
      name: agentData.name,
      message: "AI agent created successfully.",
    };
  } catch (error: any) {
    console.error("Error creating agent in service:", error);
    throw error;
  }
}

// --- Other functions remain unchanged ---

export async function getAgent(agentId: string) {
  try {
    await connectDB();
    const agent = await Agent.findOne({ agentId });
    if (!agent) throw new Error("Agent not found");
    return agent;
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
}

export async function updateAgent(agentId: string, updates: any) {
  try {
    console.log(`Updating agent ${agentId}`);
    // ... your existing update logic
    return { success: true };
  } catch (error) {
    console.error(`Error updating agent ${agentId}:`, error);
    throw error;
  }
}

export async function deleteAgent(agentId: string) {
  try {
    await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
      method: "DELETE",
      headers: { "xi-api-key": ELEVENLABS_API_KEY },
    });

    await connectDB();
    await Agent.deleteOne({ agentId });
    return { success: true };
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
}

export async function initiateCall(
  userId: string,
  agentId: string,
  phoneNumber: string,
  contactName: string
) {
  try {
    await connectDB();
    const agent = await Agent.findOne({ agentId, userId });
    if (!agent) throw new Error(`Agent not found with ID: ${agentId}`);

    let formatted = phoneNumber.trim().replace(/[\s\-()]/g, "");
    if (!formatted.startsWith("+")) {
      formatted = `+91${formatted}`; // Assuming default country code
    }

    const callPayload = {
      agent_id: agent.agentId,
      agent_phone_number_id: ELEVENLABS_PHONE_ID,
      to_number: formatted,
      conversation_initiation_client_data: {
        type: "conversation_initiation_client_data",
        dynamic_variables: {
          contact_name: contactName,
        },
      },
    };

    const resp = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound_call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(callPayload),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`ElevenLabs API error (${resp.status}): ${errText}`);
    }

    const data = await resp.json();
    
    await callModel.create({
      userId,
      agentId: agent._id,
      phoneNumber: formatted,
      direction: "outbound",
      status: "initiated",
      contactName,
      conversationId: data.conversation_id,
      elevenLabsCallSid: data.call_sid,
      startTime: new Date(),
    });

    return {
      status: "initiated",
      conversationId: data.conversation_id,
    };
  } catch (error) {
    console.error("Error in initiateCall:", error);
    throw error;
  }
}

export async function getConversation(conversationId: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/conversations/${conversationId}`,
    { headers: { "xi-api-key": ELEVENLABS_API_KEY } }
  );

  if (!res.ok) {
    throw new Error(
      `ElevenLabs conversation fetch failed – ${res.status} ${res.statusText}`
    );
  }
  return res.json();
}

