import mongoose, { Document, Schema } from 'mongoose';

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in-progress" | "resolved" | "closed";
export type TicketCategory = "billing" | "technical" | "feature" | "account" | "other";

export interface ITicketMessage {
  content: string;
  sender: "user" | "support";
  attachments?: string[];
  createdAt: Date;
}

export interface ITicket extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
  {
    content: {
      type: String,
      required: true,
    },
    sender: {
      type: String,
      enum: ["user", "support"],
      required: true,
    },
    attachments: [{ type: String }],
  },
  { timestamps: true }
);

const TicketSchema = new Schema<ITicket>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "in-progress", "resolved", "closed"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    category: {
      type: String,
      enum: ["billing", "technical", "feature", "account", "other"],
      required: true,
    },
    messages: [TicketMessageSchema],
  },
  { timestamps: true }
);

const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);

export default Ticket;
