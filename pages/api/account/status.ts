import { createApiHandler } from '../../../lib/api';
import { accountAccess } from '../../../lib/account/access';
export default createApiHandler({
  async get(req, res) {
    res.setHeader('Cache-Control', 'private, no-store');
    return accountAccess(req);
  },
});
