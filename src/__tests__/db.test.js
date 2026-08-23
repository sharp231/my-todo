import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Pool } from 'pg';

const { onMock } = vi.hoisted(() => ({
    onMock: vi.fn(),
}));

vi.mock('pg', () => ({
    Pool: vi.fn(class MockPool {
        on = onMock;
    }),
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalDatabaseUrl = process.env.DATABASE_URL;

describe('database pool', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.clearAllMocks();

        delete globalThis.__myTodoDatabasePool;

        process.env.NODE_ENV = 'development';
        process.env.DATABASE_URL =
            'postgresql://user:password@example.com/todos?sslmode=verify-full';
    });
    afterEach(() => {
        delete globalThis.__myTodoDatabasePool;

        if (originalNodeEnv === undefined) {
            delete process.env.NODE_ENV;
        } else {
            process.env.NODE_ENV = originalNodeEnv;
        }

        if (originalDatabaseUrl === undefined) {
            delete process.env.DATABASE_URL;
        } else {
            process.env.DATABASE_URL = originalDatabaseUrl;
        }
    });

    test('reuses the pool during development reloads', async () => {
        const firstImport = await import('../lib/db.js');

        vi.resetModules();

        const secondImport = await import('../lib/db.js');

        expect(Pool).toHaveBeenCalledTimes(1);
        expect(secondImport.default).toBe(firstImport.default);
    });
});
