import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  type: 'file' | 'url' | 'text';
  content?: string;
  url?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  elevenLabsDocumentId?: string;
  category?: string;
  tags: string[];
  description?: string;
  isGlobal: boolean; // If true, available to all agents by default
  agentIds: mongoose.Types.ObjectId[]; // Specific agents this document is attached to
  uploadedAt: Date;
  lastModified: Date;
  usageCount: number;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['file', 'url', 'text'],
      required: true,
    },
    content: {
      type: String,
      // For text type documents
    },
    url: {
      type: String,
      // For URL type documents
    },
    fileName: {
      type: String,
      // Original filename for uploaded files
    },
    fileSize: {
      type: Number,
      // File size in bytes
    },
    mimeType: {
      type: String,
      // MIME type of the file
    },
    elevenLabsDocumentId: {
      type: String,
      // ElevenLabs knowledge base document ID
    },
    category: {
      type: String,
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    description: {
      type: String,
      trim: true,
    },
    isGlobal: {
      type: Boolean,
      default: false,
    },
    agentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    }],
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
KnowledgeDocumentSchema.index({ userId: 1, name: 1 });
KnowledgeDocumentSchema.index({ userId: 1, isGlobal: 1 });
KnowledgeDocumentSchema.index({ elevenLabsDocumentId: 1 });

const KnowledgeDocument = mongoose.models.KnowledgeDocument || mongoose.model<IKnowledgeDocument>('KnowledgeDocument', KnowledgeDocumentSchema);

export default KnowledgeDocument;
