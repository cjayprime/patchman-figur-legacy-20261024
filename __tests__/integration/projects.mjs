import maintenance from '../helpers/database-maintenance.cjs';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { Sequelize, QueryTypes } from 'sequelize';
import '../register.mjs';
const root = fileURLToPath(new URL('../..', import.meta.url));
process.chdir(root);
const require = createRequire(import.meta.url);
const configuration = maintenance.testDatabaseConfiguration(require('../../lib/database/config.cjs').test);
assert(['localhost', '127.0.0.1', '::1'].includes(configuration.host), 'Project checks require isolated local MySQL.');
const name = `patchman_test_figur_projects_${process.pid}_${Date.now()}`;
assert.match(name, /^patchman_test_figur_projects_[0-9]+_[0-9]+$/);
const operator = new Sequelize(
  maintenance.testDatabaseConfiguration({ ...configuration, database: '', logging: false, pool: { min: 0, max: 1 } }),
);
let created = false,
  database;
try {
  await maintenance.createTestDatabase(operator, name);
  created = true;
  Object.assign(process.env, { DATABASE_NAME: name });
  const { sequelize } = await import('../../lib/sequelize.ts');
  database = sequelize;
  const migration = require('../../migrations/20261008000000-create-figur.cjs');
  await migration.up(database.getQueryInterface(), Sequelize);
  await assert.rejects(() => migration.up(database.getQueryInterface(), Sequelize), /fresh database/);
  for (const [table, key] of [
    ['figur_projects', 'project_id'],
    ['figur_activity_events', 'activity_event_id'],
  ]) {
    const columns = await database.getQueryInterface().describeTable(table);
    assert(columns[key].primaryKey);
    assert(!columns.id);
    for (const [column, spec] of Object.entries(columns)) {
      if (column.endsWith('_id')) {
        assert.match(spec.type, /BIGINT.*UNSIGNED/i);
      }
    }
    assert.equal(columns.user_id.allowNull, false);
    await database.query(`ALTER TABLE ${table} AUTO_INCREMENT = 9007199254740993`);
  }
  const { createProject, getProject, listProjects, updateProject, deleteProject, listActivity } =
    await import('../../lib/projects/service.ts');
  const { ActivityModel } = await import('../../lib/models/Activity.ts');
  const { ProjectModel } = await import('../../lib/models/Project.ts');
  const owner = '9007199254740994',
    stranger = '9007199254740995';
  const project = await createProject(owner, 'Private portrait');
  assert.equal(project.project_id, '9007199254740993');
  assert.equal(project.id, project.project_id);
  assert.equal(project.user_id, owner);
  assert.deepEqual(project.state, { version: 1 });
  assert.equal(project.revision, 0);
  assert.equal((await listProjects(owner)).projects[0].id, project.id);
  assert.deepEqual((await listProjects(stranger)).projects, []);
  assert.equal((await getProject(owner, project.id)).id, project.id);
  for (const run of [
    () => getProject(stranger, project.id),
    () => updateProject(stranger, project.id, { expectedRevision: 0 }),
    () => deleteProject(stranger, project.id),
  ]) {
    await assert.rejects(run, { statusCode: 404 });
  }
  await assert.rejects(() => createProject('not-an-account', 'Bad'), { statusCode: 400 });
  await assert.rejects(() => createProject(owner, '  '), { statusCode: 400 });
  for (const state of [null, [], {}, { version: 2 }]) {
    await assert.rejects(() => updateProject(owner, project.id, { expectedRevision: 0, state }), { statusCode: 400 });
  }
  await assert.rejects(() => updateProject(owner, project.id, { expectedRevision: 0, active_tool: 'not-a-tool' }), {
    statusCode: 400,
  });
  const attempts = await Promise.allSettled([
    updateProject(owner, project.id, {
      expectedRevision: 0,
      name: 'First',
      active_tool: 'shape',
      state: { version: 1, sliders: { waist: 17 }, source: 'private-test-bytes' },
    }),
    updateProject(owner, project.id, {
      expectedRevision: 0,
      name: 'Second',
      active_tool: 'shape',
      state: { version: 1, sliders: { waist: 23 }, source: 'private-test-bytes' },
    }),
  ]);
  assert.equal(attempts.filter((attempt) => attempt.status === 'fulfilled').length, 1);
  assert.equal(attempts.find((attempt) => attempt.status === 'rejected').reason.statusCode, 409);
  const saved = await getProject(owner, project.id);
  assert.equal(saved.revision, 1);
  assert.equal(saved.active_tool, 'shape');
  assert.equal(saved.state.source, 'private-test-bytes');
  assert([17, 23].includes(saved.state.sliders.waist));
  const history = await listActivity(owner, project.id);
  assert.equal(history.items.length, 2);
  assert.equal(history.items[1].activity_event_id, '9007199254740993');
  assert.equal(typeof history.items[0].resource_id, 'string');
  assert.equal(history.items[0].user_id, owner);
  assert.equal(history.items[0].created_at instanceof Date, true);
  assert(!JSON.stringify(history).includes('private-test-bytes'));
  assert.deepEqual((await listActivity(stranger)).items, []);
  assert.equal((await listActivity(owner, project.id, history.items[0].activity_event_id)).items.length, 1);
  const rows = await database.query(
    "SELECT COLUMN_NAME, COLUMN_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = :name AND COLUMN_NAME LIKE '%\\_id'",
    { replacements: { name }, type: QueryTypes.SELECT },
  );
  assert.equal(rows.length, 6);
  for (const row of rows) {
    assert.match(row.COLUMN_TYPE, /^bigint unsigned$/i);
  }
  await assert.rejects(() =>
    database.query('UPDATE figur_projects SET user_id = NULL WHERE project_id = :id', {
      replacements: { id: project.id },
    }),
  );
  await assert.rejects(() =>
    ActivityModel.create({
      user_id: owner,
      project_id: '1',
      resource_id: '1',
      action: 'project.created',
      outcome: 'completed',
      details: {},
    }),
  );
  await deleteProject(owner, project.id);
  assert.equal(await ProjectModel.count(), 0);
  const audit = await listActivity(owner, project.id);
  assert.equal(audit.items.length, 3);
  assert(audit.items.every((item) => item.project_id === null && item.resource_id === project.id));
  assert.equal(audit.items[0].action, 'project.deleted');
  await database.close();
  await assert.rejects(() => listProjects(owner), /closed|connection/i);
  console.log(
    'PASS Figur: fresh unsigned BIGINT keys, exact large IDs, required ownership, private state, revision conflicts, durable audit, real foreign keys and no database fallback.',
  );
} finally {
  if (database) {
    await database.close();
  }
  if (created) {
    await maintenance.dropTestDatabase(operator, name);
  }
  await operator.close();
}
