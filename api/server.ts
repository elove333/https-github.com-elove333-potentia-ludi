// Example Express server integration for the Planner → Executor pipeline
import express from 'express';
import cors from 'cors';
import { pool, limitsQueries } from './lib/database';

// Import route handlers
import { POST as nonceHandler } from './routes/siwe/nonce';
import { POST as verifyHandler } from './routes/siwe/verify';
import { POST as logoutHandler } from './routes/siwe/logout';
import { POST as submitHandler } from './routes/intents/submit';
import { POST as buildHandler } from './routes/intents/build';
import { GET as getHandler } from './routes/intents/get';
// API Server
// Express server for the Conversational Web3 Wallet Hub

import express from 'express';
import cookieParser from 'cookie-parser';
import { checkDatabaseHealth, closeDatabaseConnection } from './lib/database';
import {
  corsMiddleware,
  requestLogger,
  errorHandler,
  HealthCheckResponse
} from './client';

// Import routes
import nonceRouter from './routes/siwe/nonce';
import verifyRouter from './routes/siwe/verify';
import logoutRouter from './routes/siwe/logout';
import submitIntentRouter from './routes/intents/submit';
import buildIntentRouter from './routes/intents/build';
import getIntentRouter from './routes/intents/get';
import gameEventTransferRouter from './routes/webhooks/game-event-transfer';
import testWebhookRouter from './routes/webhooks/test';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Helper to convert route handlers to Express handlers
const adaptHandler = (handler: Function) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      const request = new Request(`http://localhost${req.url}`, {
        method: req.method,
        headers: req.headers as any,
        body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
      });

      const response = await handler(request, { params: req.params });
      const data = await response.json();
      
      res.status(response.status).json(data);
    } catch (error: any) {
      console.error('Handler error:', error);
      res.status(500).json({ error: error.message });
    }
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// SIWE routes
app.post('/api/siwe/nonce', adaptHandler(nonceHandler));
app.post('/api/siwe/verify', adaptHandler(verifyHandler));
app.post('/api/siwe/logout', adaptHandler(logoutHandler));

// Intent routes
app.post('/api/intents/submit', adaptHandler(submitHandler));
app.post('/api/intents/build', adaptHandler(buildHandler));
app.get('/api/intents/:id', adaptHandler(getHandler));

// Scheduled jobs
function setupScheduledJobs() {
  // Reset daily limits every 24 hours
  setInterval(async () => {
    try {
      const count = await limitsQueries.resetDaily();
      console.log(`Reset daily limits for ${count} users`);
    } catch (error) {
      console.error('Error resetting daily limits:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Planner → Executor API server running on port ${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 SIWE endpoints: http://localhost:${PORT}/api/siwe/*`);
  console.log(`🎯 Intent endpoints: http://localhost:${PORT}/api/intents/*`);
  
  setupScheduledJobs();
app.use(express.json());
app.use(cookieParser());
app.use(corsMiddleware);
app.use(requestLogger);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  
  const response: HealthCheckResponse = {
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy,
    version: process.env.npm_package_version || '1.0.0'
  };

  res.status(dbHealthy ? 200 : 503).json(response);
});

// API Routes

// SIWE Authentication
app.use('/api/siwe/nonce', nonceRouter);
app.use('/api/siwe/verify', verifyRouter);
app.use('/api/siwe/logout', logoutRouter);

// Intent Management
app.use('/api/intents/submit', submitIntentRouter);
app.use('/api/intents/build', buildIntentRouter);
app.use('/api/intents', getIntentRouter);

// Webhook endpoints
app.use('/api/webhooks/game-event-transfer', gameEventTransferRouter);
app.use('/api/webhooks/test', testWebhookRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });

  await closeDatabaseConnection();
  console.log('Database connections closed');
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

  console.log('SIGINT received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });

  await closeDatabaseConnection();
  console.log('Database connections closed');
  
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;
