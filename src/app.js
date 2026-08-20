/**
 * @fileoverview Express application factory for the Relay Notes API.
 */

import express from 'express';

import { errorHandler } from './middleware/errorHandler.js';

/**
 * Creates and configures the Express application.
 *
 * Route modules are mounted before the central error handler so thrown domain
 * errors propagate into {@link errorHandler}.
 *
 * @returns {import('express').Express}
 */
export function createApp() {
  const app = express();

  app.use(express.json());

  // Route definitions will be registered here in later stories.

  app.use(errorHandler);

  return app;
}

const app = createApp();

export default app;
