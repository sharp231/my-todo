import { attachDatabasePool } from '@vercel/functions';
import { Pool } from 'pg';
import type { PoolConfig } from 'pg';
import { createPoolConfig } from './db-config.js';

declare global {
  var __myTodoDatabasePool: Pool | undefined;
}

const SAFE_ERROR_CODE_PATTERN = /^[A-Z0-9_]{1,20}$/;

const getSafeErrorCode = (error: unknown): string => {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'UNKNOWN';
  }

  const code = error.code;

  if (typeof code === 'string' && SAFE_ERROR_CODE_PATTERN.test(code)) {
    return code;
  }

  return 'UNKNOWN';
};

const createDatabasePool = (): Pool => {
  const poolConfig: PoolConfig = createPoolConfig();
  const databasePool = new Pool(poolConfig);
  if (process.env.VERCEL === '1') {
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
const getDatabasePool = (): Pool => {
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
