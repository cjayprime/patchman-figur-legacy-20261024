import { createApiHandler } from '../../lib/api';
import { requireAppAccess } from '../../lib/account/access';
import { listActivity } from '../../lib/projects/service';
export default createApiHandler({
  async get(req) {
    const user = await requireAppAccess(req);
    return listActivity(user.id, req.query.projectId, req.query.before);
  },
});
