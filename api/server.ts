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
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(() => {
    console.log('HTTP server closed');
  });

  await closeDatabaseConnection();
  console.log('Database connections closed');
  
  process.exit(0);
});

process.on('SIGINT', async () => {
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
