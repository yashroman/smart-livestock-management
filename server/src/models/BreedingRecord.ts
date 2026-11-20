import mongoose, { Document, Schema } from 'mongoose';

export type BreedingMethod = 'Artificial Insemination' | 'Natural Service';
export type PregnancyStatus =
  | 'Pending Check'
  | 'Not Confirmed'
  | 'Confirmed Pregnant'
  | 'Pregnant'
  | 'Not Pregnant'
  | 'Delivered';

export interface IBreedingRecord extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  livestockId: mongoose.Types.ObjectId;
  breedingDate: Date;
  method: BreedingMethod;
  partner: string;
  pregnancyStatus: PregnancyStatus;
  confirmationDate?: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BreedingRecordSchema = new Schema<IBreedingRecord>(
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
    breedingDate: {
      type: Date,
      required: [true, 'Breeding date is required'],
    },
    method: {
      type: String,
      enum: ['Artificial Insemination', 'Natural Service'],
      required: [true, 'Breeding method is required'],
    },
    partner: {
      type: String,
      required: [true, 'Breeding partner / semen details are required'],
      trim: true,
    },
    pregnancyStatus: {
      type: String,
      enum: [
        'Pending Check',
        'Not Confirmed',
        'Confirmed Pregnant',
        'Pregnant',
        'Not Pregnant',
        'Delivered',
      ],
      default: 'Pending Check',
    },
    confirmationDate: {
      type: Date,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
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

export const BreedingRecord = mongoose.model<IBreedingRecord>(
  'BreedingRecord',
  BreedingRecordSchema
);
