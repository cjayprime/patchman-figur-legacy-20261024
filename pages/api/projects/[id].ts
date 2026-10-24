import { createApiHandler } from '../../../lib/api';
import { requireAppAccess } from '../../../lib/account/access';
import { identifier } from '../../../lib/projects/identifiers';
import { getProject, updateProject, deleteProject } from '../../../lib/projects/service';
export default createApiHandler({
  async delete(req) {
    const user = await requireAppAccess(req);
    return deleteProject(user.id, identifier(req.query.id, 'project'));
  },
  async get(req) {
    const user = await requireAppAccess(req);
    return { project: await getProject(user.id, identifier(req.query.id, 'project')) };
  },
  async patch(req) {
    const user = await requireAppAccess(req);
    return { project: await updateProject(user.id, identifier(req.query.id, 'project'), req.body || {}) };
  },
});
export const config = { api: { bodyParser: { sizeLimit: '24mb' } } };
