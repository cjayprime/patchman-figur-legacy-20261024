import type { NextApiRequest, NextApiResponse } from 'next';

export interface ApiResponse<T = unknown> {
  status: boolean;
  message: string;
  data: T;
}

export type ApiMethodHandler = (req: NextApiRequest, res: NextApiResponse) => unknown | Promise<unknown>;

export interface ApiHandlerMap {
  get?: ApiMethodHandler;
  post?: ApiMethodHandler;
  put?: ApiMethodHandler;
  patch?: ApiMethodHandler;
  delete?: ApiMethodHandler;
  head?: ApiMethodHandler;
  options?: ApiMethodHandler;
}

export interface ApiHandlerOptions {
  /** Streaming handlers own the response lifetime, including before headers are flushed. */
  response?: 'json' | 'stream';
}
