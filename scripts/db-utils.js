// scripts/db-utils.js
const { Pool } = require('pg');
const path = require('path');

// 環境変数の設定を確認
function validateEnv() {
  if (!process.env.TEST_DATABASE_URL) {
    console.error('❌ TEST_DATABASE_URLが設定されていません');
    console.error('⚠️ .env.testファイルに以下の形式で設定してください：');
    console.error('TEST_DATABASE_URL=postgres://[user]:[password]@[host]/[dbname]');
    console.error('現在の.env.testファイルの場所:', path.resolve(process.cwd(), '.env.test'));
    process.exit(1);
  }
}

// データベース接続プールを作成
function createPool() {
  console.log('🔌 データベースに接続中...');
  console.log('接続先:', process.env.TEST_DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

  return new Pool({
    connectionString: process.env.TEST_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
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