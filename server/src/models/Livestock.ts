import mongoose, { Document, Schema } from 'mongoose';

export type LivestockSpecies = 'Cow' | 'Buffalo' | 'Goat' | 'Sheep' | 'Other';
export type LivestockGender = 'Female' | 'Male';
export type LivestockStatus =
  | 'Healthy'
  | 'Needs Attention'
  | 'Sick'
  | 'Quarantined'
  | 'Pregnant'
  | 'Lactating'
  | 'Dry'
  | 'Sold';

export interface ILivestock extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  animalId: string;
  name: string;
  species: LivestockSpecies;
  breed: string;
  gender: LivestockGender;
  dateOfBirth: Date;
  weight: number;
  color: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  source: string;
  status: LivestockStatus;
  photo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LivestockSchema = new Schema<ILivestock>(
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
    animalId: {
      type: String,
      required: [true, 'Animal tag/identifier is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Animal name is required'],
      trim: true,
    },
    species: {
      type: String,
      enum: ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Other'],
      required: [true, 'Animal species is required'],
    },
    breed: {
      type: String,
      required: [true, 'Breed is required'],
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Female', 'Male'],
      required: [true, 'Gender is required'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight in kg is required'],
      min: [0, 'Weight cannot be negative'],
    },
    color: {
      type: String,
      required: [true, 'Color is required'],
      trim: true,
    },
    purchaseDate: {
      type: Date,
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative'],
    },
    source: {
      type: String,
      default: 'Born on Farm',
      trim: true,
    },
    status: {
      type: String,
      enum: [
        'Healthy',
        'Needs Attention',
        'Sick',
        'Quarantined',
        'Pregnant',
        'Lactating',
        'Dry',
        'Sold',
      ],
      default: 'Healthy',
    },
    photo: {
      type: String,
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

// Composite index for fast scoped lookups
LivestockSchema.index({ userId: 1, animalId: 1 });
LivestockSchema.index({ farmId: 1, status: 1 });

export const Livestock = mongoose.model<ILivestock>('Livestock', LivestockSchema);
