import { Request, Response, NextFunction } from 'express';

/**
 * Global central Express error handling middleware.
 * Logs and returns a standardized JSON structure for any unhandled routing/controller exceptions.
 */
export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('[ErrorHandler] Caught exception:', err.stack || err.message);

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred on the server.',
  });
}
