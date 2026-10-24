// Unit tests never use an application's normal database.
process.env.NODE_ENV = 'test';
process.env.DATABASE_HOST = process.env.TEST_DATABASE_HOST || '127.0.0.1';
process.env.DATABASE_PORT = process.env.TEST_DATABASE_PORT || '3306';
process.env.DATABASE_USER = process.env.TEST_DATABASE_USER || 'patchman_test_unconfigured';
process.env.DATABASE_PASSWORD = process.env.TEST_DATABASE_PASSWORD || '';
process.env.DATABASE_NAME = process.env.TEST_DATABASE_NAME || 'patchman_figur_unit_test';
