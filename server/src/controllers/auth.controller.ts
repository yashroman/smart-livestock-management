import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User, IUser } from '../models/User';
import { Farm } from '../models/Farm';
import { env } from '../config/env';
import { AuthenticatedRequest } from '../types/express';

// Email validation helper regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      fullName,
      mobile,
      email,
      password,
      farmName,
      location,
      preferredLanguage = 'en',
    } = req.body;

    // 1. Validation checks
    if (!fullName || !mobile || !email || !password || !farmName || !location) {
      res.status(400).json({
        success: false,
        message: 'All fields are required: fullName, mobile, email, password, farmName, location',
      });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
      return;
    }

    const allowedLanguages = ['en', 'hi', 'mr'];
    if (preferredLanguage && !allowedLanguages.includes(preferredLanguage)) {
      res.status(400).json({
        success: false,
        message: `Preferred language must be one of: ${allowedLanguages.join(', ')}`,
      });
      return;
    }

    // 2. Database readiness check
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please ensure MongoDB is running on port 27017 or verify MONGODB_URI in server/.env.',
        error: 'MONGODB_NOT_CONNECTED',
      });
      return;
    }

    // 3. Check duplicate email
    const existingUser = await User.findOne({ email: trimmedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    // 4. Hash password (10 salt rounds)
    const salt = await bcryptjs.genSalt(10);
    const passwordHash = await bcryptjs.hash(password, salt);

    // 5. Create User and Farm linked with atomic identifiers
    const userId = new mongoose.Types.ObjectId();
    const farmId = new mongoose.Types.ObjectId();

    const farm = await Farm.create({
      _id: farmId,
      userId,
      farmName: farmName.trim(),
      location: location.trim(),
    });

    const user = await User.create({
      _id: userId,
      fullName: fullName.trim(),
      mobile: mobile.trim(),
      email: trimmedEmail,
      passwordHash,
      farmName: farmName.trim(),
      farmId: farm._id,
      location: location.trim(),
      preferredLanguage: preferredLanguage as 'en' | 'hi' | 'mr',
    });

    // 6. Generate JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        farmId: farm._id.toString(),
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as any }
    );

    res.status(201).json({
      success: true,
      message: 'Farmer account registered successfully',
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        farmName: user.farmName,
        farmId: farm._id.toString(),
        location: user.location,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Validation
    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Both email and password are required',
      });
      return;
    }

    const trimmedEmail = email.toLowerCase().trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    // 2. Database readiness check
    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please ensure MongoDB is running on port 27017 or verify MONGODB_URI in server/.env.',
        error: 'MONGODB_NOT_CONNECTED',
      });
      return;
    }

    // 3. Locate User
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // 4. Verify Password
    const isPasswordValid = await bcryptjs.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    // 5. Ensure Farm exists for user
    let farmId = user.farmId;
    if (!farmId) {
      const existingFarm = await Farm.findOne({ userId: user._id });
      if (existingFarm) {
        farmId = existingFarm._id as mongoose.Types.ObjectId;
        user.farmId = farmId;
        await user.save();
      } else {
        const newFarm = await Farm.create({
          userId: user._id,
          farmName: user.farmName || 'My Livestock Farm',
          location: user.location || 'Rural',
        });
        farmId = newFarm._id as mongoose.Types.ObjectId;
        user.farmId = farmId;
        await user.save();
      }
    }

    // 6. Generate JWT Token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        farmId: farmId.toString(),
        fullName: user.fullName,
        preferredLanguage: user.preferredLanguage,
      },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as any }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        farmName: user.farmName,
        farmId: farmId.toString(),
        location: user.location,
        preferredLanguage: user.preferredLanguage,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user || !req.user.id) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized request',
      });
      return;
    }

    if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
        success: false,
        message: 'Database service unavailable. Please ensure MongoDB is running on port 27017 or verify MONGODB_URI in server/.env.',
        error: 'MONGODB_NOT_CONNECTED',
      });
      return;
    }

    const user: IUser | null = await User.findById(req.user.id).select(
      '-passwordHash'
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Farmer profile not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        mobile: user.mobile,
        email: user.email,
        farmName: user.farmName,
        farmId: user.farmId ? user.farmId.toString() : req.user.farmId,
        location: user.location,
        preferredLanguage: user.preferredLanguage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error retrieving user profile',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.status(200).json({
    success: true,
    message: 'User logged out successfully',
  });
};
