import mongoose, { Document, Schema } from 'mongoose';

export interface ILead extends Document {
  userId: mongoose.Types.ObjectId;
  contactId?: mongoose.Types.ObjectId;
  pipelineId: mongoose.Types.ObjectId;
  stageId: mongoose.Types.ObjectId;

  // Lead information
  name: string;
  email?: string;
  phoneNumber: string;
  company?: string;
  jobTitle?: string;

  // Lead details
  value?: number; // Deal value
  source?: string; // Lead source (website, referral, etc.)
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';
  priority: 'low' | 'medium' | 'high';

  // Metadata
  notes?: string;
  tags?: string[];
  assignedTo?: mongoose.Types.ObjectId; // User ID
  lastActivity?: Date;
  expectedCloseDate?: Date;

  // Tracking
  stageHistory?: {
    stageId: mongoose.Types.ObjectId;
    stageName: string;
    movedAt: Date;
    movedBy?: mongoose.Types.ObjectId;
  }[];

  createdAt: Date;
  updatedAt: Date;
}

const LeadSchema = new Schema<ILead>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: 'Contact',
    },
    pipelineId: {
      type: Schema.Types.ObjectId,
      ref: 'Pipeline',
      required: true,
    },
    stageId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'],
      default: 'new',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    notes: {
      type: String,
    },
    tags: [{ type: String }],
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    expectedCloseDate: {
      type: Date,
    },
    stageHistory: [{
      stageId: {
        type: Schema.Types.ObjectId,
        required: true,
      },
      stageName: {
        type: String,
        required: true,
      },
      movedAt: {
        type: Date,
        default: Date.now,
      },
      movedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
  },
  { timestamps: true }
);

const Lead = mongoose.models.Lead || mongoose.model<ILead>('Lead', LeadSchema);

export default Lead;
