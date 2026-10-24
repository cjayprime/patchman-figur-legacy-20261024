import { DataTypes, Model } from 'sequelize';
import type { Optional } from 'sequelize';
import { sequelize } from '../sequelize';
export enum ProjectTool {
  Photo = 'photo',
  Shape = 'shape',
  Compare = 'compare',
  Projects = 'projects',
  Advanced = 'advanced',
}
export interface ProjectRecord {
  project_id: string;
  user_id: string;
  name: string;
  active_tool: ProjectTool;
  revision: number;
  state: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}
type Creation = Optional<ProjectRecord, 'project_id' | 'created_at' | 'updated_at' | 'revision'>;
export const ProjectModel = sequelize.define<Model<ProjectRecord, Creation>>(
  'FigurProject',
  {
    active_tool: {
      allowNull: false,
      defaultValue: ProjectTool.Photo,
      type: DataTypes.ENUM(...Object.values(ProjectTool)),
    },
    created_at: { allowNull: false, type: DataTypes.DATE(3) },
    name: { allowNull: false, type: DataTypes.STRING(255) },
    project_id: { allowNull: false, autoIncrement: true, primaryKey: true, type: DataTypes.BIGINT.UNSIGNED },
    revision: { allowNull: false, defaultValue: 0, type: DataTypes.INTEGER.UNSIGNED },
    state: { allowNull: false, type: DataTypes.JSON },
    updated_at: { allowNull: false, type: DataTypes.DATE(3) },
    user_id: { allowNull: false, type: DataTypes.BIGINT.UNSIGNED },
  },
  {
    createdAt: 'created_at',
    tableName: 'figur_projects',
    timestamps: true,
    underscored: true,
    updatedAt: 'updated_at',
  },
);
