import mongoose, { Document, Schema } from 'mongoose';

export interface IVaccination extends Document {
  userId: mongoose.Types.ObjectId;
  farmId: mongoose.Types.ObjectId;
  livestockId: mongoose.Types.ObjectId;
  vaccine: string;
  vaccinationDate: Date;
  nextDueDate: Date;
  dose: string;
  veterinarian: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const VaccinationSchema = new Schema<IVaccination>(
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
    vaccine: {
      type: String,
      required: [true, 'Vaccine name is required'],
      trim: true,
    },
    vaccinationDate: {
      type: Date,
      required: [true, 'Vaccination date is required'],
    },
    nextDueDate: {
      type: Date,
      required: [true, 'Next due date is required'],
      index: true,
    },
    dose: {
      type: String,
      required: [true, 'Dose amount/type is required'],
      trim: true,
    },
    veterinarian: {
      type: String,
      required: [true, 'Administering veterinarian is required'],
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

VaccinationSchema.index({ farmId: 1, nextDueDate: 1 });

export const Vaccination = mongoose.model<IVaccination>('Vaccination', VaccinationSchema);
