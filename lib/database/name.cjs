'use strict';
const SYSTEM_SCHEMAS = new Set(['mysql', 'information_schema', 'performance_schema', 'sys', 'ndbinfo']);
function databaseName(value) {
  if (
    typeof value !== 'string' ||
    !/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(value) ||
    SYSTEM_SCHEMAS.has(value.toLowerCase())
  ) {
    throw new Error('Set DATABASE_NAME to an explicit, valid application database name outside MySQL system schemas.');
  }
  return value;
}
module.exports = { databaseName };
