import { createApiHandler } from '../../../lib/api';
import { fakeStatus, fakeSignin, fakeSignout } from '../../../FakeSignin/server';
export default createApiHandler({
  delete: fakeSignout,
  get: fakeStatus,
  post: fakeSignin,
});
