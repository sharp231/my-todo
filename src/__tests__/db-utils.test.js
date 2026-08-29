import { describe, expect, test } from 'vitest';

import dbUtils from '../../scripts/db-utils.js';

const { validateEnv } = dbUtils;

const TEST_DATABASE_URL =
    'postgresql://test:test-password@localhost:5432/my_todo_test?sslmode=disable';

const PRODUCTION_DATABASE_URL =
    'postgresql://prod:prod-password@localhost:5432/my_todo?sslmode=disable';

describe('test database environment validation', () => {
    test('accepts an isolated test database', () => {
        expect(
            validateEnv({
                NODE_ENV: 'test',
                TEST_DATABASE_URL,
                DATABASE_URL: PRODUCTION_DATABASE_URL,
            })
        ).toBe(TEST_DATABASE_URL);
    });

    test('rejects direct and pooled URLs for the same Neon database', () => {
        expect(() =>
            validateEnv({
                NODE_ENV: 'test',
                DATABASE_URL:
                    'postgresql://prod:secret@ep-same-pooler.us-east-2.aws.neon.tech/my_todo?sslmode=verify-full',
                TEST_DATABASE_URL:
                    'postgresql://test:other-secret@ep-same.us-east-2.aws.neon.tech/my_todo?sslmode=verify-full',
            })
        ).toThrow(
            'TEST_DATABASE_URL must target a different database'
        );
    });


    test('does not expose a malformed URL in the error', () => {
        const secret = 'database-secret';
        let caught;

        try {
            validateEnv({
                NODE_ENV: 'test',
                TEST_DATABASE_URL: `invalid-${secret}`,
            });
        } catch (error) {
            caught = error;
        }

        expect(caught).toBeInstanceOf(Error);
        expect(caught.message).not.toContain(secret);
    });
});