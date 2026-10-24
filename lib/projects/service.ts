import { portraitDocument } from '../editor-document';
import { Op } from 'sequelize';
import { sequelize } from '../sequelize';
import { ProjectModel, ProjectTool } from '../models/Project';
import type { ProjectRecord } from '../models/Project';
import { ActivityModel, ProjectAction } from '../models/Activity';
import { ApiError } from '../api';
import { identifier } from './identifiers';

function label(value: unknown) {
  const name = typeof value === 'string' ? value.trim() : '';
  if (!name || name.length > 255 || /[\u0000-\u001f]/.test(name)) {
    throw new ApiError(400, 'Give your project a name of up to 255 characters.');
  }
  return name;
}
function serialize(record: ProjectRecord) {
  return {
    ...record,
    id: String(record.project_id),
    project_id: String(record.project_id),
    user_id: String(record.user_id),
  };
}
function validateState(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || (value as { version?: unknown }).version !== 1) {
    throw new ApiError(400, 'The project state must use the supported version.');
  }
  try {
    if ((value as { portrait?: unknown }).portrait !== undefined) {
      portraitDocument((value as { portrait: unknown }).portrait);
    }
    const text = JSON.stringify(value);
    if (Buffer.byteLength(text) > 20 * 1024 * 1024) {
      throw new Error('Too large');
    }
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new ApiError(400, 'The project state is invalid or exceeds the 20 MB limit.');
  }
}
export async function listProjects(owner: string, before?: unknown) {
  identifier(owner, 'account');
  const cursor = before === undefined ? undefined : identifier(before, 'project');
  const rows = await ProjectModel.findAll({
    attributes: ['project_id', 'name', 'updated_at'],
    limit: 100,
    order: [['project_id', 'DESC']],
    where: { user_id: owner, ...(cursor ? { project_id: { [Op.lt]: cursor } } : {}) },
  });
  return {
    nextCursor: rows.length === 100 ? String(rows[rows.length - 1].getDataValue('project_id')) : null,
    projects: rows.map((row) => ({
      id: String(row.getDataValue('project_id')),
      name: row.getDataValue('name'),
      updated_at: row.getDataValue('updated_at'),
    })),
  };
}
export async function getProject(owner: string, id: string) {
  const row = await ProjectModel.findOne({
    where: { project_id: identifier(id, 'project'), user_id: identifier(owner, 'account') },
  });
  if (!row) {
    throw new ApiError(404, 'Project not found.');
  }
  return serialize(row.get({ plain: true }));
}
export async function createProject(owner: string, name: unknown) {
  identifier(owner, 'account');
  const validName = label(name);
  return sequelize.transaction(async (transaction) => {
    const project = await ProjectModel.create(
      { active_tool: ProjectTool.Photo, name: validName, state: { version: 1 }, user_id: owner },
      { transaction },
    );
    const id = String(project.getDataValue('project_id'));
    await ActivityModel.create(
      {
        action: ProjectAction.Created,
        details: {},
        outcome: 'completed',
        project_id: id,
        resource_id: id,
        user_id: owner,
      },
      { transaction },
    );
    return serialize(project.get({ plain: true }));
  });
}
export async function updateProject(
  owner: string,
  id: string,
  input: { name?: unknown; state?: unknown; active_tool?: unknown; expectedRevision?: unknown },
) {
  identifier(owner, 'account');
  identifier(id, 'project');
  return sequelize.transaction(async (transaction) => {
    const row = await ProjectModel.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
      where: { project_id: id, user_id: owner },
    });
    if (!row) {
      throw new ApiError(404, 'Project not found.');
    }
    if (input.expectedRevision !== row.getDataValue('revision')) {
      throw new ApiError(
        409,
        'This project changed in another window. Keep your local work and reopen the saved project.',
      );
    }
    const tool = input.active_tool === undefined ? row.getDataValue('active_tool') : input.active_tool;
    if (!Object.values(ProjectTool).includes(tool as ProjectTool)) {
      throw new ApiError(400, 'Choose a supported editing section.');
    }
    const changes = {
      active_tool: tool as ProjectTool,
      name: input.name === undefined ? row.getDataValue('name') : label(input.name),
      revision: row.getDataValue('revision') + 1,
      state: input.state === undefined ? row.getDataValue('state') : validateState(input.state),
    };
    await row.update(changes, { transaction });
    await ActivityModel.create(
      {
        action: ProjectAction.Updated,
        details: {
          changed_fields: Object.keys(input).filter((key) => ['name', 'state', 'active_tool'].includes(key)),
          revision: changes.revision,
        },
        outcome: 'completed',
        project_id: id,
        resource_id: id,
        user_id: owner,
      },
      { transaction },
    );
    return serialize(row.get({ plain: true }));
  });
}
export async function deleteProject(owner: string, id: string) {
  identifier(owner, 'account');
  identifier(id, 'project');
  await sequelize.transaction(async (transaction) => {
    const row = await ProjectModel.findOne({
      lock: transaction.LOCK.UPDATE,
      transaction,
      where: { project_id: id, user_id: owner },
    });
    if (!row) {
      throw new ApiError(404, 'Project not found.');
    }
    await ActivityModel.create(
      {
        action: ProjectAction.Deleted,
        details: {},
        outcome: 'completed',
        project_id: id,
        resource_id: id,
        user_id: owner,
      },
      { transaction },
    );
    await row.destroy({ transaction });
  });
  return { deleted: true, id };
}
export async function listActivity(owner: string, project?: unknown, before?: unknown) {
  identifier(owner, 'account');
  const cursor = before === undefined ? undefined : identifier(before, 'activity');
  const projectId = project === undefined ? undefined : identifier(project, 'project');
  const rows = await ActivityModel.findAll({
    limit: 50,
    order: [['activity_event_id', 'DESC']],
    where: {
      user_id: owner,
      ...(projectId ? { resource_id: projectId } : {}),
      ...(cursor ? { activity_event_id: { [Op.lt]: cursor } } : {}),
    },
  });
  return {
    items: rows.map((row) => {
      const record = row.get({ plain: true });
      return {
        ...record,
        activity_event_id: String(record.activity_event_id),
        project_id: record.project_id === null ? null : String(record.project_id),
        resource_id: String(record.resource_id),
        user_id: String(record.user_id),
      };
    }),
    nextCursor: rows.length === 50 ? String(rows[rows.length - 1].getDataValue('activity_event_id')) : null,
  };
}
