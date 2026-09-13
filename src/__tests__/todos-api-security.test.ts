import { Readable } from 'node:stream';

import { createResponse } from 'node-mocks-http';
import type { NextApiRequest } from 'next';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const {
  requireAuthenticatedUserIdMock,
  getTodosMock,
  addTodoMock,
  deleteTodoMock,
  updateTodoMock,
} = vi.hoisted(() => ({
  requireAuthenticatedUserIdMock: vi.fn(),
  getTodosMock: vi.fn(),
  addTodoMock: vi.fn(),
  deleteTodoMock: vi.fn(),
  updateTodoMock: vi.fn(),
}));

vi.mock('../lib/auth', () => ({
  requireAuthenticatedUserId: requireAuthenticatedUserIdMock,
}));

vi.mock('../lib/queries', () => ({
  getTodos: getTodosMock,
  addTodo: addTodoMock,
  deleteTodo: deleteTodoMock,
  updateTodo: updateTodoMock,
}));

// todos.jsからtodos.tsへ移行しても変更不要なように、
// 拡張子を指定しない。
import handler from '../pages/api/todos';

const TEST_USER_ID = 'user_test_123';
const MAX_BODY_BYTES = 16_384;

type RequestOptions = {
  method?: string;
  body?: string | Buffer;
  chunks?: Buffer[];
  headers?: Record<string, string>;
  query?: Record<string, string | string[]>;
};

const createRequest = ({
  method = 'POST',
  body = '',
  chunks,
  headers = {},
  query = {},
}: RequestOptions): NextApiRequest => {
  const requestChunks = chunks ?? [
    Buffer.isBuffer(body) ? body : Buffer.from(body, 'utf8'),
  ];

  const request = Readable.from(requestChunks);

  Object.assign(request, {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    query,
  });

  return request as unknown as NextApiRequest;
};

const validCreateBody = {
  title: 'Security test',
  date: '2099-01-01',
  priority: 'high',
  completed: false,
};

describe('/api/todos request security', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    requireAuthenticatedUserIdMock.mockReturnValue(TEST_USER_ID);

    addTodoMock.mockResolvedValue({
      id: '1',
      ...validCreateBody,
      created_at: new Date('2099-01-01T00:00:00.000Z'),
      updated_at: new Date('2099-01-01T00:00:00.000Z'),
    });
  });

  test.each([
    'application/json',
    'application/json; charset=utf-8',
    'application/json;charset=utf-8',
    'Application/JSON; Charset=UTF-8',
  ])('accepts Content-Type: %s', async (contentType) => {
    const request = createRequest({
      body: JSON.stringify(validCreateBody),
      headers: {
        'content-type': contentType,
      },
    });
    const response = createResponse();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(201);
    expect(addTodoMock).toHaveBeenCalledTimes(1);
  });

  test.each([
    'text/json',
    'application/jsonp',
    'application/problem+json',
    'application/json; charset=shift_jis',
    'application/json; charset=utf-8; version=1',
  ])('rejects Content-Type: %s', async (contentType) => {
    const request = createRequest({
      body: JSON.stringify(validCreateBody),
      headers: {
        'content-type': contentType,
      },
    });
    const response = createResponse();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(400);
    expect(response._getJSONData()).toEqual({
      error: {
        code: 'BAD_REQUEST',
        message: 'Content-Type must be application/json',
        details: {
          header: 'Content-Type',
        },
      },
    });
    expect(addTodoMock).not.toHaveBeenCalled();
  });

  test('accepts a valid JSON body of exactly 16,384 bytes', async () => {
    const json = JSON.stringify(validCreateBody);
    const jsonBytes = Buffer.byteLength(json, 'utf8');

    // JSONは末尾の空白を許可するため、
    // domain validationを壊さずに正確なサイズを作れる。
    const exactLimitBody = json + ' '.repeat(MAX_BODY_BYTES - jsonBytes);

    expect(Buffer.byteLength(exactLimitBody, 'utf8')).toBe(MAX_BODY_BYTES);

    const request = createRequest({
      body: exactLimitBody,
      headers: {
        'content-length': String(MAX_BODY_BYTES),
      },
    });
    const response = createResponse();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(201);
    expect(addTodoMock).toHaveBeenCalledTimes(1);
  });

  test('rejects Content-Length above 16,384 before reading', async () => {
    const readMock = vi.fn();

    const request = new Readable({
      read() {
        readMock();
        this.push(Buffer.from(JSON.stringify(validCreateBody), 'utf8'));
        this.push(null);
      },
    });

    Object.assign(request, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(MAX_BODY_BYTES + 1),
      },
      query: {},
    });

    const response = createResponse();

    await handler(request as unknown as NextApiRequest, response);

    expect(response._getStatusCode()).toBe(413);
    expect(response._getJSONData()).toEqual({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
      },
    });

    expect(readMock).not.toHaveBeenCalled();
    expect(addTodoMock).not.toHaveBeenCalled();
  });

  test('rejects a streamed body above 16,384 bytes without Content-Length', async () => {
    const json = JSON.stringify(validCreateBody);
    const jsonBytes = Buffer.byteLength(json, 'utf8');

    const exactLimitBody = json + ' '.repeat(MAX_BODY_BYTES - jsonBytes);

    const request = createRequest({
      chunks: [
        Buffer.from(exactLimitBody.slice(0, 8_000), 'utf8'),
        Buffer.from(exactLimitBody.slice(8_000), 'utf8'),
        Buffer.from(' ', 'utf8'),
      ],
    });
    const response = createResponse();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(413);
    expect(response._getJSONData()).toEqual({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
      },
    });

    expect(addTodoMock).not.toHaveBeenCalled();
  });

  test('measures multibyte input by bytes, not characters', async () => {
    const body = JSON.stringify({
      title: 'あ'.repeat(6_000),
      date: '2099-01-01',
      priority: 'high',
      completed: false,
    });

    expect(body.length).toBeLessThan(MAX_BODY_BYTES);
    expect(Buffer.byteLength(body, 'utf8')).toBeGreaterThan(MAX_BODY_BYTES);

    const request = createRequest({ body });
    const response = createResponse();

    await handler(request, response);

    expect(response._getStatusCode()).toBe(413);
    expect(addTodoMock).not.toHaveBeenCalled();
  });

  test.each(['POST', 'PUT', 'PATCH'])(
    '%s rejects unknown fields before querying',
    async (method) => {
      const body =
        method === 'POST'
          ? {
              ...validCreateBody,
              user_id: 'injected-owner',
            }
          : {
              ...validCreateBody,
              id: '123',
              user_id: 'injected-owner',
            };

      const request = createRequest({
        method,
        body: JSON.stringify(body),
      });
      const response = createResponse();

      await handler(request, response);

      expect(response._getStatusCode()).toBe(400);
      expect(response._getJSONData()).toEqual(
        expect.objectContaining({
          error: expect.objectContaining({
            code: 'BAD_REQUEST',
          }),
        }),
      );
      expect(addTodoMock).not.toHaveBeenCalled();
      expect(updateTodoMock).not.toHaveBeenCalled();
      expect(deleteTodoMock).not.toHaveBeenCalled();
    },
  );
});
