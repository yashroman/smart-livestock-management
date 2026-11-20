import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { env } from './config/env';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/error.middleware';

import authRoutes from './routes/auth.routes';
import livestockRoutes from './routes/livestock.routes';
import healthRoutes from './routes/health.routes';
import vaccinationRoutes from './routes/vaccination.routes';
import breedingRoutes from './routes/breeding.routes';
import milkRoutes from './routes/milk.routes';
import dashboardRoutes from './routes/dashboard.routes';
import feedRoutes from './routes/feed.routes';
import incomeRoutes from './routes/income.routes';
import expenseRoutes from './routes/expense.routes';
import financeRoutes from './routes/finance.routes';
import reminderRoutes from './routes/reminder.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';

const app = express();

// Parse configured origins from environment (supports comma-separated list)
const configuredOrigins = (env.clientOrigin || '')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

// Global Middlewares
app.use(
  cors({
    origin: (requestOrigin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
      if (!requestOrigin) {
        return callback(null, true);
      }

      const normalizedOrigin = requestOrigin.replace(/\/$/, '');

      // Check configured origins or default dev origins
      const isAllowed =
        configuredOrigins.includes(normalizedOrigin) ||
        defaultDevOrigins.includes(normalizedOrigin) ||
        // Allow any *.vercel.app domain for Vercel preview and production deployments
        /^https:\/\/[a-zA-Z0-9-]+\.vercel\.app$/.test(normalizedOrigin) ||
        env.nodeEnv === 'development';

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${requestOrigin}`);
        callback(new Error(`CORS policy blocked access from origin: ${requestOrigin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  const isConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: isConnected ? 'ok' : 'degraded',
    project: 'Smart Livestock Management & Decision Support System',
    timestamp: new Date().toISOString(),
    database: isConnected ? 'connected' : 'disconnected',
    environment: env.nodeEnv,
    version: '1.0.0',
    phase: 'Phase 8 - Database Connection, Demo Data, E2E Testing & Final Polish Complete',
  });
});

// Mounted API Routes
app.use('/api/auth', authRoutes);
app.use('/api/livestock', livestockRoutes);
app.use('/api/health-records', healthRoutes);
app.use('/api/vaccinations', vaccinationRoutes);
app.use('/api/breeding', breedingRoutes);
app.use('/api/milk', milkRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reminders', reminderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use(errorHandler);

// Start Server immediately and connect to Database
const server = app.listen(env.port, () => {
  console.log(`=======================================================`);
  console.log(`SMART LIVESTOCK MANAGEMENT & DECISION SUPPORT SYSTEM`);
  console.log(`Backend Server running on: http://localhost:${env.port}`);
  console.log(`API Modules: /api/auth, /api/livestock, /api/health-records,`);
  console.log(`             /api/vaccinations, /api/breeding, /api/milk,`);
  console.log(`             /api/dashboard, /api/feed, /api/income,`);
  console.log(`             /api/expenses, /api/finance, /api/reminders,`);
  console.log(`             /api/notifications, /api/analytics, /api/reports`);
  console.log(`=======================================================`);

  // Non-blocking database connection
  connectDB();
});

export { app };
export default server;
