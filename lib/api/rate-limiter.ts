import type { NextApiRequest } from 'next';

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  allowed: boolean;
  message?: string;
  retryAfter?: number;
}

export class RateLimiter {
  private readonly accounts = new Map<string, RateLimitBucket>();
  private global: RateLimitBucket = { count: 0, resetAt: 0 };
  private nextSweep = 0;

  private readonly accountLimit: number;
  private readonly globalLimit: number;
  private readonly windowMs: number;

  constructor(accountLimit = 60, globalLimit = 500, windowMs = 60_000) {
    this.accountLimit = accountLimit;
    this.globalLimit = globalLimit;
    this.windowMs = windowMs;
  }

  check(key: string, globalEnabled: boolean, now = Date.now()): RateLimitResult {
    if (now >= this.nextSweep) {
      for (const [id, bucket] of this.accounts) {
        if (now >= bucket.resetAt) {
          this.accounts.delete(id);
        }
      }
      this.nextSweep = now + this.windowMs;
    }
    const account = this.accounts.get(key) ?? {
      count: 0,
      resetAt: now + this.windowMs,
    };
    if (now >= account.resetAt) {
      account.count = 0;
      account.resetAt = now + this.windowMs;
    }
    this.accounts.set(key, account);
    if (account.count >= this.accountLimit) {
      return {
        allowed: false,
        message: 'Request limit reached. Please try again shortly.',
        retryAfter: Math.max(1, Math.ceil((account.resetAt - now) / 1000)),
      };
    }
    if (globalEnabled) {
      if (now >= this.global.resetAt) {
        this.global = { count: 0, resetAt: now + this.windowMs };
      }
      if (this.global.count >= this.globalLimit) {
        return {
          allowed: false,
          message: 'Service capacity reached. Please try again shortly.',
          retryAfter: Math.max(1, Math.ceil((this.global.resetAt - now) / 1000)),
        };
      }
      this.global.count += 1;
    }
    account.count += 1;
    return { allowed: true };
  }
}

const limiter = new RateLimiter();

export function checkRateLimit(req: NextApiRequest, verifiedAccountId?: string): RateLimitResult {
  // Client-supplied identity and proxy headers are not authentication.
  const key = verifiedAccountId ? `account:${verifiedAccountId}` : `ip:${req.socket.remoteAddress ?? 'unknown'}`;
  return limiter.check(key, process.env.ENABLE_GLOBAL_RATE_LIMIT !== 'false');
}
