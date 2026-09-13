import { ApiError, ERROR_CODES } from './errorHandler';
import type { ApiErrorDetails } from './errorHandler';
import type {
  TodoId,
  TodoPriority,
  TodoRecord,
  TodoUpdateFields,
} from '../types/todo';

const TITLE_MAX_LENGTH = 100;
const MAX_TODO_ID = '9223372036854775807'; // 2^63 - 1

const CREATE_FIELDS = ['title', 'date', 'priority', 'completed'] as const;

const UPDATE_FIELDS = ['id', ...CREATE_FIELDS] as const;

export type CreateTodoInput = Pick<
  TodoRecord,
  'title' | 'date' | 'priority' | 'completed'
>;

export type ReplaceTodoInput = CreateTodoInput & {
  id: TodoId;
};

export type PatchTodoInput = { id: TodoId; fields: TodoUpdateFields };

function fail400(message: string, details?: ApiErrorDetails): never {
  throw new ApiError(ERROR_CODES.BAD_REQUEST, message, {
    details,
  });
}

function fail422(message: string, details?: ApiErrorDetails): never {
  throw new ApiError(ERROR_CODES.VALIDATION_ERROR, message, {
    details,
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOwn(object: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

//本文形式と未知フィールドを、値の検証より先に確認
function readObject(
  body: unknown,
  allowedFields: readonly string[],
): Record<string, unknown> {
  if (!isObject(body)) {
    fail400('request body must be a JSON object');
  }
  const unexpectedFields = Object.keys(body).filter(
    (field) => !allowedFields.includes(field),
  );

  if (unexpectedFields.length > 0) {
    fail400('unexpected fields', {
      fields: unexpectedFields,
    });
  }
  return body;
}

function readString(value: unknown, field: string): string {
  if (value === undefined || value === null) {
    fail422(`${field} is required`, { field });
  }
  if (typeof value !== 'string') {
    fail422(`${field} must be a string`, { field });
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    fail422(`${field} is required`, { field });
  }
  return trimmed;
}

function readTitle(value: unknown): string {
  const title = readString(value, 'title');
  if (title.length > TITLE_MAX_LENGTH) {
    fail422(`title must be ${TITLE_MAX_LENGTH} characters or less`, {
      field: 'title',
      maxLength: TITLE_MAX_LENGTH,
    });
  }
  return title;
}

function readDate(value: unknown): string {
  const date = readString(value, 'date');
  // 日付の形式を検証する（YYYY-MM-DD）
  const invaliDate = (): never =>
    fail422('date must be a valid date', {
      field: 'date',
      format: 'YYYY-MM-DD',
    });
  if (date.length !== 10 || !/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date)) {
    return invaliDate();
  }

  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));
  const day = Number(date.slice(8, 10));

  if (year < 1 || month < 1 || month > 12) {
    return invaliDate();
  }
  const isLeapYear = year % 400 === 0 || (year % 4 === 0 && year % 100 !== 0);

  const daysByMoth = [
    31,
    isLeapYear ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  const daysInMoth = daysByMoth[month - 1];

  if (daysInMoth === undefined || day < 1 || day > daysInMoth) {
    return invaliDate();
  }
  return date;
}
function readPriority(value: unknown): TodoPriority {
  const priority = readString(value, 'priority');

  if (priority !== 'low' && priority !== 'medium' && priority !== 'high') {
    fail422('priority is invalid', {
      field: 'priority',
      allowed: ['low', 'medium', 'high'],
    });
  }
  return priority;
}

function readCompleted(value: unknown): boolean {
  if (value === undefined) {
    fail422('completed is required', { field: 'completed' });
  }

  if (typeof value !== 'boolean') {
    fail422('completed must be a boolean', { field: 'completed' });
  }
  return value;
}

export function validateTodoId(id: unknown): TodoId {
  if (Array.isArray(id)) {
    fail400('id must be a single value', { field: 'id' });
  }

  if (
    typeof id !== 'string' ||
    id.length === 0 ||
    id.length > MAX_TODO_ID.length ||
    id[0] === '0' ||
    /[^0-9]/.test(id)
  ) {
    fail422('id must be a positive decimal integer string', { field: 'id' });
  }

  //同じ桁数の10進数字列は文字列比較で大小を判定
  //numberへ変換しないことで、大きなIDの丸めを防ぐ

  if (id.length === MAX_TODO_ID.length && id > MAX_TODO_ID) {
    fail422('id is out of range', {
      field: 'id',
    });
  }
  return id;
}

export function validateCreateTodoInput(body: unknown): CreateTodoInput {
  const input = readObject(body, CREATE_FIELDS);

  return {
    title: readTitle(input.title),
    date: readDate(input.date),
    priority: readPriority(input.priority),
    completed: hasOwn(input, 'completed')
      ? readCompleted(input.completed)
      : false,
  };
}

export function validateReplaceTodoInput(body: unknown): ReplaceTodoInput {
  const input = readObject(body, UPDATE_FIELDS);
  return {
    id: validateTodoId(input.id),
    title: readTitle(input.title),
    date: readDate(input.date),
    priority: readPriority(input.priority),
    completed: readCompleted(input.completed),
  };
}

export function validatePatchTodoInput(body: unknown): PatchTodoInput {
  const input = readObject(body, UPDATE_FIELDS);
  const id = validateTodoId(input.id);

  const fields: TodoUpdateFields = {};

  if (hasOwn(input, 'title')) {
    fields.title = readTitle(input.title);
  }
  if (hasOwn(input, 'date')) {
    fields.date = readDate(input.date);
  }
  if (hasOwn(input, 'priority')) {
    fields.priority = readPriority(input.priority);
  }
  if (hasOwn(input, 'completed')) {
    fields.completed = readCompleted(input.completed);
  }
  if (Object.keys(fields).length === 0) {
    fail400('at least one update field is required');
  }
  return { id, fields };
}
