import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import dbUtils from '../../scripts/db-utils.js';
import setupTestDatabase
    from '../../scripts/setup-test-db.js';

const {
    createPool,
    validateEnv,
} = dbUtils;

describe('database migrations', () => {
    let pool;
    beforeAll(() => {
        validateEnv();
        pool = createPool();
    });
    afterAll(async () => {
        await pool.end();
    });

    test('creates the canonical todos columns', async () => {
        const result = await pool.query(`
            SELECT
                column_name,
                data_type,
                is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
                AND table_name = 'todos'
            ORDER BY column_name
            `);

        const columns = Object.fromEntries(
            result.rows.map((row) => [
                row.column_name,
                {
                    dataType: row.data_type,
                    nullable: row.is_nullable,
                },
            ])
        );

        expect(columns).toEqual({
            completed: {
                dataType: 'boolean',
                nullable: 'NO',
            },
            created_at: {
                dataType: 'timestamp with time zone',
                nullable: 'NO',
            },
            date: {
                dataType: 'date',
                nullable: 'NO',
            },
            id: {
                dataType: 'bigint',
                nullable: 'NO',
            },
            priority: {
                dataType: 'text',
                nullable: 'NO',
            },
            title: {
                dataType: 'text',
                nullable: 'NO',
            },
            updated_at: {
                dataType: 'timestamp with time zone',
                nullable: 'NO',
            },
        });
    });


    test('creates constraints, index, and trigger', async () => {
        const constraints = await pool.query(`
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.todos'::regclass 
        `);

        expect(
            constraints.rows.map((row) => row.conname)
        ).toEqual(
            expect.arrayContaining([
                'todos_pkey',
                'todos_title_check',
                'todos_priority_check',
            ])
        );

        const indexes = await pool.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
            AND tablename = 'todos'
    `);
        expect(
            indexes.rows.map((row) => row.indexname)
        ).toContain('idx_todos_created_at');

        const triggers = await pool.query(`
        SELECT tgname
        FROM pg_trigger
        WHERE tgrelid = 'public.todos'::regclass
            AND NOT tgisinternal
    `);
        expect(
            triggers.rows.map((row) => row.tgname)
        ).toContain('todos_set_updated_at');
    });

    test('adopts the legacy production schema without losing data', async () => {
        await pool.query(`
        DROP TABLE IF EXISTS public.todos;
        DROP TABLE IF EXISTS public.schema_migrations;

        CREATE TABLE public.todos (
            id BIGSERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TIMESTAMP WITHOUT TIME ZONE
                NOT NULL DEFAULT CURRENT_TIMESTAMP,
            date TIMESTAMP WITH TIME ZONE,
            priority TEXT,
            completed BOOLEAN DEFAULT FALSE
        );
    `);

        const inserted = await pool.query(
            `
        INSERT INTO public.todos (
            title,
            date,
            priority,
            completed,
            created_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id::text AS id
        `,
            [
                'legacy todo',
                '2099-01-01T12:00:00.000Z',
                'high',
                true,
                '2026-01-01 00:00:00',
            ]
        );

        await setupTestDatabase();

        const migrated = await pool.query(
            `
        SELECT
            id::text AS id,
            title,
            date::text AS date,
            priority,
            completed,
            updated_at = created_at AS timestamp_copied
        FROM public.todos
        WHERE id = $1
        `,
            [inserted.rows[0].id]
        );

        expect(migrated.rows[0]).toEqual({
            id: inserted.rows[0].id,
            title: 'legacy todo',
            date: '2099-01-01',
            priority: 'high',
            completed: true,
            timestamp_copied: true,
        });
    });

    test('records the baseline migration once', async () => {
        await setupTestDatabase();

        const result = await pool.query(`
      SELECT count(*)::integer AS count
      FROM public.schema_migrations
      WHERE name LIKE '%adopt-or-create-todos%'
    `);

        expect(result.rows[0].count).toBe(1);
    });

    test('preserves data when migrations run again', async () => {
        const inserted = await pool.query(
            `
        INSERT INTO public.todos (
          title,
          date,
          priority,
          completed,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `,
            [
                'migration test',
                '2099-01-01',
                'low',
                false,
                '2000-01-01T00:00:00.000Z',
            ]
        );

        const todoId = inserted.rows[0].id;

        await setupTestDatabase();

        const preserved = await pool.query(
            `
        SELECT title
        FROM public.todos
        WHERE id = $1
      `,
            [todoId]
        );

        expect(preserved.rows[0].title)
            .toBe('migration test');

        await pool.query(
            `
        UPDATE public.todos
        SET title = $1
        WHERE id = $2
      `,
            ['updated migration test', todoId]
        );

        const updated = await pool.query(
            `
        SELECT updated_at
        FROM public.todos
        WHERE id = $1
      `,
            [todoId]
        );

        expect(
            new Date(updated.rows[0].updated_at).getTime()
        ).toBeGreaterThan(
            new Date('2000-01-01T00:00:00.000Z').getTime()
        );
    });
});