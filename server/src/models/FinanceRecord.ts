import mongoose, { Document, Schema } from 'mongoose';

export type FinanceType = 'income' | 'expense';

export interface IFinanceRecord extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  type: FinanceType;
  date: Date;
  category: string;
  amount: number;
  description: string;
  paymentMethod?: string;
  reference?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FinanceRecordSchema = new Schema<IFinanceRecord>(
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
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: [true, 'Transaction type must be income or expense'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Transaction category is required'],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      default: 'Cash',
      trim: true,
    },
    reference: {
      type: String,
      trim: true,
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

FinanceRecordSchema.index({ farmId: 1, type: 1, date: -1 });
FinanceRecordSchema.index({ farmId: 1, date: -1 });
FinanceRecordSchema.index({ farmId: 1, category: 1 });

export const FinanceRecord = mongoose.model<IFinanceRecord>(
  'FinanceRecord',
  FinanceRecordSchema
);
