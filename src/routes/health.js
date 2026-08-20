import { Router } from 'express';

const router = Router();

/**
 * Health check stub — returns HTTP 200 with a simple status payload.
 */
router.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

export default router;
