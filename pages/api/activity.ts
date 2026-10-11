import { createApiHandler } from '../../lib/api';
import { accountAccess } from '../../lib/account/access';
import { ActivityModel } from '../../lib/models/Activity';

export default createApiHandler({
  async get(req) {
    const account = await accountAccess(req);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 25));
    const offset = Math.max(0, Number(req.query.offset) || 0);
    const result = await ActivityModel.findAndCountAll({
      limit,
      offset,
      order: [['created_at', 'DESC']],
      where: { user_id: account.user.id },
    });
    return { items: result.rows.map((row) => row.get({ plain: true })), limit, offset, total: result.count };
  },
});
