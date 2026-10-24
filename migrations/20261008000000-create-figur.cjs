'use strict';
module.exports = {
  async up(q, S) {
    const existing = await q.showAllTables();
    if (existing.some((table) => ['figur_projects', 'figur_activity_events'].includes(table))) {
      throw new Error('Figur requires a fresh database. Existing records were not converted or reset.');
    }
    const key = { type: S.BIGINT.UNSIGNED, allowNull: false }, timestamp = { type: S.DATE(3), allowNull: false };
    await q.createTable('figur_projects', {
      project_id: { ...key, autoIncrement: true, primaryKey: true }, user_id: key,
      name: { type: S.STRING(255), allowNull: false },
      active_tool: { type: S.ENUM('photo', 'shape', 'compare', 'projects', 'advanced'), allowNull: false, defaultValue: 'photo' },
      revision: { type: S.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
      state: { type: S.JSON, allowNull: false }, created_at: timestamp, updated_at: timestamp,
    });
    await q.addIndex('figur_projects', ['user_id', 'updated_at'], { name: 'figur_projects_owner_updated' });
    await q.sequelize.query("ALTER TABLE figur_projects ADD CONSTRAINT figur_projects_required CHECK (user_id > 0 AND CHAR_LENGTH(TRIM(name)) > 0 AND active_tool <> '')");
    await q.createTable('figur_activity_events', {
      activity_event_id: { ...key, autoIncrement: true, primaryKey: true }, user_id: key,
      project_id: { type: S.BIGINT.UNSIGNED, allowNull: true, references: { model: 'figur_projects', key: 'project_id' }, onDelete: 'SET NULL', onUpdate: 'RESTRICT' },
      resource_id: key, action: { type: S.ENUM('project.created', 'project.updated', 'project.deleted'), allowNull: false },
      outcome: { type: S.ENUM('completed'), allowNull: false }, details: { type: S.JSON, allowNull: false },
      created_at: timestamp, updated_at: timestamp,
    });
    await q.addIndex('figur_activity_events', ['user_id', 'project_id', 'created_at'], { name: 'figur_activity_owner_project_time' });
    await q.sequelize.query("ALTER TABLE figur_activity_events ADD CONSTRAINT figur_activity_required CHECK (user_id > 0 AND resource_id > 0 AND action <> '' AND outcome <> '')");
  },
  async down() { throw new Error('Restore a reviewed backup to reverse the initial Figur schema.'); },
};
