import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const requireDatabase = (req: Request, res: Response, next: NextFunction): void => {
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      success: false,
      message: 'Database service unavailable. Please ensure MongoDB is running on port 27017 or verify MONGODB_URI in server/.env.',
      error: 'MONGODB_NOT_CONNECTED',
    });
    return;
  }
  next();
};
