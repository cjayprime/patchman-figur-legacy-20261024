'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('figur_projects', {
      id: { type: Sequelize.STRING(64), primaryKey: true },
      user_id: { type: Sequelize.STRING(128), allowNull: false },
      name: { type: Sequelize.STRING(255), allowNull: false },
      active_tool: { type: Sequelize.STRING(32), allowNull: false, defaultValue: 'index' },
      state: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('figur_projects', ['user_id', 'updated_at'], {
      name: 'figur_projects_owner_updated',
    });
    await queryInterface.createTable('figur_activity_events', {
      id: { type: Sequelize.STRING(36), primaryKey: true },
      user_id: { type: Sequelize.STRING(128), allowNull: false },
      project_id: Sequelize.STRING(64),
      action: { type: Sequelize.STRING(64), allowNull: false },
      outcome: { type: Sequelize.ENUM('running', 'completed', 'failed'), allowNull: false },
      details: { type: Sequelize.JSON, allowNull: false },
      created_at: { type: Sequelize.DATE(3), allowNull: false },
      updated_at: { type: Sequelize.DATE(3), allowNull: false },
    });
    await queryInterface.addIndex('figur_activity_events', ['user_id', 'project_id', 'created_at'], {
      name: 'figur_activity_owner_project_time',
    });
  },
  async down() {
    throw new Error('Restore a reviewed backup to reverse the initial Figur schema.');
  },
};
