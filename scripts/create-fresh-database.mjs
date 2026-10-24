import './check-node.cjs';
import { createRequire } from 'node:module';
import { Sequelize } from 'sequelize';
import { createFreshDatabase } from './database-provisioning.mjs';

const require = createRequire(import.meta.url);
const configuration = require('../lib/database/config.cjs').development;
await createFreshDatabase(configuration, process.env.DATABASE_NAME, Sequelize);
console.log('Fresh application database is available. Existing records and cloud objects were not removed.');
