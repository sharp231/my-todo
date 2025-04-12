import { Pool } from 'pg';
import dotenv from 'dotenv';

// 環境変数を読み込む
dotenv.config();

// PostgreSQL接続プールを作成
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // SSL接続を許可
  },
});

export default pool;