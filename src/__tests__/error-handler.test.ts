import { createResponse } from 'node-mocks-http';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ApiError, ERROR_CODES, handleError } from '../utils/errorHandler';

describe('API error handling', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns the fixed payload-too-large response', () => {
    const response = createResponse();

    handleError(
      response,
      new ApiError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Request body is too large'),
    );
    expect(response._getStatusCode()).toBe(413);
    expect(response._getJSONData()).toEqual({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Request body is too large',
      },
    });
  });
  test('does not expose PostgreSQL constraint details', () => {
    const response = createResponse();

    const databaseError = Object.assign(
      new Error('duplicate key violates constraint'),
      {
        code: '23505',
        constraint: 'todos_private_constraint',
        detail: 'Key (secret) already exists',
      },
    );

    handleError(response, databaseError);

    expect(response._getStatusCode()).toBe(409);
    expect(response._getJSONData()).toEqual({
      error: {
        code: 'CONFLICT',
        message: 'resource conflict',
      },
    });

    const serializedResponse = JSON.stringify(response._getJSONData());
    expect(serializedResponse).not.toContain('todos_private_constraint');
    expect(serializedResponse).not.toContain('Key (secret)');
  });

  test('returns a generic response for unexpected errors', () => {
    const logMock = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const response = createResponse();
    const internalError = Object.assign(
      new Error('password=secret database failed'),
      {
        code: '08006',
        connectionString: 'postgresql://user:secret@example.com/db',
      },
    );
    handleError(response, internalError);

    expect(response._getStatusCode()).toBe(500);
    expect(response._getJSONData()).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal Server Error',
      },
    });
    expect(logMock).toHaveBeenCalledWith('API request failed', {
      code: 'INTERNAL_ERROR',
      status: 500,
      internalCode: '08006',
    });

    expect(JSON.stringify(logMock.mock.calls)).not.toContain('secret');
  });
});
