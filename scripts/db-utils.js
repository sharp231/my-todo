// scripts/db-utils.js
const { Pool } = require('pg');

// 環境変数の設定を確認
function validateEnv() {
  if (typeof process.env.TEST_DATABASE_URL !== 'string' || process.env.TEST_DATABASE_URL.trim() === '') {
    throw new Error('TEST_DATABASE_URL is required')
  }
}

// データベース接続プールを作成
function createPool() {
  return new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 5_000,
    allowExitOnIdle: true,
  });
}

// トランザクションを実行
async function executeTransaction(client, operations) {
  try {
    await client.query('BEGIN');
    await operations();
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

module.exports = {
  validateEnv,
  createPool,
  executeTransaction
};