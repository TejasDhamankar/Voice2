import mongoose, { Document, Schema } from "mongoose";

// Interface defining the Call document structure
export interface ICall extends Document {
  _id: mongoose.Types.ObjectId; // Explicitly define _id for type safety
  userId: mongoose.Types.ObjectId; // Reference to the user who owns the call
  agentId?: mongoose.Types.ObjectId; // Reference to your internal Agent model (optional if only using elevenLabsAgentId)
  elevenLabsAgentId: string; // The specific agent ID from ElevenLabs used for this call
  exotelCallSid?: string; // Unique identifier for the call provided by Exotel
  agentName?: string; // Name of the agent for display purposes
  contactId?: mongoose.Types.ObjectId; // Reference to a Contact model (optional)
  campaignId?: mongoose.Types.ObjectId; // Reference to a Campaign model (optional)
  phoneNumber: string; // The phone number called
  contactName?: string; // Name of the person being called
  direction: "outbound"; // Direction will be outbound for this flow

  // Updated Status Enum to reflect Exotel + Internal states
  status:
    | "queued" // Initial state before sending to Exotel (e.g., for batch)
    | "initiating" // Sent to backend, attempting Exotel API call
    | "ringing" // Exotel has initiated the call and it's ringing
    | "answered" // Exotel reported the call was answered (transient state before connected)
    | "in-progress" // Exotel reported the call is active (often synonymous with answered)
    | "connected" // Backend received WebSocket URL and told Exotel to connect
    | "ended" // Call completed successfully (hangup by either party after connection)
    | "completed" // Exotel status often means successfully ended
    | "failed" // Call failed at any stage (Exotel initiation, connection, ElevenLabs error)
    | "busy" // Exotel reported the line was busy
    | "no-answer" // Exotel reported no answer
    | "canceled"; // If you implement cancellation before ringing (optional)
    // Add 'disconnecting' if you want a specific state during hangup process

  failureReason?: string; // Stores reason if status is 'failed'
  elevenLabsSignedUrl?: string; // The secure WebSocket URL from ElevenLabs
  elevenLabsCallId?: string; // ID returned from ElevenLabs POST /v1/calls (distinct from Exotel SID & Convai ID)
  conversationId?: string; // Conversation ID from ElevenLabs WebSocket events

  summary?: string; // AI-generated summary (optional)
  notes?: string; // Manual notes added by user (optional)
  recordingUrl?: string; // URL of the call recording (from Exotel or storage)
  transcription?: string; // Full call transcription (optional)
  customMessage?: string; // Initial message/context passed to the agent for this specific call

  scheduledFor?: Date; // If the call was scheduled (for campaigns)
  callStartTime?: Date; // When the call was actually initiated or connected
  callEndTime?: Date; // When the call ended
  duration?: number; // Duration of the connected part of the call in seconds
  cost?: number; // Cost of the call (e.g., in smallest currency unit like paise/cents)
  outcome?: string; // Custom outcome defined by agent or user (e.g., 'appointment_booked', 'interested')

  createdAt: Date; // Provided by timestamps: true
  updatedAt: Date; // Provided by timestamps: true
}

// Mongoose Schema definition
const CallSchema = new Schema<ICall>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent" }, // Your internal agent link
    elevenLabsAgentId: { type: String, required: true, index: true }, // The ID used to get the signed URL
    agentName: { type: String },
    exotelCallSid: { type: String, index: true, unique: true, sparse: true }, // Exotel's unique call ID
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign", index: true },

    phoneNumber: { type: String, required: true },
    contactName: { type: String },
    direction: { type: String, enum: ["outbound"], required: true, default: "outbound" }, // Default to outbound

    status: {
      type: String,
      enum: [
        "queued", "initiating", "ringing", "answered", "in-progress", 
        "connected", "ended", "completed", "failed", "busy", 
        "no-answer", "canceled" 
      ],
      default: "queued",
    },
    failureReason: { type: String },
    elevenLabsSignedUrl: { type: String }, // The temporary WebSocket URL
    elevenLabsCallId: { type: String }, // ID from ElevenLabs POST /v1/calls response
    conversationId: { type: String }, // ID from ElevenLabs Convai WebSocket events

    summary: { type: String },
    notes: { type: String },
    recordingUrl: { type: String },
    transcription: { type: String },
    customMessage: { type: String }, // Context for the agent

    scheduledFor: { type: Date },
    callStartTime: { type: Date }, // Consider renaming from startTime for clarity if preferred
    callEndTime: { type: Date }, // Consider renaming from endTime for clarity if preferred
    duration: { type: Number }, // In seconds
    cost: { type: Number, default: 0 }, // Store in smallest unit (e.g., paise/cents)
    outcome: { type: String },
  },
  { 
    timestamps: true // Adds createdAt and updatedAt automatically
  } 
);

// Indexing commonly queried fields
CallSchema.index({ userId: 1, createdAt: -1 }); // For fetching recent calls per user
CallSchema.index({ status: 1 });

// Export the model, creating it if it doesn't exist
export default mongoose.models.Call as mongoose.Model<ICall> ?? 
  mongoose.model<ICall>("Call", CallSchema);