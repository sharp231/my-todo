const { Pool } = require('pg');

class VerificationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'VerificationError';
  }
}

const EXPECTED_COLUMNS = new Map([
  ['id', { dataType: 'bigint', nullable: 'NO' }],
  ['title', { dataType: 'text', nullable: 'NO' }],
  ['date', { dataType: 'date', nullable: 'NO' }],
  ['priority', { dataType: 'text', nullable: 'NO' }],
  ['completed', { dataType: 'boolean', nullable: 'NO' }],
  [
    'created_at',
    {
      dataType: 'timestamp with time zone',
      nullable: 'NO',
    },
  ],
  [
    'updated_at',
    {
      dataType: 'timestamp with time zone',
      nullable: 'NO',
    },
  ],
]);

const EXPECTED_CONSTRAINTS = [
  'todos_pkey',
  'todos_title_check',
  'todos_priority_check',
];

function requireCondition(condition, message) {
  if (!condition) {
    throw new VerificationError(message);
  }
}

function readDatabaseUrl() {
  requireCondition(
    process.env.NODE_ENV === 'production',
    'NODE_ENV must be production'
  );

  const databaseUrl = process.env.DATABASE_URL;

  requireCondition(
    typeof databaseUrl === 'string' && databaseUrl.trim() !== '',
    'DATABASE_URL is required'
  );

  let parsedUrl;

  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new VerificationError('DATABASE_URL is invalid');
  }

  requireCondition(
    ['postgres:', 'postgresql:'].includes(parsedUrl.protocol),
    'DATABASE_URL must be a PostgreSQL URL'
  );

  requireCondition(
    parsedUrl.searchParams.get('sslmode') === 'verify-full',
    'DATABASE_URL must use sslmode=verify-full'
  );

  return databaseUrl;
}

async function verifyProductionDatabase() {
  const databaseUrl = readDatabaseUrl();

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 10_000,
    idleTimeoutMillis: 5_000,
    statement_timeout: 10_000,
    allowExitOnIdle: true,
    application_name: 'my-todo-schema-verifier',
  });

  let client;

  try {
    client = await pool.connect();

    const tables = await client.query(`
      SELECT
        to_regclass('public.todos')::text AS todos,
        to_regclass('public.schema_migrations')::text
          AS schema_migrations
    `);

    requireCondition(
      tables.rows[0].todos === 'todos',
      'public.todos does not exist'
    );

    requireCondition(
      tables.rows[0].schema_migrations === 'schema_migrations',
      'public.schema_migrations does not exist'
    );

    const columns = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'todos'
    `);

    requireCondition(
      columns.rows.length === EXPECTED_COLUMNS.size,
      'public.todos has unexpected columns'
    );

    for (const [columnName, expected] of EXPECTED_COLUMNS) {
      const actual = columns.rows.find(
        (column) => column.column_name === columnName
      );

      requireCondition(
        actual,
        `public.todos.${columnName} does not exist`
      );

      requireCondition(
        actual.data_type === expected.dataType,
        `public.todos.${columnName} has an unexpected type`
      );

      requireCondition(
        actual.is_nullable === expected.nullable,
        `public.todos.${columnName} has unexpected nullability`
      );
    }

    const defaults = new Map([
      ['completed', /false/i],
      ['created_at', /CURRENT_TIMESTAMP|now\(\)/i],
      ['updated_at', /CURRENT_TIMESTAMP|now\(\)/i],
    ]);

    for (const [columnName, expectedPattern] of defaults) {
      const column = columns.rows.find(
        (candidate) => candidate.column_name === columnName
      );

      requireCondition(
        expectedPattern.test(column?.column_default ?? ''),
        `public.todos.${columnName} has an unexpected default`
      );
    }

    const constraints = await client.query(`
      SELECT conname
      FROM pg_constraint
      WHERE conrelid = 'public.todos'::regclass
    `);

    const constraintNames = new Set(
      constraints.rows.map((constraint) => constraint.conname)
    );

    for (const constraintName of EXPECTED_CONSTRAINTS) {
      requireCondition(
        constraintNames.has(constraintName),
        `Constraint ${constraintName} does not exist`
      );
    }

    const indexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'todos'
    `);

    requireCondition(
      indexes.rows.some(
        (index) => index.indexname === 'idx_todos_created_at'
      ),
      'Index idx_todos_created_at does not exist'
    );

    const triggers = await client.query(`
      SELECT tgname
      FROM pg_trigger
      WHERE tgrelid = 'public.todos'::regclass
        AND NOT tgisinternal
    `);

    requireCondition(
      triggers.rows.some(
        (trigger) => trigger.tgname === 'todos_set_updated_at'
      ),
      'Trigger todos_set_updated_at does not exist'
    );

    const migrationHistory = await client.query(`
      SELECT count(*)::integer AS migration_count
      FROM public.schema_migrations
      WHERE name LIKE '%adopt-or-create-todos%'
    `);

    requireCondition(
      migrationHistory.rows[0].migration_count === 1,
      'Baseline migration history is invalid'
    );

    const dataIntegrity = await client.query(`
      SELECT
        count(*)::text AS total_count,
        (
          count(*) FILTER (
            WHERE title IS NULL
              OR char_length(btrim(title)) NOT BETWEEN 1 AND 100
              OR date IS NULL
              OR priority NOT IN ('low', 'medium', 'high')
              OR completed IS NULL
              OR created_at IS NULL
              OR updated_at IS NULL
          )
        )::integer AS invalid_count
      FROM public.todos
    `);

    requireCondition(
      dataIntegrity.rows[0].invalid_count === 0,
      'public.todos contains invalid data'
    );

    return dataIntegrity.rows[0].total_count;
  } finally {
    client?.release();
    await pool.end();
  }
}

verifyProductionDatabase()
  .then((totalCount) => {
    console.log(
      `Production database schema verified: ${totalCount} todo rows`
    );
  })
  .catch((error) => {
    const message =
      error instanceof VerificationError
        ? error.message
        : 'Production database verification failed';

    console.error(message);
    process.exitCode = 1;
  });