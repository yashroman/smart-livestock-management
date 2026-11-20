import mongoose, { Document, Schema } from 'mongoose';

export type SupportedLanguage = 'en' | 'hi' | 'mr';

export interface IUser extends Document {
  fullName: string;
  mobile: string;
  email: string;
  passwordHash: string;
  farmName: string;
  farmId?: mongoose.Types.ObjectId;
  location: string;
  preferredLanguage: SupportedLanguage;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    farmName: {
      type: String,
      required: [true, 'Farm name is required'],
      trim: true,
    },
    farmId: {
      type: Schema.Types.ObjectId,
      ref: 'Farm',
    },
    location: {
      type: String,
      required: [true, 'Farm location is required'],
      trim: true,
    },
    preferredLanguage: {
      type: String,
      enum: ['en', 'hi', 'mr'],
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
