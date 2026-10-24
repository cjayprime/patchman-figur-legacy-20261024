const assert = require('node:assert/strict');
const { test } = require('node:test');
const settings = require('../lib/database/settings.cjs');
const {
  configureDatabaseProcess,
  databaseBudget,
  databaseInstance,
  databasePool,
} = require('../lib/database/pool.cjs');

test('source-owned launch policy reserves workers and one maintenance connection', () => {
  assert.equal(settings.total, 6);
  assert.equal(settings.workers, 0);
  assert.equal(Object.isFrozen(settings), true);
  assert.deepEqual(databaseBudget({ role: 'web' }, settings), { total: 6, workers: 0, role: 'web', maximum: 6 });
  assert.equal(databasePool({ role: 'maintenance' }).max, 1);
  assert.equal(databasePool().min, 0);
});

test('explicit allocations partition a policy without multiplying its budget', () => {
  const policy = { total: 7, workers: 2 };
  assert.equal(databasePool({ role: 'web' }, policy).max, 5);
  assert.equal(databasePool({ role: 'worker', workerIndex: 0 }, policy).max, 1);
  assert.equal(databasePool({ role: 'worker', workerIndex: 1 }, policy).max, 1);
  assert.equal(databasePool({ role: 'maintenance' }, policy).max, 1);
  assert.equal(databaseBudget({ role: 'worker', workerIndex: 1 }, policy).total, 7);
});

test('invalid policies and undeclared worker slots fail before opening a pool', () => {
  for (const total of [0, -1, 1.5, '6', Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => databasePool({ role: 'web' }, { total, workers: 0 }));
  }
  for (const workers of [-1, 1.5, '1', 2]) {
    assert.throws(() => databasePool({ role: 'web' }, { total: 2, workers }));
  }
  assert.throws(() => databasePool({ role: 'worker', workerIndex: 2 }, { total: 3, workers: 2 }));
  assert.throws(() => databasePool({ role: 'worker' }, { total: 6, workers: 0 }));
  assert.throws(() => databasePool({ role: 'worker', workerIndex: -1 }, { total: 6, workers: 1 }));
  assert.throws(() => databasePool({ role: 'maintenance', workerIndex: 0 }));
  assert.throws(() => databasePool({ role: 'unknown' }));
  assert.throws(() => databasePool({ unrelated_setting: '1' }));
});

test('process allocation is explicit, immutable and locked once its singleton exists', () => {
  const allocation = { role: 'worker', workerIndex: 0 };
  const policy = { total: 2, workers: 1 };
  configureDatabaseProcess(allocation, policy);
  allocation.role = 'web';
  policy.total = 99;
  assert.equal(databaseBudget().role, 'worker');
  assert.equal(databasePool().max, 1);
  configureDatabaseProcess({ role: 'web' }, { total: 2, workers: 0 });
  assert.equal(databasePool().max, 2);
  let created = 0;
  const name = 'budget-unit-figur';
  const first = databaseInstance(name, () => ({ instance: ++created }));
  const second = databaseInstance(name, () => ({ instance: ++created }));
  assert.equal(first, second);
  assert.equal(created, 1);
  assert.throws(() => configureDatabaseProcess({ role: 'maintenance' }), /before creating/);
});
