import { createApiHandler, ApiError } from '../../../lib/api';
import { accountAccess } from '../../../lib/account/access';
import { ProjectModel } from '../../../lib/models/Project';

export default createApiHandler({
  async get(req) {
    const account = await accountAccess(req);
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    const project = await ProjectModel.findOne({ where: { id, user_id: account.user.id } });
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }
    return { project: project.get({ plain: true }) };
  },
  async patch(req) {
    const account = await accountAccess(req);
    const id = typeof req.query.id === 'string' ? req.query.id : '';
    const project = await ProjectModel.findOne({ where: { id, user_id: account.user.id } });
    if (!project) {
      throw new ApiError(404, 'Project not found.');
    }
    const activeTool = typeof req.body?.active_tool === 'string' ? req.body.active_tool : project.get('active_tool');
    await project.update({
      active_tool: activeTool,
      state: req.body?.state ?? project.get('state'),
      updated_at: new Date(),
    });
    return { project: project.get({ plain: true }) };
  },
});
