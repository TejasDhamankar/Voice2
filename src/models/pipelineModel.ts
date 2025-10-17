import mongoose, { Document, Schema } from 'mongoose';

export interface IStage extends Document {
  name: string;
  color: string;
  order: number;
  isDefault?: boolean;
}

export interface IPipeline extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  stages: IStage[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StageSchema = new Schema<IStage>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  color: {
    type: String,
    required: true,
    default: '#3b82f6', // blue-500
  },
  order: {
    type: Number,
    required: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
});

const PipelineSchema = new Schema<IPipeline>(
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
    description: {
      type: String,
      trim: true,
    },
    stages: [StageSchema],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Pipeline = mongoose.models.Pipeline || mongoose.model<IPipeline>('Pipeline', PipelineSchema);

export default Pipeline;
