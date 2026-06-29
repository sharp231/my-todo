import { ApiError, ERROR_CODES } from './errorHandler';

const PRIORITIES = ['low', 'medium', 'high'];
const TITLE_MAX_LENGTH = 100;
const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

// 400: リクエスト形式そのものが不正な場合に使用する。
const fail400 = (message, details) => {
  throw new ApiError(ERROR_CODES.BAD_REQUEST, message, { details })
};
// 422: JSON形式は正しいが、入力値の内容が不正な場合に使用する。
const fail422 = (message, details) => {
  throw new ApiError(ERROR_CODES.VALIDATION_ERROR, message, { details })
};

const assertObject = (body) => {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail400('request body must be an object');
  }
  return body;
};
// 想定外フィールドを拒否し、APIで許可した項目だけを受け付ける。
const assertAllowedFields = (body, allowedFields) => {
  const unexpected = Object.keys(body).filter((field) => !allowedFields.includes(field));
  if (unexpected.length > 0) {
    fail400('unexpected field', { fields: unexpected });
  }
};

export const validateTodoId = (id) => {
  if (Array.isArray(id)) fail400('id must be a single value', { field: 'id' });

  const value = typeof id === 'string' ? id.trim() : id;
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    fail422('id must be a positive integer', { field: 'id' });
  }
  return numberValue;
};

const readString = (body, field, options = {}) => {
  const value = body[field];

  if (value === undefined) {
    if (options.required) fail422(`${field} is required`, { field });
    return undefined;
  }
  if (value === null) {
    if (options.required) fail422(`${field}is required`, { field });
    fail422(`${field} must be a string`, { field });
  }
  if (typeof value !== `string`) fail422(`${field} must be a string`, { field });

  const trimmed = value.trim();
  if (!trimmed) fail422(`${field} is required`, { field });

  if (options.maxLength && trimmed.length > options.maxLength) {
    fail422(`${field} must be ${options.maxLength} characters or less`, {
      field,
      maxLength: options.maxLength,
    });
  }
  return trimmed;
}

const readDate = (body, field, options = {}) => {
  const value = readString(body, field, options);
  if (value === undefined) return undefined;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    fail422(`${field} must be a valid date`, { field, format: 'YYYY-MM-DD' });
  }
  return value;
}

const readPriority = (body, options = {}) => {
  const priority = readString(body, 'priority', options);
  if (priority === undefined) return undefined;

  if (!PRIORITIES.includes(priority)) {
    fail422('priority is invalid', { field: 'priority', allowed: PRIORITIES });

  }
  return priority;
};

const readBoolean = (body, field, options = {}) => {
  const value = body[field];

  if (value === undefined) {
    if (options.required) fail422(`${field} is required`, { field });
    return options.defaultValue;
  }
  if (typeof value !== 'boolean') fail422(`${field} must be a boolean`, { field });

  return value;
};
// POST用: 新規作成に必要な入力を検証し、titleのtrimやcompletedの初期値補完を行う。
export const validateCreateTodoInput = (body) => {
  const input = assertObject(body);
  assertAllowedFields(input, ['title', 'date', 'priority', 'completed']);

  return {
    title: readString(input, 'title', { required: true, maxLength: TITLE_MAX_LENGTH }),
    date: readDate(input, 'date', { required: true }),
    priority: readPriority(input, { required: true }),
    completed: readBoolean(input, 'completed', { defaultValue: false }),
  };
};
// PUT用: 完全置換のため、id/title/date/priority/completedをすべて必須として検証する。
export const validateReplaceTodoInput = (body) => {
  const input = assertObject(body);
  assertAllowedFields(input, ['id', 'title', 'date', 'priority', 'completed']);

  return {
    id: validateTodoId(input.id),
    title: readString(input, 'title', { required: true, maxLength: TITLE_MAX_LENGTH }),
    date: readDate(input, 'date', { required: true }),
    priority: readPriority(input, { required: true }),
    completed: readBoolean(input, 'completed', { required: true }),
  };
};
// PATCH用: 部分更新のため、idは必須、更新対象フィールドは1つ以上必要とする。
export const validatePatchTodoInput = (body) => {
  const input = assertObject(body);
  assertAllowedFields(input, ['id', 'title', 'date', 'priority', 'completed']);

  const id = validateTodoId(input.id);
  const fields = {};

  if (hasOwn(input, 'title')) fields.title = readString(input, 'title', { maxLength: TITLE_MAX_LENGTH });
  if (hasOwn(input, 'date')) fields.date = readDate(input, 'date');
  if (hasOwn(input, 'priority')) fields.priority = readPriority(input);
  if (hasOwn(input, 'completed')) fields.completed = readBoolean(input, 'completed');

  if (Object.keys(fields).length === 0) {
    fail400('at least one update field is required');
  }
  return { id, fields };
}
