import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const jwtSecretEnv = process.env.JWT_SECRET?.trim();

// Security Enforced: In production, JWT_SECRET is strictly required from environment variables.
// Using a default or fallback secret in production is forbidden to prevent token forgery attacks.
if (isProduction) {
  if (!jwtSecretEnv) {
    console.error('================================================================');
    console.error('[SECURITY ERROR] FATAL: JWT_SECRET environment variable is missing.');
    console.error('In production, JWT_SECRET must be configured with a strong, random key');
    console.error('(minimum 32 characters recommended, at least 16 required).');
    console.error('Set JWT_SECRET in your hosting environment dashboard (e.g., Render).');
    console.error('Server startup aborted.');
    console.error('================================================================');
    throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
  }

  if (jwtSecretEnv.length < 16) {
    console.error('================================================================');
    console.error('[SECURITY ERROR] FATAL: JWT_SECRET is too short (< 16 characters).');
    console.error('In production, JWT_SECRET must have adequate cryptographic entropy.');
    console.error('Server startup aborted.');
    console.error('================================================================');
    throw new Error('FATAL: JWT_SECRET must be at least 16 characters in production.');
  }
}

// In development, require JWT_SECRET from local untracked server/.env.
// Fallback is strictly isolated to non-production environments with an explicit warning.
const jwtSecret =
  jwtSecretEnv ||
  (isProduction
    ? ''
    : (() => {
        console.warn(
          '[SECURITY WARNING] JWT_SECRET is not set in server/.env. Using development fallback key for local dev.'
        );
        return 'dev_only_jwt_secret_for_local_testing_32_chars';
      })());

export const env = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/smart_livestock_db',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.AI_API_KEY || '',
  aiProvider: process.env.AI_PROVIDER || 'gemini',
  aiApiKey: process.env.AI_API_KEY || process.env.GEMINI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-1.5-flash',
};

