import { describe, expect, test } from 'vitest';
import {
    createPoolConfig,
    DatabaseConfigError,
} from '../lib/db-config.js';

const PRODUCTION_URL =
    'postgresql://user:password@example.com/todos?sslmode=verify-full';

const LOCAL_TEST_URL =
    'postgresql://user:password@localhost:5432/todos_test?sslmode=disable';


describe('database pool config', () => {
    test('creates production pool config', () => {
        const config = createPoolConfig({
            NODE_ENV: 'production',
            DATABASE_URL: PRODUCTION_URL,
        });
        expect(config).toMatchObject({
            max: 5,
            idleTimeoutMillis: 5_000,
            connectionTimeoutMillis: 5_000,
            statement_timeout: 5_000,
        });
    });
    test('uses TEST_DATABASE_URL in test', () => {
        const config = createPoolConfig({
            NODE_ENV: 'test',
            DATABASE_URL: PRODUCTION_URL,
            TEST_DATABASE_URL: LOCAL_TEST_URL,
        });
        expect(config.connectionString).toContain('todos_test');
        expect(config.max).toBe(2);
    });
    test('does not fall back to DATABASE_URL in test', () => {
        expect(() =>
            createPoolConfig({
                NODE_ENV: 'test',
                DATABASE_URL: PRODUCTION_URL,
            })
        ).toThrow('TEST_DATABASE_URL is required');
    });
    test('rejects insecure production SSL mode', () => {
        expect(() =>
            createPoolConfig({
                NODE_ENV: 'production',
                DATABASE_URL:
                    'postgresql://user:password@example.com/todos?sslmode=require'
            })
        ).toThrow('sslmode=verify-full');
    });
    test('does not include the URL in validation errors', () => {
        const secret = 'very-secret-password';
        let caught;
        try {
            createPoolConfig({
                NODE_ENV: 'production',
                DATABASE_URL: `invalid-${secret}`,
            });
        } catch (error) {
            caught = error;
        }
        expect(caught).toBeInstanceOf(DatabaseConfigError);
        expect(caught.message).not.toContain(secret);
    });
});

