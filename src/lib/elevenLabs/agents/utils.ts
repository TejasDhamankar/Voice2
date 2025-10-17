// /lib/elevenlabs/agents/utils.ts

export type AnyObj = Record<string, any>;

/**
 * Builds the 'built_in_tools' object for the ElevenLabs API payload
 * based on boolean flags in the agentData.
 */
export function buildBuiltInTools(agentData: AnyObj) {
  const bi: AnyObj = {};

  if (agentData.enableEndCall !== false) {
    bi.end_call = {
      type: "system",
      name: "end_call",
      params: { system_tool_type: "end_call" },
    };
  }
  if (agentData.enableLanguageDetection) {
    bi.language_detection = {
      type: "system",
      name: "language_detection",
      params: { system_tool_type: "language_detection" },
    };
  }
  if (agentData.enableTransferToAgent) {
    bi.transfer_to_agent = {
      type: "system",
      name: "transfer_to_agent",
      params: {
        system_tool_type: "transfer_to_agent",
        transfers: agentData.transferToAgentTransfers || [],
      },
    };
  }
  if (agentData.enableTransferToNumber) {
    bi.transfer_to_number = {
      type: "system",
      name: "transfer_to_number",
      params: {
        system_tool_type: "transfer_to_number",
        transfers: agentData.transferToNumberTransfers || [],
      },
    };
  }
  if (agentData.enableSkipTurn) {
    bi.skip_turn = {
      type: "system",
      name: "skip_turn",
      params: { system_tool_type: "skip_turn" },
    };
  }
  if (agentData.enableKeypadTouchTone) {
    bi.play_keypad_touch_tone = {
      type: "system",
      name: "play_keypad_touch_tone",
      params: { system_tool_type: "play_keypad_touch_tone" },
    };
  }
  if (agentData.enableVoicemailDetection) {
    bi.voicemail_detection = {
      type: "system",
      name: "voicemail_detection",
      params: {
        system_tool_type: "voicemail_detection",
        voicemail_message: agentData.voicemailMessage ?? null,
      },
    };
  }
  return bi;
}

/**
 * Cleans up the agent configuration object to match the exact
 * schema required by the ElevenLabs API before sending.
 */
export function sanitizeAgentConfigForEL(cfg: AnyObj) {
  const prompt = cfg?.conversation_config?.agent?.prompt;

  // Map knowledge base documents correctly
  if (prompt?.knowledge_base) {
    prompt.knowledge_base = (prompt.knowledge_base as AnyObj[]).map((d) => ({
      id: d.id ?? d.document_id,
      name: d.name,
      type: d.type,
      usage_mode: d.usage_mode ?? "auto",
    }));
  }

  // Omit max_tokens if it's not a positive number
  if (prompt && typeof prompt.max_tokens !== "undefined" && prompt.max_tokens <= 0) {
    delete prompt.max_tokens;
  }

  // Ensure system tools are only in 'built_in_tools', not in the main 'tools' array
  if (prompt?.tools?.length) {
    prompt.tools = (prompt.tools as AnyObj[]).filter((t) => t?.type !== "system");
  }

  // The API requires optimize_streaming_latency to be a string
  const tts = cfg?.conversation_config?.tts;
  if (tts) {
    tts.optimize_streaming_latency = String(
      tts.optimize_streaming_latency ?? "3"
    );
  }

  return cfg;
}