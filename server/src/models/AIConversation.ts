import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAIMessage {
  _id?: Types.ObjectId;
  role: 'user' | 'assistant' | 'system';
  content: string;
  language: string;
  isGrounded?: boolean;
  intent?: string;
  timestamp: Date;
}

export interface IAIConversation extends Document {
  userId: Types.ObjectId;
  farmId: Types.ObjectId;
  title: string;
  language: string;
  messages: IAIMessage[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const AIMessageSchema = new Schema<IAIMessage>({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000,
  },
  language: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    default: 'en',
  },
  isGrounded: {
    type: Boolean,
    default: false,
  },
  intent: {
    type: String,
    default: 'general',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const AIConversationSchema = new Schema<IAIConversation>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
      default: 'New Farm Chat',
    },
    language: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en',
    },
    messages: [AIMessageSchema],
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for fast tenant queries and chronological ordering
AIConversationSchema.index({ farmId: 1, userId: 1, updatedAt: -1 });

export const AIConversation = mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);
