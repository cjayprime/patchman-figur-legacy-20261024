import { DataTypes, Model } from 'sequelize';
import * as database from '../sequelize';

export const ActivityModel = database.sequelize.define<Model>(
  'FigurActivity',
  {
    action: { allowNull: false, type: DataTypes.STRING(64) },
    created_at: { allowNull: false, type: DataTypes.DATE(3) },
    details: { allowNull: false, defaultValue: {}, type: DataTypes.JSON },
    id: { primaryKey: true, type: DataTypes.STRING(36) },
    outcome: { allowNull: false, type: DataTypes.ENUM('running', 'completed', 'failed') },
    project_id: { allowNull: true, type: DataTypes.STRING(64) },
    updated_at: { allowNull: false, type: DataTypes.DATE(3) },
    user_id: { allowNull: false, type: DataTypes.STRING(128) },
  },
  { tableName: 'figur_activity_events', timestamps: false, underscored: true },
);
