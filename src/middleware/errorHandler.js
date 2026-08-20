/**
 * @fileoverview Central Express error-handling middleware.
 *
 * Maps domain errors that expose a numeric `status` property to HTTP responses
 * and falls back to 500 for unexpected failures.
 */

/**
 * Express error middleware: `(err, req, res, next)`.
 *
 * @param {Error & { status?: number }} err Thrown error (domain or unexpected).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export function errorHandler(err, req, res, next) {
  // Express requires the 4-argument signature to treat this as error middleware.
  void next;

  const status = typeof err?.status === 'number' ? err.status : 500;

  res.status(status).json({
    error: err?.name ?? 'Error',
    message: err?.message ?? 'Internal Server Error',
  });
}

export default errorHandler;
