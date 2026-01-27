import { Response } from 'express';
import { error } from '../client';

/**
 * Handle route errors consistently across all routes
 * @param res - Express response object
 * @param err - Error object or unknown error
 * @param fallbackMessage - Message to use if error is not an Error instance
 * @param statusCode - HTTP status code (default: 500)
 */
export function handleRouteError(
  res: Response,
  err: unknown,
  fallbackMessage: string,
  statusCode: number = 500
): void {
  console.error(`${fallbackMessage}:`, err);
  error(res, err instanceof Error ? err.message : fallbackMessage, statusCode);
}
