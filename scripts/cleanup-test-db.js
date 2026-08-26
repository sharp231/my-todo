// scripts/cleanup-test-db.js
const { validateEnv, createPool, executeTransaction } = require('./db-utils');

async function cleanupTestDatabase() {
  validateEnv();

  const pool = createPool();
  let client;

  try {
    client = await pool.connect();

    await executeTransaction(client, async () => {
      await client.query('TRUNCATE TABLE public.todos RESTART IDENTITY;');
    });
    console.log('Test database cleanup completed');
  } finally {
    try {
      client?.release();
    } finally {
      await pool.end();
    }
  }
}

if (require.main === module) {
  cleanupTestDatabase()
    .catch(() => {
      console.error('Test database cleanup failed');
      process.exitCode = 1;
    });
}

module.exports = cleanupTestDatabase;