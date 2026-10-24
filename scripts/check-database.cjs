'use strict';
require('./check-node.cjs');
process.env.NODE_ENV ||= process.argv[2] || 'production';
const { Sequelize } = require('sequelize');
const config = require('../lib/database/config.cjs').production;
const database = new Sequelize(config.database, config.username, config.password, { ...config, logging: false });
(async () => {
  try {
    const q = database.getQueryInterface();
    for (const [table, key] of [
      ['figur_projects', 'project_id'],
      ['figur_activity_events', 'activity_event_id'],
    ]) {
      const columns = await q.describeTable(table);
      if (
        !columns[key]?.primaryKey ||
        columns[key].allowNull ||
        !/BIGINT.*UNSIGNED/i.test(columns[key].type) ||
        columns.id
      ) {
        throw new Error('Invalid fresh schema');
      }
      for (const field of table === 'figur_activity_events' ? ['user_id', 'resource_id'] : ['user_id']) {
        if (columns[field]?.allowNull || !/BIGINT.*UNSIGNED/i.test(columns[field]?.type || '')) {
          throw new Error('Invalid ownership schema');
        }
      }
      for (const [name, column] of Object.entries(columns)) {
        if (name.endsWith('_id') && !/BIGINT.*UNSIGNED/i.test(column.type)) {
          throw new Error('Invalid numeric relationship');
        }
      }
    }
    const references = await q.getForeignKeyReferencesForTable('figur_activity_events');
    if (
      !references.some(
        (key) =>
          key.columnName === 'project_id' &&
          key.referencedTableName === 'figur_projects' &&
          key.referencedColumnName === 'project_id',
      )
    ) {
      throw new Error('Missing project relationship');
    }
    const [constraints] = await database.query(
      "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND CONSTRAINT_TYPE = 'CHECK'",
    );
    for (const name of ['figur_projects_required', 'figur_activity_required']) {
      if (!constraints.some((constraint) => constraint.CONSTRAINT_NAME === name)) {
        throw new Error('Missing required-value constraint');
      }
    }
    console.log('Figur fresh numeric-key project schema verified.');
  } catch {
    console.error(
      'Figur requires its fresh numeric-key database and creation migration. Existing records were not changed.',
    );
    process.exitCode = 1;
  } finally {
    await database.close();
  }
})();
