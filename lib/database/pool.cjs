'use strict';
/* global globalThis */
const settings = require('./settings.cjs');
const stateKey = Symbol.for(`patchman.database.process.${settings.app}`);
function processState() {
  if (!globalThis[stateKey]) {
    globalThis[stateKey] = { allocation: Object.freeze({ role: 'web' }), policy: settings, initialized: false };
  }
  return globalThis[stateKey];
}
function integer(value, name, minimum) {
  if (!Number.isSafeInteger(value) || value < minimum) {
    throw new Error(`${name} must be an integer of at least ${minimum}.`);
  }
  return value;
}
function allocationBudget(allocation, policy) {
  const total = integer(policy.total, 'Application connection budget', 1);
  const workers = integer(policy.workers, 'Declared database worker count', 0);
  if (workers >= total) {
    throw new Error('Database workers must leave at least one REST connection.');
  }
  if (
    !allocation ||
    typeof allocation !== 'object' ||
    Array.isArray(allocation) ||
    Object.keys(allocation).some((key) => !['role', 'workerIndex'].includes(key))
  ) {
    throw new Error('Database allocation accepts only an explicit role and workerIndex.');
  }
  const role = allocation.role === undefined ? 'web' : allocation.role;
  if (!['web', 'worker', 'maintenance'].includes(role)) {
    throw new Error('Invalid database process role.');
  }
  if (role === 'worker') {
    const index = integer(allocation.workerIndex ?? 0, 'Database worker index', 0);
    if (index >= workers) {
      throw new Error('Database worker exceeds the declared app budget.');
    }
  } else if (allocation.workerIndex !== undefined) {
    throw new Error('Only database workers select a worker index.');
  }
  return { total, workers, role, maximum: role === 'web' ? total - workers : 1 };
}
function databaseBudget(allocation = processState().allocation, policy = processState().policy) {
  return allocationBudget(allocation, policy);
}
function databasePool(allocation = processState().allocation, policy = processState().policy) {
  return { acquire: 30000, idle: 10000, max: databaseBudget(allocation, policy).maximum, min: 0 };
}
// Call before importing the runtime database in an explicitly owned worker or maintenance process.
// Tests can inject a small source-level policy without changing application environment files.
function configureDatabaseProcess(allocation, policy = settings) {
  const state = processState();
  if (state.initialized) {
    throw new Error('Configure database allocation before creating the process singleton.');
  }
  allocationBudget(allocation, policy);
  state.allocation = Object.freeze({ ...allocation });
  state.policy = Object.freeze({ ...policy });
}
/** @template T @param {string} name @param {() => T} factory @returns {T} */
function databaseInstance(name, factory) {
  const key = Symbol.for(`patchman.sequelize.${name}`);
  const state = processState();
  if (!globalThis[key]) {
    const previous = state.initialized;
    state.initialized = true;
    try {
      globalThis[key] = factory();
    } catch (error) {
      state.initialized = previous;
      throw error;
    }
  }
  state.initialized = true;
  return globalThis[key];
}
module.exports = { configureDatabaseProcess, databaseBudget, databaseInstance, databasePool };
