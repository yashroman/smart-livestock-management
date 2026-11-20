/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  farmId: string;
  fullName?: string;
  preferredLanguage?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
