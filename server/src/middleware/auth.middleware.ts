import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthenticatedRequest, AuthUser } from '../types/express';

interface JwtPayload {
  id: string;
  email: string;
  farmId: string;
  fullName?: string;
  preferredLanguage?: string;
  iat?: number;
  exp?: number;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Authorization Bearer token required.',
    });
    return;
  }

  const token = authHeader.split(' ')[1]?.trim();

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Access denied. Malformed authorization token.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;

    if (!decoded.id || !decoded.farmId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token payload. User ID and Farm ID missing.',
      });
      return;
    }

    const authUser: AuthUser = {
      id: decoded.id,
      email: decoded.email,
      farmId: decoded.farmId,
      fullName: decoded.fullName,
      preferredLanguage: decoded.preferredLanguage,
    };

    req.user = authUser;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: 'Invalid authorization token.',
    });
  }
};

export const authenticate = authenticateToken;
