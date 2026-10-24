import { createApiHandler } from '../../../lib/api';
import { requireAppAccess } from '../../../lib/account/access';
import { createProject, listProjects } from '../../../lib/projects/service';
export default createApiHandler({
  async get(req) {
    const user = await requireAppAccess(req);
    return listProjects(user.id, req.query.before);
  },
  async post(req) {
    const user = await requireAppAccess(req);
    return { project: await createProject(user.id, req.body?.name) };
  },
});
