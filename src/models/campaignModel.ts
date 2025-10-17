import mongoose, { Document, Schema } from "mongoose";

export interface ICampaign extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  agentId: mongoose.Types.ObjectId;
  status: "draft" | "scheduled" | "in-progress" | "completed" | "paused" | "cancelled";
  contacts: mongoose.Types.ObjectId[];
  customMessage?: string;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  dailyStartTime?: string; // Format: "HH:MM" e.g. "09:00"
  dailyEndTime?: string; // Format: "HH:MM" e.g. "17:00"
  maxConcurrentCalls?: number;
  callsBetweenPause?: number;
  pauseDuration?: number; // in minutes
  totalContacts: number;
  completedCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    agentId: { type: Schema.Types.ObjectId, ref: "Agent", required: true },
    status: {
      type: String,
      enum: ["draft", "scheduled", "in-progress", "completed", "paused", "cancelled"],
      default: "draft",
    },
    contacts: [{ type: Schema.Types.ObjectId, ref: "Contact" }],
    customMessage: { type: String },
    scheduledStartTime: { type: Date },
    scheduledEndTime: { type: Date },
    dailyStartTime: { type: String },
    dailyEndTime: { type: String },
    maxConcurrentCalls: { type: Number, default: 1 },
    callsBetweenPause: { type: Number },
    pauseDuration: { type: Number },
    totalContacts: { type: Number, default: 0 },
    completedCalls: { type: Number, default: 0 },
    successfulCalls: { type: Number, default: 0 },
    failedCalls: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Campaign ||
  mongoose.model<ICampaign>("Campaign", CampaignSchema);
