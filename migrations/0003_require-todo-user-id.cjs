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
  pgm.alterColumn(TODOS_TABLE, 'user_id', {
    notNull: true,
  });
};

/**
 * @param {import('node-pg-migrate').MigrationBuilder} pgm
 */
const down = (pgm) => {
  pgm.alterColumn(TODOS_TABLE, 'user_id', {
    notNull: false,
  });
};

module.exports = {
  shorthands,
  up,
  down,
};