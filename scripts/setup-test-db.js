// scripts/setup-test-db.js
const path = require('node:path');
const { runner } = require('node-pg-migrate');
const { validateEnv } = require('./db-utils');

async function setupTestDatabase() {
  const databaseUrl = validateEnv();

  await runner({
    databaseUrl,
    dir: path.resolve(__dirname, '../migrations'),
    direction: 'up',
    migrationsTable: 'schema_migrations',
    schema: 'public',
    checkOrder: true,
    singleTransaction: true,
    advisoryLockMode: 'fail',
    verbose: false,
  });
  console.log('Test database migrations completed')
}
if (require.main === module) {
  setupTestDatabase()
    .catch(() => {
      //接続URL、SQL、元例外、stackは出さない
      console.error('Test database migration failed');
      process.exitCode = 1;
    });
}

module.exports = setupTestDatabase;