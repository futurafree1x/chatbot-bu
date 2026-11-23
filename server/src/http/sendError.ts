import type { Response } from 'express';
import type { ApiErrorBody, ApiErrorCode } from '@hendrix/shared';

/**
 * Sends an error in the shape the API contract requires: `{ error: { code, message } }`.
 * Never includes a stack trace or internal details (NFR-12).
 *
 * @param res - The Express response to send on.
 * @param status - HTTP status code, e.g. 400.
 * @param code - Machine-readable error code from the contract.
 * @param message - Short, human-readable explanation.
 */
export function sendError(res: Response, status: number, code: ApiErrorCode, message: string): void {
  const body: ApiErrorBody = { error: { code, message } };
  res.status(status).json(body);
}