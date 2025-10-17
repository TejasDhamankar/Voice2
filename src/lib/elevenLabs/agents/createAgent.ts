import { HttpsAgent } from "agentkeepalive";
import connectDB from "@/lib/db";
import Agent from "@/models/agentModel";
import { combineTools, getDefaultSystemTools } from "@/lib/systemTools";
import { buildBuiltInTools, sanitizeAgentConfigForEL, AnyObj } from "./utils";

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY!;

const httpsAgent = new HttpsAgent({
  keepAlive: true,
  timeout: 60000,
  freeSocketTimeout: 30000,
});

export async function createAgent(agentData: AnyObj) {
  try {
    // Combine tools
    const allTools = combineTools(agentData.tools || []);
    const builtInTools = buildBuiltInTools(agentData);

    // --- Fix: Set TTS model based on language ---
    const effectiveLanguage = agentData.language || "en";

    // Use the full model names required by the ElevenLabs API
    const allowedEnglishTTS = ["eleven_turbo_v2", "eleven_flash_v2"];
    let ttsModel = agentData.ttsModel || "eleven_turbo_v2"; // default to the correct full name
    if (effectiveLanguage === "en" && !allowedEnglishTTS.includes(ttsModel)) {
      ttsModel = "eleven_turbo_v2"; // force English-safe model
    }

    // ASR model selection
    const asrModel = effectiveLanguage === "en" ? "eleven_turbo_v2" : "nova-2-general";

    // Build agent config
    const agentConfig: AnyObj = {
      name: agentData.name,
      conversation_config: {
        agent: {
          first_message: agentData.first_message,
          language: effectiveLanguage,
          disable_first_message_interruptions: agentData.disableFirstMessageInterruptions || false,
          prompt: {
            prompt: agentData.system_prompt,
            llm: agentData.llm_model || "gpt-4o-mini",
            temperature: typeof agentData.temperature === "number" ? agentData.temperature : 0.3,
            knowledge_base: (agentData.knowledge_documents || [])
              .filter((doc: AnyObj) => !!doc.document_id)
              .map((doc: AnyObj) => ({
                id: doc.document_id,
                name: doc.name,
                type: doc.type,
                usage_mode: "auto",
              })),
            tools: (allTools || []).filter((t: AnyObj) => t?.type !== "system"),
            built_in_tools: builtInTools,
          },
        },
        tts: {
          model_id: ttsModel,
          voice_id: agentData.voice_id,
          stability: typeof agentData.voiceStability === "number" ? agentData.voiceStability : 0.5,
          similarity_boost: typeof agentData.voiceSimilarityBoost === "number" ? agentData.voiceSimilarityBoost : 0.8,
        },
        asr: {
          model: asrModel,
          language: agentData.asrLanguage || "auto",
        },
        turn: {
          mode: agentData.turnMode || "turn",
          turn_timeout: typeof agentData.turnTimeout === "number" ? agentData.turnTimeout : 7.0,
        },
        conversation: {
          max_duration_seconds: typeof agentData.max_duration_seconds === "number" ? agentData.max_duration_seconds : 1800,
        },
      },
    };

    // Sanitize for ElevenLabs API
    const cleanConfig = sanitizeAgentConfigForEL(agentConfig);

    const response = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify(cleanConfig),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API Error:", { status: response.status, text: errorText });
      throw new Error(`Failed to create agent with ElevenLabs (${response.status}): ${errorText}`);
    }

    const elevenLabsAgent = await response.json();
    console.log("🧠 ElevenLabs Agent Response:", elevenLabsAgent);

    // Extract agent ID
    const agentId = elevenLabsAgent.agent_id || elevenLabsAgent.id;
    if (!agentId) {
      console.error("❌ ElevenLabs response missing agent_id or id:", elevenLabsAgent);
      throw new Error("Invalid ElevenLabs response: Missing agent ID");
    }

    // Save to DB
    await connectDB();
    const agent = new Agent({
      ...agentData,
      agentId,
      systemTools: getDefaultSystemTools(),
    });
    await agent.save();

    return {
      agent_id: agentId,
      name: agentData.name,
      message: "AI agent created successfully.",
    };

  } catch (error: any) {
    console.error("Error in createAgent service:", error);
    throw error;
  }
}