import mongoose, { Document, Schema } from 'mongoose';

export interface IHealthRecord extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  livestockId: mongoose.Types.ObjectId;
  date: Date;
  symptoms: string;
  healthCondition: string;
  temperature?: number;
  treatment: string;
  medicine: string;
  dosage: string;
  veterinarian: string;
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HealthRecordSchema = new Schema<IHealthRecord>(
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
      required: [true, 'Date of treatment is required'],
      default: Date.now,
    },
    symptoms: {
      type: String,
      required: [true, 'Observed symptoms are required'],
      trim: true,
    },
    healthCondition: {
      type: String,
      required: [true, 'Health condition / diagnosis is required'],
      trim: true,
    },
    temperature: {
      type: Number,
    },
    treatment: {
      type: String,
      required: [true, 'Treatment administered is required'],
      trim: true,
    },
    medicine: {
      type: String,
      required: [true, 'Prescribed medicine is required'],
      trim: true,
    },
    dosage: {
      type: String,
      required: [true, 'Dosage instructions are required'],
      trim: true,
    },
    veterinarian: {
      type: String,
      required: [true, 'Veterinarian name is required'],
      trim: true,
    },
    followUpDate: {
      type: Date,
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

export const HealthRecord = mongoose.model<IHealthRecord>('HealthRecord', HealthRecordSchema);
