import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createMocks } from 'node-mocks-http';

const { queryMock } = vi.hoisted(() => ({
    queryMock: vi.fn(),
}));

vi.mock('../lib/db', () => ({
    default: {
        query: queryMock,
    },
}));

import handler from '../pages/api/health/db.js';

describe('GET /api/health/db', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('returns 200 when database is available', async () => {
        queryMock.mockResolvedValueOnce({
            rows: [{ health: 1 }],
        });

        const { req, res } = createMocks({
            method: 'GET',
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual({
            status: 'ok',
            checks: {
                database: 'ok',
            },
        });
    });

    test('returns a sanitized 503 response', async () => {
        const secret = 'database-password';
        const databaseError = Object.assign(
            new Error(
                `postgresql://user:${secret}@example.com/todos`
            ),
            {
                code: 'ECONNREFUSED',
            }
        );

        queryMock.mockRejectedValueOnce(databaseError);

        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => { });

        const { req, res } = createMocks({
            method: 'GET',
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(503);
        expect(res._getJSONData()).toEqual({
            error: {
                code: 'SERVICE_UNAVAILABLE',
                message: 'Database unavailable',
            },
        });

        const responseText = res._getData();
        const logText = JSON.stringify(consoleError.mock.calls);

        expect(responseText).not.toContain(secret);
        expect(logText).not.toContain(secret);
        expect(logText).not.toContain('postgresql://');

        consoleError.mockRestore();
    });
});