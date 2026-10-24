const assert = require('node:assert/strict');
const { test } = require('node:test');
const { databaseBudget, databasePool } = require('../lib/database/pool.cjs');
test('app connection budget reserves direct workers without multiplying pools', () => {
  assert.equal(databasePool({}).max, 7);
  assert.equal(databasePool({ DATABASE_MAX_CONNECTIONS: '7', DATABASE_WORKER_COUNT: '1' }).max, 6);
  assert.equal(databasePool({ DATABASE_MAX_CONNECTIONS: '7', DATABASE_WORKER_COUNT: '2' }).max, 5);
  const worker = {
    DATABASE_MAX_CONNECTIONS: '7',
    DATABASE_WORKER_COUNT: '2',
    DATABASE_PROCESS_ROLE: 'worker',
    DATABASE_WORKER_INDEX: '1',
  };
  assert.equal(databasePool(worker).max, 1);
  assert.equal(databaseBudget(worker).total, 7);
  assert.equal(databasePool({ ...worker, DATABASE_PROCESS_ROLE: 'maintenance' }).max, 1);
  for (const bad of ['0', '-1', '1.5', 'garbage', 'Infinity']) {
    assert.throws(() => databasePool({ DATABASE_MAX_CONNECTIONS: bad }));
  }
  assert.throws(() => databasePool({ DATABASE_MAX_CONNECTIONS: '2', DATABASE_WORKER_COUNT: '2' }));
  assert.throws(() => databasePool({ ...worker, DATABASE_WORKER_INDEX: '2' }));
});
