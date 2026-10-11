import { randomUUID } from 'node:crypto';
import { createApiHandler, ApiError } from '../../../lib/api';
import { accountAccess } from '../../../lib/account/access';
import { ActivityModel } from '../../../lib/models/Activity';
import { ProjectModel } from '../../../lib/models/Project';

export default createApiHandler({
  async get(req) {
    const account = await accountAccess(req);
    const projects = await ProjectModel.findAll({
      order: [['updated_at', 'DESC']],
      where: { user_id: account.user.id },
    });
    return { projects: projects.map((project) => project.get({ plain: true })) };
  },
  async post(req) {
    const account = await accountAccess(req);
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (!name) {
      throw new ApiError(400, 'Project Name is required.');
    }
    const now = new Date();
    const project = await ProjectModel.create({
      active_tool: 'index',
      created_at: now,
      id: randomUUID(),
      name: name.slice(0, 255),
      state: {},
      updated_at: now,
      user_id: account.user.id,
    });
    await ActivityModel.create({
      action: 'project.created',
      created_at: now,
      details: {},
      id: randomUUID(),
      outcome: 'completed',
      project_id: project.get('id'),
      updated_at: now,
      user_id: account.user.id,
    });
    return { project: project.get({ plain: true }) };
  },
});
