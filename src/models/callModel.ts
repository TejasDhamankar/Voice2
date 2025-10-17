import mongoose, { Document, Schema } from "mongoose";

export interface ICall extends Document {
  userId?: mongoose.Types.ObjectId;
  agentId?: mongoose.Types.ObjectId;
  elevenLabsAgentId?: string; // NEW field for ElevenLabs agent ID
  contactId?: mongoose.Types.ObjectId;
  campaignId?: mongoose.Types.ObjectId;  // ← NEW field to link calls to campaigns
  phoneNumber: string;
  direction: "inbound" | "outbound";

  status:
  | "queued"
  | "initiated"
  | "in-progress"
  | "completed"
  | "failed"
  | "no-answer";

  elevenLabsCallSid?: string;   // <-- the field we’ll match on
  twilioCallSid?: string;       // optional if you want both
  summary?: string;
  /* meta */
  notes?: string;
  recordingUrl?: string;
  transcription?: string;
  contactName?: string;
  customMessage?: string;
  conversationId?: string;   // ← NEW (ElevenLabs convai ID)
  hasAudio?: boolean;        // ← cache “has_audio” flag
  scheduledFor?: Date;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  cost: number;                 // cents / paise
  outcome?: string;
}

const CallSchema = new Schema<ICall>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent" },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
    elevenLabsAgentId: { type: String }, // NEW field for ElevenLabs agent ID
    phoneNumber: { type: String, required: true },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    status: {
      type: String,
      enum: [
        "queued",
        "initiated",
        "in-progress",
        "completed",
        "failed",
        "no-answer",
      ],
      default: "queued",
    },
    summary: { type: String, default: "" },
    elevenLabsCallSid: String,
    twilioCallSid: String,
    outcome: { type: String },
    notes: String,
    recordingUrl: String,
    conversationId: String,
    transcription: String,
    contactName: String,
    customMessage: String,
    campaignId: { type: Schema.Types.ObjectId, ref: "Campaign" },
    scheduledFor: Date,
    startTime: Date,
    endTime: Date,
    duration: Number,
    cost: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Call ??
  mongoose.model<ICall>("Call", CallSchema);
