import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  phoneNumber: string;
  email?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
  lastContacted?: Date;
  source?: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    company: {
      type: String,
      trim: true,
    },
    jobTitle: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
    tags: [{ type: String }],
    lastContacted: {
      type: Date,
    },
    source: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'do-not-call'],
      default: 'active',
    },
  },
  { timestamps: true }
);

// Index for efficient queries
ContactSchema.index({ userId: 1, phoneNumber: 1 }, { unique: true });
ContactSchema.index({ userId: 1, email: 1 });
ContactSchema.index({ userId: 1, tags: 1 });

const Contact = mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);

export default Contact;
