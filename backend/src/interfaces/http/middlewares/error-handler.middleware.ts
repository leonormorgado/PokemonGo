import type { NextFunction, Request, Response } from 'express';
import { NotFoundError, ValidationError } from '../../../shared/errors.js';
import { HttpClientError } from '../../../infrastructure/http-clients/http-client.js';
import { logger } from '../../../shared/logger.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({ error: err.message });
    return;
  }
  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }
  if (err instanceof HttpClientError) {
    res.status(err.status && err.status >= 400 && err.status < 500 ? err.status : 502).json({
      error: err.message,
    });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}
