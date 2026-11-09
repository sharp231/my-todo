import { Readable } from 'node:stream';
import type { NextApiRequest, NextApiResponse } from 'next';
import { createResponse } from 'node-mocks-http';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { TodoRecord } from '@/types/todo';

const mocks = vi.hoisted(() => ({
  requireAuthenticatedUserId:
    vi.fn<typeof import('../lib/auth').requireAuthenticatedUserId>(),
  getTodos: vi.fn<typeof import('../lib/queries').getTodos>(),
  addTodo: vi.fn<typeof import('../lib/queries').addTodo>(),
  updateTodo: vi.fn<typeof import('../lib/queries').updateTodo>(),
  deleteTodo: vi.fn<typeof import('../lib/queries').deleteTodo>(),
}));

vi.mock('../lib/auth', () => ({
  requireAuthenticatedUserId: mocks.requireAuthenticatedUserId,
}));

vi.mock('../lib/queries', () => ({
  getTodos: mocks.getTodos,
  addTodo: mocks.addTodo,
  updateTodo: mocks.updateTodo,
  deleteTodo: mocks.deleteTodo,
}));

import handler from '../pages/api/todos';

const TEST_USER_ID = 'user_test_123';

const todoRecord: TodoRecord = {
  id: '9007199254740993',
  title: 'Contract test',
  date: '2099-01-01',
  priority: 'high',
  completed: false,
  created_at: new Date('2099-01-01T00:00:00.000Z'),
  updated_at: new Date('2099-01-01T00:00:00.000Z'),
};

const expectedTodoJson = {
  id: '9007199254740993',
  title: 'Contract test',
  date: '2099-01-01',
  priority: 'high',
  completed: false,
  created_at: '2099-01-01T00:00:00.000Z',
  updated_at: '2099-01-01T00:00:00.000Z',
};

type RequestOptions = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  body?: unknown;
  rawBody?: string;
  query?: NextApiRequest['query'];
};

function createRequest({
  method,
  body,
  rawBody,
  query = {},
}: RequestOptions): NextApiRequest {
  const payload =
    rawBody ?? (body === undefined ? undefined : JSON.stringify(body));

  const request = Readable.from(payload === undefined ? [] : [payload]);

  Object.assign(request, {
    method,
    headers:
      payload === undefined ? {} : { 'content-type': 'application/json' },
    query,
  });

  // ハンドラーが使用するHTTP情報と本文ストリームを備えたテスト用リクエスト。
  return request as unknown as NextApiRequest;
}

describe('/api/todos contract', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.requireAuthenticatedUserId.mockReturnValue(TEST_USER_ID);
  });

  test('GET returns todos in the public JSON format', async () => {
    mocks.getTodos.mockResolvedValue([todoRecord]);

    const request = createRequest({ method: 'GET' });
    const response = createResponse<NextApiResponse<unknown>>();

    await handler(request, response);

    const body: unknown = response._getJSONData();

    expect(response._getStatusCode()).toBe(200);
    expect(response.getHeader('Content-Type')).toBe('application/json');
    expect(body).toEqual([expectedTodoJson]);

    expect(mocks.getTodos).toHaveBeenCalledExactlyOnceWith(TEST_USER_ID);
  });

  test('POST defaults completed to false when omitted', async () => {
    mocks.addTodo.mockResolvedValue(todoRecord);

    const request = createRequest({
      method: 'POST',
      body: {
        title: 'Contract test',
        date: '2099-01-01',
        priority: 'high',
      },
    });
    const response = createResponse<NextApiResponse<unknown>>();

    await handler(request, response);

    const body: unknown = response._getJSONData();

    expect(response._getStatusCode()).toBe(201);
    expect(body).toEqual(expectedTodoJson);

    expect(mocks.addTodo).toHaveBeenCalledExactlyOnceWith(
      TEST_USER_ID,
      'Contract test',
      '2099-01-01',
      'high',
      false,
    );
  });
  test('PUT returns updated todo in the public JSON format', async () => {
    const input = {
      id: todoRecord.id,
      title: 'Renamed test',
      date: '2099-02-01',
      priority: 'medium' as const,
      completed: true,
    };
    mocks.updateTodo.mockResolvedValue({
      ...todoRecord,
      ...input,
    });
    const request = createRequest({
      method: 'PUT',
      body: input,
    });
    const response = createResponse<NextApiResponse<unknown>>();
    await handler(request, response);
    const body: unknown = response._getJSONData();

    expect(response._getStatusCode()).toBe(200);
    expect(body).toEqual({
      message: 'Todo completely replaced',
      method: 'PUT',
      todo: {
        ...expectedTodoJson,
        ...input,
      },
    });

    expect(mocks.updateTodo).toHaveBeenCalledExactlyOnceWith(
      TEST_USER_ID,
      input.id,
      {
        title: 'Renamed test',
        date: '2099-02-01',
        priority: 'medium',
        completed: true,
      },
    );
  });
  test('PATCH passes only the required update fields', async () => {
    mocks.updateTodo.mockResolvedValue({
      ...todoRecord,
      completed: true,
    });

    const request = createRequest({
      method: 'PATCH',
      body: {
        id: todoRecord.id,
        completed: true,
      },
    });
    const response = createResponse<NextApiResponse<unknown>>();

    await handler(request, response);
    const body: unknown = response._getJSONData();

    expect(response._getStatusCode()).toBe(200);
    expect(body).toEqual({
      ...expectedTodoJson,
      completed: true,
    });
    expect(mocks.updateTodo).toHaveBeenCalledExactlyOnceWith(
      TEST_USER_ID,
      todoRecord.id,
      {
        completed: true,
      },
    );
  });
  test('DELETE returns the success response', async () => {
    mocks.deleteTodo.mockResolvedValue(1);
    const request = createRequest({
      method: 'DELETE',
      query: {
        id: todoRecord.id,
      },
    });
    const response = createResponse<NextApiResponse<unknown>>();
    await handler(request, response);
    const body: unknown = response._getJSONData();

    expect(response._getStatusCode()).toBe(200);
    expect(body).toEqual({
      message: 'Todo deleted successfully',
    });
    expect(mocks.deleteTodo).toHaveBeenCalledExactlyOnceWith(
      TEST_USER_ID,
      todoRecord.id,
    );
  });
  test.each([
    {
      name: 'malformed JSON',
      rawBody: '{"title": ,',
      status: 400,
      code: 'BAD_REQUEST',
    },
    { name: 'empty JSON body', rawBody: '', status: 400, code: 'BAD_REQUEST' },
    {
      name: 'missing title',
      rawBody: '{"date":"2099-01-01","priority":"high"}',
      status: 422,
      code: 'VALIDATION_ERROR',
    },
  ])('POST returns $name before writing', async ({ rawBody, status, code }) => {
    const request = createRequest({
      method: 'POST',
      rawBody,
    });
    const response = createResponse<NextApiResponse<unknown>>();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(status);
    expect(response._getJSONData()).toMatchObject({
      error: { code, message: expect.any(String) },
    });
    expect(mocks.addTodo).not.toHaveBeenCalled();
  });

  test.each(['PUT', 'PATCH'] as const)(
    '%s returns 404 when the todo does not exist',
    async (method) => {
      const fields =
        method === 'PUT'
          ? {
              title: 'Updated task',
              date: '2099-02-01',
              priority: 'medium',
              completed: true,
            }
          : {
              completed: true,
            };
      mocks.updateTodo.mockResolvedValue(undefined);
      const request = createRequest({
        method,
        body: {
          id: todoRecord.id,
          ...fields,
        },
      });
      const response = createResponse<NextApiResponse<unknown>>();

      await handler(request, response);

      expect(response._getStatusCode()).toBe(404);
      expect(response._getJSONData()).toMatchObject({
        error: {
          code: 'NOT_FOUND',
          details: { resource: 'todo', id: todoRecord.id },
        },
      });
      expect(mocks.updateTodo).toHaveBeenCalledExactlyOnceWith(
        TEST_USER_ID,
        todoRecord.id,
        fields,
      );
    },
  );
  test('DELETE returns 404 when the todo does not exist', async () => {
    mocks.deleteTodo.mockResolvedValue(0);
    const request = createRequest({
      method: 'DELETE',
      query: {
        id: todoRecord.id,
      },
    });
    const response = createResponse<NextApiResponse<unknown>>();
    await handler(request, response);
    const body: unknown = response._getJSONData();

    expect(response._getStatusCode()).toBe(404);
    expect(response._getJSONData()).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        details: { resource: 'todo', id: todoRecord.id },
      },
    });
    expect(mocks.deleteTodo).toHaveBeenCalledExactlyOnceWith(
      TEST_USER_ID,
      todoRecord.id,
    );
  });
  test('OPTIONS returns 405 with no content', async () => {
    const request = createRequest({ method: 'OPTIONS' });
    const response = createResponse<NextApiResponse<unknown>>();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(405);
    expect(response._getJSONData()).toMatchObject({
      error: { code: 'METHOD_NOT_ALLOWED' },
    });

    const allowed = String(response.getHeader('Allow'))
      .split(',')
      .map((method) => method.trim());

    expect(allowed.sort()).toEqual(
      ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].sort(),
    );
  });
  test.each([
    {
      name: 'unexpected detabase error',
      failure: new Error('test-only internal diagnostic'),
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Internal Server Error',
    },
    {
      name: 'unique constraint violation',
      failure: Object.assign(
        new Error('test-only unique constraint diagnostic'),
        {
          code: '23505',
          constraint: 'test_only_constraint',
        },
      ),
      status: 409,
      code: 'CONFLICT',
      message: 'resource conflict',
    },
  ])(
    'POST handles $name without exposing internals',
    async ({ failure, status, code, message }) => {
      mocks.addTodo.mockRejectedValueOnce(failure);
      const request = createRequest({
        method: 'POST',
        body: { title: 'Contract test', date: '2099-01-01', priority: 'high' },
      });
      const response = createResponse<NextApiResponse<unknown>>();
      const log = vi
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);

      try {
        await handler(request, response);

        expect(mocks.addTodo).toHaveBeenCalledTimes(1);
        expect(response._getStatusCode()).toBe(status);
        expect(response._getJSONData()).toEqual({
          error: { code, message }
        });
      } finally {
        log.mockRestore();
      }
    },
  );
});
