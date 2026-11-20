import mongoose, { Document, Schema } from 'mongoose';

export interface IMilkRecord extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  livestockId: mongoose.Types.ObjectId;
  date: Date;
  morningQuantity: number;
  eveningQuantity: number;
  totalQuantity: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MilkRecordSchema = new Schema<IMilkRecord>(
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
      required: [true, 'Livestock reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Milk recording date is required'],
      default: Date.now,
      index: true,
    },
    morningQuantity: {
      type: Number,
      required: [true, 'Morning quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    eveningQuantity: {
      type: Number,
      required: [true, 'Evening quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0,
    },
    totalQuantity: {
      type: Number,
      required: [true, 'Total quantity is required'],
      min: [0, 'Quantity cannot be negative'],
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

// Auto calculate totalQuantity before saving if not supplied or mismatched
MilkRecordSchema.pre('validate', function (next) {
  if (this.morningQuantity !== undefined && this.eveningQuantity !== undefined) {
    this.totalQuantity = Number((this.morningQuantity + this.eveningQuantity).toFixed(2));
  }
  next();
});

MilkRecordSchema.index({ farmId: 1, date: -1 });

export const MilkRecord = mongoose.model<IMilkRecord>('MilkRecord', MilkRecordSchema);
