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
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await pool.end();
  process.exit(0);
});

export default app;
