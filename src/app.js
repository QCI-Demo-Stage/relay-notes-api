import express from 'express';
import healthRouter from './routes/health.js';

/**
 * Creates and configures the Express application.
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(healthRouter);

  return app;
}

const app = createApp();

export default app;
