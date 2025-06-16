// scripts/cleanup-test-db.js
const { validateEnv, createPool, executeTransaction } = require('./db-utils');
require('dotenv').config({ path: '.env.test' });

async function cleanupTestDatabase() {
  validateEnv();
  const pool = createPool();
  const client = await pool.connect();
  
  try {
    await executeTransaction(client, async () => {
      console.log('🧹 テストデータをクリーンアップ中...');
      await client.query('TRUNCATE TABLE todos_test RESTART IDENTITY CASCADE;');
    });
    console.log('✅ テスト用データベースのクリーンアップが完了しました');
  } catch (error) {
    console.error('❌ テスト用データベースのクリーンアップに失敗しました:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  cleanupTestDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('予期せぬエラーが発生しました:', error);
      process.exit(1);
    });
}

module.exports = cleanupTestDatabase;