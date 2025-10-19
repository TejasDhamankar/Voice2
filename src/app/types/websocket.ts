/**
 * Base type for all WebSocket events.
 */
type BaseEvent = {
    type: string;
  };
  
  // --- Existing ElevenLabs Conversation Events ---
  
  /**
   * The user's transcribed speech.
   */
  type UserTranscriptEvent = BaseEvent & {
    type: "user_transcript";
    user_transcript_event: {
      user_transcript: string;
    };
  };
  
  /**
   * The agent's text response.
   */
  type AgentResponseEvent = BaseEvent & {
    type: "agent_response";
    agent_response_event: {
      agent_response: string;
    };
  };
  
  /**
   * A correction to a previous agent response.
   */
  type AgentResponseCorrectionEvent = BaseEvent & {
    type: "agent_response_correction";
    agent_response_correction_event: {
      original_agent_response: string;
      corrected_agent_response: string;
    };
  };
  
  /**
   * A chunk of audio from the agent.
   */
  export type AudioResponseEvent = BaseEvent & {
    type: "audio";
    audio_event: {
      audio_base_64: string;
      event_id: number;
    };
  };
  
  /**
   * The user has interrupted the agent's speech.
   */
  type InterruptionEvent = BaseEvent & {
    type: "interruption";
    interruption_event: {
      reason: string;
    };
  };
  
  /**
   * A keep-alive ping from the server.
   */
  type PingEvent = BaseEvent & {
    type: "ping";
    ping_event: {
      event_id: number;
      ping_ms?: number;
    };
  };
  
  
  // --- NEW: Call Lifecycle & System Events (For Exotel Integration) ---
  
  /**
   * Represents the status of the actual phone call.
   */
  export type CallStatus = "idle" | "initializing" | "ringing" | "connected" | "disconnected" | "failed";
  
  /**
   * Confirms the WebSocket is connected and the backend is ready.
   * Sent by the server immediately after a client connects.
   */
  type ConnectionReadyEvent = BaseEvent & {
      type: "connection_ready";
      ready_event: {
          session_id: string;
          message: string;
      };
  };
  
  /**
   * Communicates a change in the call's state (managed by Exotel).
   */
  type CallStatusEvent = BaseEvent & {
    type: "call_status";
    call_status_event: {
      status: CallStatus;
      call_sid: string; // The unique identifier from Exotel
      reason?: string;   // e.g., "completed", "busy", "no-answer"
    };
  };
  
  /**
   * A general error event for system-level issues.
   */
  type ErrorEvent = BaseEvent & {
      type: "error";
      error_event: {
          message: string;
          details?: Record<string, any>;
      };
  };
  
  
  /**
   * The complete set of possible events over the WebSocket.
   */
  export type ElevenLabsWebSocketEvent =
    | UserTranscriptEvent
    | AgentResponseEvent
    | AgentResponseCorrectionEvent
    | AudioResponseEvent
    | InterruptionEvent
    | PingEvent
    // --- Added Events ---
    | ConnectionReadyEvent
    | CallStatusEvent
    | ErrorEvent;
  