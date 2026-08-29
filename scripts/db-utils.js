// scripts/db-utils.js
const { Pool } = require('pg');

const POSTGRES_PROTOCOLS = new Set([
  'postgres:',
  'postgresql:',
]);

const parseDatabaseUrl = (value, variableName) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${variableName} is required`);
  }
  let databaseUrl;

  try {
    databaseUrl = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL`);
  }
  if (!POSTGRES_PROTOCOLS.has(databaseUrl.protocol)) {
    throw new Error(`${variableName} must use the postgres or postgresql protocol`);
  }
  if (!databaseUrl.hostname) {
    throw new Error(`${variableName} must include a database host`);
  }
  if (!databaseUrl.pathname || databaseUrl.pathname === '/') {
    throw new Error(`${variableName} must include a database name`);
  }
  return databaseUrl;
};
// Neonのdirect/pooled接続を同じホストとして比較する。
const normalizeDatabaseHostname = (hostname) =>
  hostname
    .toLowerCase()
    .replace(/-pooler(?=\.)/, '');

// ユーザー名、パスワード、SSL設定が異なっても、
// 同じ接続先DBなら同一とみなす。
const getDatabaseTarget = (databaseUrl) => ({
  hostname: normalizeDatabaseHostname(databaseUrl.hostname),
  port: databaseUrl.port || '5432',
  database: databaseUrl.pathname,
});

const targetsSameDatabase = (left, right) => {
  const leftTarget = getDatabaseTarget(left);
  const rightTarget = getDatabaseTarget(right);

  return (
    leftTarget.hostname === rightTarget.hostname
    && leftTarget.port === rightTarget.port
    && leftTarget.database === rightTarget.database
  );
};



// 環境変数の設定を確認
function validateEnv(env = process.env) {
  if (env.NODE_ENV !== 'test') {
    throw new Error('NODE_ENV must be test for test database scripts');
  }
  const testDatabaseUrl = parseDatabaseUrl(
    env.TEST_DATABASE_URL,
    'TEST_DATABASE_URL'
  );
  if (
    typeof env.DATABASE_URL === 'string'
    && env.DATABASE_URL.trim() !== ''
  ) {
    const productionDatabaseUrl = parseDatabaseUrl(
      env.DATABASE_URL,
      'DATABASE_URL'
    );
    if (targetsSameDatabase(testDatabaseUrl, productionDatabaseUrl)) {
      throw new Error(
        'TEST_DATABASE_URL must target a different database from DATABASE_URL'
      );
    }
  }
  return testDatabaseUrl.toString();
}

// 検証済みのテストDB URLだけを使ってPoolを作成する
function createPool(env = process.env) {
  const connectionString = validateEnv(env);
  return new Pool({
    connectionString,
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