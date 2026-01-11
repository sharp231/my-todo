// scripts/setup-test-db.js
const { validateEnv, createPool, executeTransaction } = require('./db-utils');
require('dotenv').config({ path: '.env.test' });

async function setupTestDatabase() {
  validateEnv();
  const pool = createPool();
  const client = await pool.connect();

  try {
    await executeTransaction(client, async () => {
      console.log('📝 テスト用テーブルを作成中...');
      await client.query(`
        CREATE TABLE IF NOT EXISTS todos_test (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          date DATE NOT NULL,
          priority VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('📊 インデックスを作成中...');
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_todos_test_created_at 
        ON todos_test(created_at DESC);
      `);
    });
    console.log('✅ テスト用データベースのセットアップが完了しました');
  } catch (error) {
    console.error('❌ テスト用データベースのセットアップに失敗しました:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  setupTestDatabase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('予期せぬエラーが発生しました:', error);
      process.exit(1);
    });
}
// CIで.env.testが無いとテストがprocess.exitで落ちるため、暫定的にコメントアウト（dotenv読込方式を要修正）
// const path = require('path');
// const dotenv = require('dotenv');

// const envPath = path.resolve(__dirname, '../.env.test'); // scripts/ の1つ上がプロジェクトルート想定
// const result = dotenv.config({ path: envPath });

// if (result.error) {
//   console.error(`❌ dotenv failed to load: ${envPath}`, result.error);
//   process.exit(1);
// }

module.exports = setupTestDatabase;