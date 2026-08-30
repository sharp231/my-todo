import { Readable } from 'node:stream';

import { createResponse } from 'node-mocks-http';
import { afterAll, beforeEach, describe, expect, test, vi } from 'vitest';

const { requireAuthenticatedUserIdMock } = vi.hoisted(() => ({
    requireAuthenticatedUserIdMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
    requireAuthenticatedUserId: requireAuthenticatedUserIdMock,
}));

import pool from '../lib/db';
import { addTodo, getTodos } from '../lib/queries';
import handler from '../pages/api/todos.js';

const createJsonRequest = (method, body) => {
    const request = Readable.from([
        JSON.stringify(body),
    ]);

    request.method = method;
    request.headers = {
        'content-type': 'application/json',
    };
    request.query = {};

    return request;
};

const findTodo = async (userId, id) => {
    const result = await pool.query(
        `
        SELECT
            id,
            user_id,
            title,
            to_char(date, 'YYYY-MM-DD') AS date,
            priority,
            completed
        FROM public.todos
        WHERE user_id = $1
          AND id = $2
        `,
        [userId, id]
    );

    return result.rows[0];
};

const TEST_USER_ID = 'user_test_123';
const OTHER_USER_ID = 'user_test_456';

describe('/api/todos database integration', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        requireAuthenticatedUserIdMock.mockReturnValue(TEST_USER_ID);

        await pool.query(
            'TRUNCATE TABLE public.todos RESTART IDENTITY',
        );
    });

    afterAll(async () => {
        await pool.end();
    });

    test('POST persists completed in the database', async () => {
        const request = createJsonRequest('POST', {
            title: 'Created through API',
            date: '2099-03-01',
            priority: 'high',
            completed: true,
        });
        const response = createResponse();

        await handler(request, response);

        expect(response._getStatusCode()).toBe(201);

        const body = response._getJSONData();
        expect(typeof body.id).toBe('string');

        expect(typeof body.created_at).toBe('string');
        expect(new Date(body.created_at).toISOString()).toBe(
            body.created_at
        );

        expect(typeof body.updated_at).toBe('string');
        expect(new Date(body.updated_at).toISOString()).toBe(
            body.updated_at
        );

        expect(body).toEqual(
            expect.objectContaining({
                title: 'Created through API',
                date: '2099-03-01',
                priority: 'high',
                completed: true,
            })
        );

        expect(await findTodo(TEST_USER_ID, body.id)).toEqual(
            expect.objectContaining({
                title: 'Created through API',
                completed: true,
            })
        );
    });

    test('PUT replaces the todo including completed', async () => {
        const created = await addTodo(
            TEST_USER_ID,
            'Original todo',
            '2099-03-01',
            'low',
            true
        );

        const request = createJsonRequest('PUT', {
            id: created.id,
            title: 'Replaced todo',
            date: '2099-04-01',
            priority: 'medium',
            completed: false,
        });
        const response = createResponse();

        await handler(request, response);

        expect(response._getStatusCode()).toBe(200);

        expect(response._getJSONData()).toEqual(
            expect.objectContaining({
                message: 'Todo completely replaced',
                method: 'PUT',
                todo: expect.objectContaining({
                    id: created.id,
                    title: 'Replaced todo',
                    date: '2099-04-01',
                    priority: 'medium',
                    completed: false,
                }),
            })
        );

        expect(await findTodo(TEST_USER_ID, created.id)).toEqual(
            expect.objectContaining({
                title: 'Replaced todo',
                date: '2099-04-01',
                priority: 'medium',
                completed: false,
            })
        );
    });

    test('PATCH updates only completed', async () => {
        const created = await addTodo(
            TEST_USER_ID,
            'Patch target',
            '2099-03-01',
            'low',
            false
        );

        const request = createJsonRequest('PATCH', {
            id: created.id,
            completed: true,
        });
        const response = createResponse();

        await handler(request, response);

        expect(response._getStatusCode()).toBe(200);

        expect(response._getJSONData()).toEqual(
            expect.objectContaining({
                id: created.id,
                title: 'Patch target',
                date: '2099-03-01',
                priority: 'low',
                completed: true,
            })
        );

        expect(await findTodo(TEST_USER_ID, created.id)).toEqual(
            expect.objectContaining({
                user_id: TEST_USER_ID,
                title: 'Patch target',
                date: '2099-03-01',
                priority: 'low',
                completed: true,
            })
        );
    });

    test('does not update or delete another user todo', async () => {
        const created = await addTodo(
            TEST_USER_ID,
            'Protected todo',
            '2099-03-01',
            'medium',
            false
        );

        requireAuthenticatedUserIdMock.mockReturnValue(
            OTHER_USER_ID
        );

        const patchRequest = createJsonRequest('PATCH', {
            id: created.id,
            title: 'Unauthorized update',
        });
        const patchResponse = createResponse();

        await handler(patchRequest, patchResponse);

        expect(patchResponse._getStatusCode()).toBe(404);

        const deleteRequest = createJsonRequest('DELETE', {});
        deleteRequest.query = { id: created.id };
        const deleteResponse = createResponse();

        await handler(deleteRequest, deleteResponse);

        expect(deleteResponse._getStatusCode()).toBe(404);

        expect(
            await findTodo(TEST_USER_ID, created.id)
        ).toEqual(
            expect.objectContaining({
                title: 'Protected todo',
            })
        );
    });
    test('does not accept user_id from the request body', async () => {
        const request = createJsonRequest('POST', {
            user_id: OTHER_USER_ID,
            title: 'Injected owner',
            date: '2099-03-01',
            priority: 'high',
            completed: false,
        });
        const response = createResponse();

        await handler(request, response);

        expect(response._getStatusCode()).toBe(400);
        expect(response._getJSONData()).toEqual(
            expect.objectContaining({
                error: expect.objectContaining({
                    code: 'BAD_REQUEST',
                }),
            })
        );

        expect(await getTodos(TEST_USER_ID)).toEqual([]);
        expect(await getTodos(OTHER_USER_ID)).toEqual([]);
    });
});

