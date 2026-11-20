import mongoose, { Document, Schema } from 'mongoose';

export interface IFeedRecord extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  livestockId?: mongoose.Types.ObjectId;
  group?: string;
  feedType: string;
  quantity: number;
  unit: string;
  date: Date;
  cost: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FeedRecordSchema = new Schema<IFeedRecord>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for data isolation'],
      index: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
      required: [true, 'Farm ID is required for data isolation'],
      index: true,
    },
    livestockId: {
      type: Schema.Types.ObjectId,
      ref: 'Livestock',
    },
    group: {
      type: String,
      trim: true,
    },
    feedType: {
      type: String,
      required: [true, 'Feed type is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Feed quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: 'kg',
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Feeding date is required'],
      default: Date.now,
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative'],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

FeedRecordSchema.index({ farmId: 1, date: -1 });
FeedRecordSchema.index({ farmId: 1, livestockId: 1 });
FeedRecordSchema.index({ farmId: 1, feedType: 1 });

export const FeedRecord = mongoose.model<IFeedRecord>('FeedRecord', FeedRecordSchema);
