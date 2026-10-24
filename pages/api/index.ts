import { databaseBudget } from '../../lib/database/pool.cjs';
import { createApiHandler, sendSuccess } from '../../lib/api';

export const FIGUR_API_REGISTRY = [
  { methods: ['GET'], path: '/api/account/status' },
  { methods: ['GET'], path: '/api' },
  { methods: ['GET'], path: '/api/account' },
  { methods: ['GET'], path: '/api/activity' },
  { methods: ['GET', 'POST'], path: '/api/projects' },
  { methods: ['GET', 'PATCH', 'DELETE'], path: '/api/projects/:id' },
] as const;

export default createApiHandler({
  get(_req, res) {
    return sendSuccess(
      res,
      {
        app: 'Figur',
        database_budget: databaseBudget(),
        endpoints: FIGUR_API_REGISTRY,
        health: {
          checkedAt: new Date().toISOString(),
          status: 'up',
          uptimeSeconds: Math.floor(process.uptime()),
        },
        totalRoutes: FIGUR_API_REGISTRY.length,
        version: '1.0.0',
      },
      'Figur API registry',
    );
  },
});
