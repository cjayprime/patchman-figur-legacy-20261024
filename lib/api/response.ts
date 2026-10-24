import { publicFailure } from './public-error';
import type { NextApiResponse } from 'next';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly retryAfter?: number;

  constructor(statusCode: number, message: string, retryAfter?: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.retryAfter = retryAfter;
  }
}

export function sendSuccess<T>(res: NextApiResponse, data: T, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({ data, message, status: true });
}

export function sendError(res: NextApiResponse, message = 'Error', errors: string[] = [], statusCode = 400) {
  const failure = publicFailure(statusCode, message);
  if (failure.code) {
    console.error('[api]', { code: failure.code, status: statusCode });
  }
  return res.status(statusCode).json({
    data: {
      ...(failure.code ? { code: failure.code } : {}),
      errors: failure.code
        ? [failure.message]
        : errors.length
          ? errors.map((item) => publicFailure(statusCode, item).message)
          : [failure.message],
    },
    message: failure.message,
    status: false,
  });
}
