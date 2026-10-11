import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiHandler } from '../lib/api/wrapper';
import { ApiError } from '../lib/api/response';
import { RateLimiter } from '../lib/api/rate-limiter';

async function withServer(handler: ReturnType<typeof createApiHandler>, run: (url: string) => Promise<void>) {
  const server = http.createServer((request, response) => {
    const res = response as NextApiResponse;
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
      return res;
    };
    void handler(request as NextApiRequest, res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    await run(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

test('returned values use the standard response envelope', async () => {
  await withServer(createApiHandler({ get: () => ({ app: 'test' }) }), async (url) => {
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      status: true,
      message: 'Success',
      data: { app: 'test' },
    });
  });
});

test('method rejection includes Allow and the error envelope', async () => {
  await withServer(createApiHandler({ post: () => ({ ok: true }) }), async (url) => {
    const response = await fetch(url);
    assert.equal(response.status, 405);
    assert.equal(response.headers.get('allow'), 'POST');
    const body = await response.json();
    assert.equal(body.status, false);
    assert.ok(body.data.errors.length);
  });
});

test('handler errors retain their status and standard error details', async () => {
  await withServer(
    createApiHandler({
      get: () => {
        throw new ApiError(404, 'Missing item');
      },
    }),
    async (url) => {
      const response = await fetch(url);
      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), {
        status: false,
        message: 'Missing item',
        data: { errors: ['Missing item'] },
      });
    },
  );
});

test('delayed video bytes are never replaced or prefixed with JSON', async () => {
  const payload = Buffer.from([0, 0, 0, 24, 102, 116, 121, 112, 109, 112, 52, 50]);
  await withServer(
    createApiHandler(
      {
        get: (_req, res) => {
          res.setHeader('Content-Type', 'video/mp4');
          res.setHeader('Content-Length', payload.length);
          setTimeout(() => res.end(payload), 15);
        },
      },
      { response: 'stream' },
    ),
    async (url) => {
      const response = await fetch(url);
      assert.equal(response.headers.get('content-type'), 'video/mp4');
      assert.deepEqual(Buffer.from(await response.arrayBuffer()), payload);
    },
  );
});

test('SSE continues after its handler returns', async () => {
  await withServer(
    createApiHandler(
      {
        get: (_req, res) => {
          res.writeHead(200, { 'Content-Type': 'text/event-stream' });
          res.write(': connected\n\n');
          setTimeout(() => res.end('event: update\ndata: {"progress":100}\n\n'), 15);
        },
      },
      { response: 'stream' },
    ),
    async (url) => {
      const response = await fetch(url);
      assert.equal(await response.text(), ': connected\n\nevent: update\ndata: {"progress":100}\n\n');
    },
  );
});

test('disabling global limits preserves the per-account quota and expiry', () => {
  const limiter = new RateLimiter(2, 1, 1000);
  assert.equal(limiter.check('alice', false, 0).allowed, true);
  assert.equal(limiter.check('alice', false, 1).allowed, true);
  assert.equal(limiter.check('alice', false, 2).allowed, false);
  assert.equal(limiter.check('bob', false, 2).allowed, true);
  assert.equal(limiter.check('alice', false, 1000).allowed, true);
});

test('global capacity spans accounts and resets at the window boundary', () => {
  const limiter = new RateLimiter(10, 2, 1000);
  assert.equal(limiter.check('alice', true, 0).allowed, true);
  assert.equal(limiter.check('bob', true, 1).allowed, true);
  assert.equal(limiter.check('carol', true, 2).allowed, false);
  assert.equal(limiter.check('carol', true, 1000).allowed, true);
});
