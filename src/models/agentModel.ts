import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeDocument {
  document_id: string;
  name: string;
  type: 'file' | 'url' | 'text';
  content?: string;
  url?: string;
  file_name?: string;
  created_at: Date;
}

export interface IAgent extends Document {
  userId: mongoose.Types.ObjectId;
  agentId: string;
  name: string;
  description?: string;

  // Voice configuration
  voiceId: string;
  voiceName?: string;
  voiceStability: number;
  voiceSimilarityBoost: number;
  voiceSpeed: number;

  // Core settings
  disabled: boolean;
  firstMessage: string;
  disableFirstMessageInterruptions: boolean;
  systemPrompt: string;
  templateId?: string;
  templateName?: string;

  // LLM configuration
  llmModel: string;
  temperature: number;
  maxTokens: number;
  reasoningEffort?: string;
  customLlm?: any;

  // Language and localization
  language: string;
  timezone?: string;

  // Advanced conversation settings
  maxDurationSeconds: number;
  turnMode: string;
  turnTimeout: number;
  silenceEndCallTimeout: number;
  textOnly: boolean;

  // Audio settings
  outputAudioFormat: string;
  inputAudioFormat: string;
  optimizeStreamingLatency: number;

  // ASR (Automatic Speech Recognition) settings
  asrModel: string;
  asrLanguage: string;
  asrQuality: string;
  asrProvider: string;
  asrKeywords: string[];

  // Voice Activity Detection
  backgroundVoiceDetection: boolean;

  // Knowledge and tools
  knowledgeDocuments: any[];
  tools: string[];
  systemTools: any[];
  toolIds: string[];
  mcpServerIds: string[];
  nativeMcpServerIds: string[];
  dynamicVariables: any;

  // RAG configuration
  ragEnabled: boolean;
  embeddingModel: string;
  maxVectorDistance: number;
  maxDocumentsLength: number;
  maxRetrievedRagChunksCount: number;

  // Built-in tools
  enableEndCall: boolean;
  enableLanguageDetection: boolean;
  enableTransferToAgent: boolean;
  enableTransferToNumber: boolean;
  enableSkipTurn: boolean;
  enableKeypadTouchTone: boolean;
  enableVoicemailDetection: boolean;

  // Client events
  clientEvents: string[];

  // Language presets
  languagePresets: any;
  supportedVoices: string[];
  pronunciationDictionaryLocators: any[];

  // Personality
  ignoreDefaultPersonality: boolean;

  // Analytics and usage
  usageMinutes: number;
  lastCalledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeDocumentSchema = new Schema<IKnowledgeDocument>({
  document_id: { type: String, required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['file', 'url', 'text'], required: true },
  content: { type: String },
  url: { type: String },
  file_name: { type: String },
  created_at: { type: Date, default: Date.now }
});

const AgentSchema = new Schema<IAgent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    agentId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: String,

    // Voice configuration
    voiceId: {
      type: String,
      required: true,
    },
    voiceName: String,
    voiceStability: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    voiceSimilarityBoost: {
      type: Number,
      default: 0.8,
      min: 0,
      max: 1,
    },
    voiceSpeed: {
      type: Number,
      default: 1.0,
      min: 0.25,
      max: 4.0,
    },

    // Core settings
    disabled: {
      type: Boolean,
      default: false,
    },
    firstMessage: {
      type: String,
      required: true,
    },
    disableFirstMessageInterruptions: {
      type: Boolean,
      default: false,
    },
    systemPrompt: {
      type: String,
      required: true,
    },
    templateId: String,
    templateName: String,

    // LLM configuration
    llmModel: {
      type: String,
      default: 'gpt-4o-mini',
    },
    temperature: {
      type: Number,
      default: 0.3,
      min: 0,
      max: 2,
    },
    maxTokens: {
      type: Number,
      default: -1,
    },
    reasoningEffort: String,
    customLlm: Schema.Types.Mixed,

    // Language and localization
    language: {
      type: String,
      default: 'en',
    },
    timezone: String,

    // Advanced conversation settings
    maxDurationSeconds: {
      type: Number,
      default: 1800,
    },
    turnMode: {
      type: String,
      enum: ['turn', 'push_to_talk'],
      default: 'turn',
    },
    turnTimeout: {
      type: Number,
      default: 7.0,
    },
    silenceEndCallTimeout: {
      type: Number,
      default: -1,
    },
    textOnly: {
      type: Boolean,
      default: false,
    },

    // Audio settings
    outputAudioFormat: {
      type: String,
      enum: ['pcm_16000', 'ulaw_8000'],
      default: 'pcm_16000',
    },
    inputAudioFormat: {
      type: String,
      enum: ['pcm_16000', 'ulaw_8000'],
      default: 'pcm_16000',
    },
    optimizeStreamingLatency: {
      type: Number,
      min: 1,
      max: 4,
      default: 3,
    },

    // ASR settings
    asrModel: {
      type: String,
      enum: ['nova-2-general', 'nova-2-multilingual'],
      default: 'nova-2-general',
    },
    asrLanguage: {
      type: String,
      default: 'auto',
    },
    asrQuality: {
      type: String,
      enum: ['high', 'low'],
      default: 'high',
    },
    asrProvider: {
      type: String,
      enum: ['elevenlabs', 'deepgram'],
      default: 'elevenlabs',
    },
    asrKeywords: [String],

    // Voice Activity Detection
    backgroundVoiceDetection: {
      type: Boolean,
      default: false,
    },

    // Knowledge and tools
    knowledgeDocuments: [Schema.Types.Mixed],
    tools: [String],
    systemTools: [Schema.Types.Mixed],
    toolIds: [String],
    mcpServerIds: [String],
    nativeMcpServerIds: [String],
    dynamicVariables: Schema.Types.Mixed,

    // RAG configuration
    ragEnabled: {
      type: Boolean,
      default: false,
    },
    embeddingModel: {
      type: String,
      default: 'e5_mistral_7b_instruct',
    },
    maxVectorDistance: {
      type: Number,
      default: 0.6,
    },
    maxDocumentsLength: {
      type: Number,
      default: 50000,
    },
    maxRetrievedRagChunksCount: {
      type: Number,
      default: 20,
    },

    // Built-in tools
    enableEndCall: {
      type: Boolean,
      default: true,
    },
    enableLanguageDetection: {
      type: Boolean,
      default: false,
    },
    enableTransferToAgent: {
      type: Boolean,
      default: false,
    },
    enableTransferToNumber: {
      type: Boolean,
      default: false,
    },
    enableSkipTurn: {
      type: Boolean,
      default: false,
    },
    enableKeypadTouchTone: {
      type: Boolean,
      default: false,
    },
    enableVoicemailDetection: {
      type: Boolean,
      default: false,
    },

    // Client events
    clientEvents: {
      type: [String],
      default: ['audio', 'interruption', 'agent_response', 'user_transcript', 'agent_response_correction', 'agent_tool_response'],
    },

    // Language presets
    languagePresets: Schema.Types.Mixed,
    supportedVoices: [String],
    pronunciationDictionaryLocators: [Schema.Types.Mixed],

    // Personality
    ignoreDefaultPersonality: {
      type: Boolean,
      default: false,
    },

    // Analytics
    usageMinutes: {
      type: Number,
      default: 0,
    },
    lastCalledAt: Date,
  },
  { timestamps: true }
);


const Agent = mongoose.models.Agent || mongoose.model<IAgent>('Agent', AgentSchema);

export default Agent;
