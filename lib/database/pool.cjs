'use strict';
function integer(value, fallback, name, minimum) {
  if (value === undefined || value === '') return fallback;
  if (!/^\d+$/.test(String(value)) || !Number.isSafeInteger(Number(value)) || Number(value) < minimum) {
    throw new Error(name + ' must be an integer of at least ' + minimum + '.');
  }
  return Number(value);
}
function databaseBudget(env = process.env) {
  const total = integer(env.DATABASE_MAX_CONNECTIONS, 7, 'DATABASE_MAX_CONNECTIONS', 1);
  const workers = integer(env.DATABASE_WORKER_COUNT, 0, 'DATABASE_WORKER_COUNT', 0);
  if (workers >= total) throw new Error('Database workers must leave at least one REST connection.');
  const role = env.DATABASE_PROCESS_ROLE || 'web';
  if (!['web', 'worker', 'maintenance'].includes(role)) throw new Error('Invalid database process role.');
  if (role === 'worker') {
    const index = integer(env.DATABASE_WORKER_INDEX, 0, 'DATABASE_WORKER_INDEX', 0);
    if (index >= workers) throw new Error('Database worker exceeds the declared app budget.');
  }
  return { total, workers, role, maximum: role === 'web' ? total - workers : 1 };
}
function databasePool(env = process.env) {
  return { acquire: 30000, idle: 10000, max: databaseBudget(env).maximum, min: 0 };
}
/** @template T @param {string} name @param {() => T} factory @returns {T} */
function databaseInstance(name, factory) {
  const key = Symbol.for('patchman.sequelize.' + name);
  if (!globalThis[key]) globalThis[key] = factory();
  return globalThis[key];
}
module.exports = { databaseBudget, databaseInstance, databasePool };
