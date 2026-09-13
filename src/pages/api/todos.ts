import { getTodos, addTodo, deleteTodo, updateTodo } from '../../lib/queries';
import { ApiError, ERROR_CODES, handleError } from '../../utils/errorHandler';
import { requireAuthenticatedUserId } from '../../lib/auth';
import {
  validateCreateTodoInput,
  validateReplaceTodoInput,
  validatePatchTodoInput,
  validateTodoId,
} from '../../utils/validation';
import { TextDecoder } from 'node:util';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { TodoId } from '../../types/todo';

const TODO_JSON_BODY_LIMIT_BYTES = 16 * 1024;

const JSON_CONTENT_TYPE_PATTERN =
  /^application\/json(?:\s*;\s*charset\s*=\s*utf-8)?$/i;

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'];

const todoNotFound = (id: TodoId): ApiError =>
  new ApiError(ERROR_CODES.NOT_FOUND, 'Todo not found', {
    details: { resource: 'todo', id },
  });

const payloadTooLarge = (): ApiError =>
  new ApiError(ERROR_CODES.PAYLOAD_TOO_LARGE, 'Request body is too large');

// JSONパース不可やContent-Type不備は、リクエスト形式不正として400を返す。
const readJsonBody = async (req: NextApiRequest): Promise<unknown> => {
  const contentType = req.headers['content-type'];

  if (
    typeof contentType !== 'string' ||
    !JSON_CONTENT_TYPE_PATTERN.test(contentType.trim())
  ) {
    throw new ApiError(
      ERROR_CODES.BAD_REQUEST,
      'Content-Type must be application/json',
      {
        details: { header: 'Content-Type' },
      },
    );
  }

  const contentLength = req.headers['content-length'];

  if (contentLength !== undefined) {
    if (
      typeof contentLength !== 'string' ||
      contentLength.length === 0 ||
      /[^0-9]/.test(contentLength)
    ) {
      throw new ApiError(
        ERROR_CODES.BAD_REQUEST,
        'Content-Length must be a non-negative integer',
        {
          details: { header: 'Content-Length' },
        },
      );
    }

    // 本文を読む前の早期拒否。
    // 巨大な値がInfinityになった場合も上限超過として拒否する。
    if (Number(contentLength) > TODO_JSON_BODY_LIMIT_BYTES) {
      throw payloadTooLarge();
    }
  }

  const chunks: Buffer[] = [];
  let receivedBytes = 0;

  //上限超過時にリクエストを自動破棄すると、
  //413を返す前に接続が閉じる場合があるため抑止する
  const bodyStream: AsyncIterable<unknown> = req.iterator({
    destroyOnReturn: false,
  });
  try {
    for await (const chunk of bodyStream) {
      let buffer: Buffer;

      if (Buffer.isBuffer(chunk)) {
        buffer = chunk;
      } else if (typeof chunk === 'string') {
        buffer = Buffer.from(chunk, 'utf8');
      } else {
        throw new TypeError('Unexpected request body chunk');
      }
      if (buffer.length > TODO_JSON_BODY_LIMIT_BYTES - receivedBytes) {
        throw payloadTooLarge();
      }
      receivedBytes += buffer.length;

      if (buffer.length > 0) {
        chunks.push(buffer);
      }
    }
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      ERROR_CODES.BAD_REQUEST,
      'request body could not be read',
      { cause: error },
    );
  }

  let rawBody: string;

  try {
    // 不正なUTF-8を代替文字に変換して受理しない。
    rawBody = new TextDecoder('utf-8', {
      fatal: true,
      ignoreBOM: true,
    }).decode(Buffer.concat(chunks, receivedBytes));
  } catch (error: unknown) {
    throw new ApiError(
      ERROR_CODES.BAD_REQUEST,
      'request body must be valid UTF-8',
      { cause: error },
    );
  }

  if (rawBody.trim().length === 0) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, 'request body is required');
  }

  try {
    const parsedBody: unknown = JSON.parse(rawBody);
    return parsedBody;
  } catch (error: unknown) {
    throw new ApiError(
      ERROR_CODES.BAD_REQUEST,
      'request body must be valid JSON',
      { cause: error },
    );
  }
};
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<unknown>,
): Promise<void> {
  res.setHeader('Allow', ALLOWED_METHODS);

  try {
    const userId = requireAuthenticatedUserId(req);
    if (req.method === 'GET') {
      const todos = await getTodos(userId);
      return res.status(200).json(todos);
    }

    // 以下は現在の処理を維持
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const input = validateCreateTodoInput(body);
      // POST
      const newTodo = await addTodo(
        userId,
        input.title,
        input.date,
        input.priority,
        input.completed,
      );
      return res.status(201).json(newTodo);
    }
    if (req.method === 'DELETE') {
      const id = validateTodoId(req.query.id);
      // DELETE
      const deletedCount = await deleteTodo(userId, id);
      if (deletedCount === 0) throw todoNotFound(id);

      return res.status(200).json({ message: 'Todo deleted successfully' });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const input = validateReplaceTodoInput(body);

      // PUT
      const updatedTodo = await updateTodo(userId, input.id, {
        title: input.title,
        date: input.date,
        priority: input.priority,
        completed: input.completed,
      });

      if (!updatedTodo) throw todoNotFound(input.id);

      return res.status(200).json({
        message: 'Todo completely replaced',
        method: 'PUT',
        todo: updatedTodo,
      });
    }
    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const input = validatePatchTodoInput(body);
      // PATCH
      const updatedTodo = await updateTodo(userId, input.id, input.fields);

      if (!updatedTodo) throw todoNotFound(input.id);

      return res.status(200).json(updatedTodo);
    }
    throw new ApiError(
      ERROR_CODES.METHOD_NOT_ALLOWED,
      `Method ${req.method} NotAllowed`,
    );
  } catch (error) {
    return handleError(res, error);
  }
}
