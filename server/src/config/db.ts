import mongoose from 'mongoose';
import { env } from './env';

export const connectDB = async (): Promise<boolean> => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    const conn = await mongoose.connect(env.mongodbUri, {
      serverSelectionTimeoutMS: 10000, // 10s timeout for cloud Atlas latency
      connectTimeoutMS: 10000,
      autoIndex: env.nodeEnv !== 'production', // Build indexes on startup only in dev
    });

    console.log(`[Database] MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error: any) {
    console.warn(`[Database Notice] MongoDB is not reachable: ${error?.message || error}`);
    console.warn(`Target URI: ${env.mongodbUri.replace(/:([^:@]+)@/, ':****@')}`);
    console.warn('The API server is running, but database operations require MongoDB / Atlas to be reachable.');
    return false;
  }
};

