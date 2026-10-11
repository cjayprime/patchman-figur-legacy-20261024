import { DataTypes, Model } from 'sequelize';
import * as database from '../sequelize';

export interface ProjectRecord {
  id: string;
  user_id: string;
  name: string;
  active_tool: string;
  state: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export const ProjectModel = database.sequelize.define<Model<ProjectRecord>>(
  'FigurProject',
  {
    active_tool: { allowNull: false, defaultValue: 'index', type: DataTypes.STRING(32) },
    created_at: { allowNull: false, type: DataTypes.DATE(3) },
    id: { primaryKey: true, type: DataTypes.STRING(64) },
    name: { allowNull: false, type: DataTypes.STRING(255) },
    state: { allowNull: false, defaultValue: {}, type: DataTypes.JSON },
    updated_at: { allowNull: false, type: DataTypes.DATE(3) },
    user_id: { allowNull: false, type: DataTypes.STRING(128) },
  },
  { tableName: 'figur_projects', timestamps: false, underscored: true },
);
