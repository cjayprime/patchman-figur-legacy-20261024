import { createApiHandler } from '../../../lib/api';
import { accountAccess } from '../../../lib/account/access';

export default createApiHandler({
  async get(req, _res) {
    return accountAccess(req);
  },
});
