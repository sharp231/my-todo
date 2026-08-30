/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
const shorthands = undefined;

const TODOS_TABLE = {
  schema: 'public',
  name: 'todos',
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
const up = (pgm) => {
  // 既存Todoの所有者方針が未決定なので、最初はNULLを許可する。
  pgm.addColumns(TODOS_TABLE, {
    user_id: {
      type: 'text',
    },
  });

  pgm.createIndex(
    TODOS_TABLE,
    [
      'user_id',
      {
        name: 'created_at',
        sort: 'DESC',
      },
    ],
    {
      name: 'idx_todos_user_created_at',
    },
  );
};

const down = () => {
  throw new Error(
    'The todo owner migration cannot be rolled back automatically',
  );
};

module.exports = {
  shorthands,
  up,
  down,
};