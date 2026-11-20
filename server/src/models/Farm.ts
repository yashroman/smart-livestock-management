import mongoose, { Document, Schema } from 'mongoose';

export interface IFarm extends Document {
  userId: mongoose.Types.ObjectId;
  farmName: string;
  location: string;
  createdAt: Date;
  updatedAt: Date;
}

const FarmSchema = new Schema<IFarm>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for farm mapping'],
      index: true,
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Farm = mongoose.model<IFarm>('Farm', FarmSchema);
