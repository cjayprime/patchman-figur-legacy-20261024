import type { NextApiRequest, NextApiResponse } from 'next';
import { checkRateLimit } from './rate-limiter';
import { sendError, sendSuccess } from './response';
import type { ApiHandlerMap, ApiHandlerOptions } from './types';

export * from './types';
export * from './rate-limiter';
export * from './response';

export function createApiHandler(handlers: ApiHandlerMap, options: ApiHandlerOptions = {}) {
  return async function handler(req: NextApiRequest, res: NextApiResponse) {
    const method = (req.method ?? 'GET').toLowerCase();
    const methodHandler = Object.prototype.hasOwnProperty.call(handlers, method)
      ? handlers[method as keyof ApiHandlerMap]
      : undefined;
    if (!methodHandler) {
      res.setHeader(
        'Allow',
        Object.keys(handlers)
          .map((key) => key.toUpperCase())
          .join(', '),
      );
      return sendError(res, 'Method not allowed', [], 405);
    }
    const rate = checkRateLimit(req);
    if (!rate.allowed) {
      res.setHeader('Retry-After', String(rate.retryAfter ?? 60));
      return sendError(res, rate.message ?? 'Rate limit exceeded', [], 429);
    }
    try {
      const result = await methodHandler(req, res);
      if (res.writableEnded || res.headersSent || options.response === 'stream') {
        return;
      }
      if (result === res) {
        return;
      }
      if (result && typeof result === 'object' && 'status' in result && 'message' in result && 'data' in result) {
        return res.json(result);
      }
      return sendSuccess(res, result ?? {});
    } catch (error: unknown) {
      if (res.writableEnded) {
        return;
      }
      if (res.headersSent) {
        res.destroy(error instanceof Error ? error : undefined);
        return;
      }
      const candidate = error as {
        statusCode?: number;
        status?: number;
        message?: string;
      };
      const code = candidate?.statusCode ?? candidate?.status ?? 500;
      const statusCode = Number.isInteger(code) && code >= 400 && code <= 599 ? code : 500;
      return sendError(res, candidate?.message ?? 'Internal server error', [], statusCode);
    }
  };
}
