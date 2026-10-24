import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../sequelize';
export enum ProjectAction {
  Created = 'project.created',
  Updated = 'project.updated',
  Deleted = 'project.deleted',
}
export interface ActivityRecord {
  activity_event_id: string;
  user_id: string;
  project_id: string | null;
  resource_id: string;
  action: ProjectAction;
  outcome: 'completed';
  details: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
type Creation = Optional<ActivityRecord, 'activity_event_id' | 'created_at' | 'updated_at'>;
export const ActivityModel = sequelize.define<Model<ActivityRecord, Creation>>(
  'FigurActivity',
  {
    action: { allowNull: false, type: DataTypes.ENUM(...Object.values(ProjectAction)) },
    activity_event_id: { allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.BIGINT.UNSIGNED },
    created_at: { allowNull: false, type: DataTypes.DATE(3) },
    details: { allowNull: false, type: DataTypes.JSON },
    outcome: { allowNull: false, type: DataTypes.ENUM('completed') },
    project_id: {
      allowNull: true,
      onDelete: 'SET NULL',
      onUpdate: 'RESTRICT',
      references: { key: 'project_id', model: 'figur_projects' },
      type: DataTypes.BIGINT.UNSIGNED,
    },
    resource_id: { allowNull: false, type: DataTypes.BIGINT.UNSIGNED },
    updated_at: { allowNull: false, type: DataTypes.DATE(3) },
    user_id: { allowNull: false, type: DataTypes.BIGINT.UNSIGNED },
  },
  {
    createdAt: 'created_at',
    tableName: 'figur_activity_events',
    timestamps: true,
    underscored: true,
    updatedAt: 'updated_at',
  },
);
