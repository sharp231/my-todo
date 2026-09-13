import { createMocks } from "node-mocks-http";
import { beforeEach, describe, expect, test, vi } from 'vitest';

const { getAuthMock, getTodosMock } = vi.hoisted(() => ({
    getAuthMock: vi.fn(),
    getTodosMock: vi.fn(),
}));

vi.mock('@clerk/nextjs/server', () => ({
    getAuth: getAuthMock,
}));

vi.mock('../lib/queries', () => ({
    getTodos: getTodosMock,
    addTodo: vi.fn(),
    deleteTodo: vi.fn(),
    updateTodo: vi.fn(),
}));

import handler from '../pages/api/todos';


describe('/api/todos authentication', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test('returns 401 without an authenticated user', async () => {
        getAuthMock.mockReturnValue({
            userId: null,
        });

        const { req, res } = createMocks({
            method: 'GET',
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
        expect(res._getJSONData()).toEqual({
            error: {
                code: 'UNAUTHORIZED',
                message: 'Authentication required',
            },
        });

        expect(getTodosMock).not.toHaveBeenCalled();
    });

    test('allows an authenticated user to access the API', async () => {
        getAuthMock.mockReturnValue({
            userId: 'user_test_123',
        });
        getTodosMock.mockResolvedValue([]);

        const { req, res } = createMocks({
            method: 'GET',
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res._getJSONData()).toEqual([]);
        expect(getTodosMock).toHaveBeenCalledTimes(1);
        expect(getTodosMock).toHaveBeenCalledWith('user_test_123');
    });
});