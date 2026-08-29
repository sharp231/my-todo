import { Readable } from 'node:stream';

import { createResponse } from 'node-mocks-http';
import { afterAll, beforeEach, describe, expect, test, } from 'vitest';

import pool from '../lib/db.js';
import { addTodo } from '../lib/queries.js';
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

const findTodo = async (id) => {
    const result = await pool.query(
        `
        SELECT
        id,
        title,
        to_char(date, 'YYYY-MM-DD') AS date,
        priority,
        completed
        FROM public.todos
        WHERE id = $1
        `,
        [id]
    );
    return result.rows[0];
};

describe('/api/todos database integration', () => {
    beforeEach(async () => {
        await pool.query(
            'TRUNCATE TABLE public.todos RESTART IDENTITY'
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

        expect(body).toEqual(
            expect.objectContaining({
                title: 'Created through API',
                date: '2099-03-01',
                priority: 'high',
                completed: true,
            })
        );

        expect(await findTodo(body.id)).toEqual(
            expect.objectContaining({
                title: 'Created through API',
                completed: true,
            })
        );
    });

    test('PUT replaces the todo including completed', async () => {
        const created = await addTodo(
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

        expect(await findTodo(created.id)).toEqual(
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

        expect(await findTodo(created.id)).toEqual(
            expect.objectContaining({
                title: 'Patch target',
                date: '2099-03-01',
                priority: 'low',
                completed: true,
            })
        );
    });
});

