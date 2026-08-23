import { Pool } from 'pg';
import { createPoolConfig } from './db-config.js';
import { attachDatabasePool } from '@vercel/functions';

const getSafeErrorCode = (error) => {
  const code = error?.code;
  if (typeof code === 'string' && /^[A-Z0-9_]{1,20}$/.test(code)) {
    return code;
  }
  return 'UNKNOWN';
};

const createDatabasePool = () => {
  const databasePool = new Pool(createPoolConfig());
  if(process.env.VERCEL === '1'){
    attachDatabasePool(databasePool);
  }
  databasePool.on('error', (error) => {
    // message、stack、接続情報はログへ出さない。
    console.error('Unexpected database pool error', {
      code: getSafeErrorCode(error),
    });
  });
  return databasePool;
};
const getDatabasePool = () => {
  if (process.env.NODE_ENV !== 'development') {
    return createDatabasePool();
  }
  if (!globalThis.__myTodoDatabasePool) {
    globalThis.__myTodoDatabasePool = createDatabasePool();
  }
  return globalThis.__myTodoDatabasePool;
};
const pool = getDatabasePool();

export default pool;