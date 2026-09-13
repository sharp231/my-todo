import { describe, test, expect } from 'vitest';
import { ApiError, ERROR_CODES } from '../utils/errorHandler';
import {
  validateCreateTodoInput,
  validatePatchTodoInput,
  validateReplaceTodoInput,
  validateTodoId,
} from '../utils/validation';


// 新バリデーションは失敗時に ApiError をthrowするため、共通helperでcode/detailsを検証する。
const expectApiError = (fn, code, details) => {
  let caught;
  try {
    fn();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(ApiError);
  expect(caught.code).toBe(code);
  if (details) expect(caught.details).toMatchObject(details);
};

describe('Todo Validation Tests', () => {
  test("valid create input is normalized", () => {
    expect(validateCreateTodoInput({
      title: ' Test Task ',
      date: '2024-03-20',
      priority: 'medium',
    })).toEqual({
      title: 'Test Task',
      date: '2024-03-20',
      priority: 'medium',
      completed: false,
    });
  });

  test('create rejects empty title', () => {
    expectApiError(
      () => validateCreateTodoInput({ title: '', date: '2024-03-20', priority: 'medium' }),
      ERROR_CODES.VALIDATION_ERROR,
      { field: 'title' }
    );
  });
  // 各メソッドで入力検証を通してからDB処理を行い、API契約を一貫させる。
  test('create rejects unexpected fields', () => {
    expectApiError(
      () => validateCreateTodoInput({ title: 'x', date: '2024-03-20', priority: 'medium', extra: true }),
      ERROR_CODES.BAD_REQUEST,
      { fields: ['extra'] }
    );
  });

  test('create rejects invalid priority', () => {
    expectApiError(
      () => validateCreateTodoInput({ title: 'x', date: '2024-03-20', priority: 'urgent' }),
      ERROR_CODES.VALIDATION_ERROR,
      { field: 'priority' }
    );
  });

  test('valid id remains a string', () => {
    expect(validateTodoId('123')).toBe('123');
  });

  test('valid patch input returns id and fields', () => {
    expect(validatePatchTodoInput({ id: '123', completed: true })).toEqual({
      id: '123',
      fields: { completed: true },
    });
  });

  test.each([
    ['title', { title: null }],
    ['date', { date: null }],
    ['priority', { priority: null }],
    ['completed', { completed: null }],
  ])('patch rejects null %s', (field, patch) => {

    expectApiError(
      () => validatePatchTodoInput({ id: '123', ...patch }),
      ERROR_CODES.VALIDATION_ERROR,
      { field }
    );
  });

  test('valid replace input returns full todo', () => {
    expect(validateReplaceTodoInput({
      id: '123',
      title: 'Task',
      date: '2024-03-20',
      priority: 'low',
      completed: false,
    })).toEqual({
      id: '123',
      title: 'Task',
      date: '2024-03-20',
      priority: 'low',
      completed: false,
    });
  });

  test('replace rejects missing completed', () => {
    expectApiError(
      () => validateReplaceTodoInput({ id: '123', title: 'Task', date: '2024-03-20', priority: 'low' }),
      ERROR_CODES.VALIDATION_ERROR,
      { field: 'completed' }
    );
  });

  test.each([
    '9007199254740993',
    '9223372036854775807',
  ])('preserves large ID %s', (id) => {
    expect(validateTodoId(id)).toBe(id);
  });

  test.each([
    undefined,
    null,
    true,
    123,
    Number.MAX_SAFE_INTEGER + 1,
    '',
    '0',
    '-1',
    '1.5',
    '1e3',
    '+1',
    '01',
    '1\n',
    '9223372036854775808',
  ])('rejects invalid ID %s', (id) => {
    expectApiError(
      () => validateTodoId(id),
      ERROR_CODES.VALIDATION_ERROR,
      { field: 'id' },
    );
  });

  test('rejects repeated query IDs', () => {
    expectApiError(() =>
      validateTodoId(['1', '2']),
      ERROR_CODES.BAD_REQUEST,
      { field: 'id' },
    );
  });

  test.each([
    '2026-02-30',
    '2025-02-29',
    '2100-02-29',
    '2026-04-31',
    '2026-00-01',
    '2026-13-01',
    '2026-01-00',
    '0000-01-01',
  ])('rejects invalid date %s', (date) => {
    expectApiError(
      () => validateCreateTodoInput({
        title: 'Date test',
        date,
        priority: 'low',
      }),
      ERROR_CODES.VALIDATION_ERROR,
      { field: 'date' },
    );
  });
  test.each(['2024-02-29',
    '2000-02-29',
  ])('accepts valid leap date %s', (date) => {
    expect(
      validateCreateTodoInput({
        title: 'Leap year test',
        date,
        priority: 'low',
      }).date,
    ).toBe(date);
  });
  test('rejects a patch with no update fields', () => {
    expectApiError(
      () => validatePatchTodoInput({ id: '123' }),
      ERROR_CODES.BAD_REQUEST,
    );
  });
  test('reject an explicitly undefined patch field', () => {
    expectApiError(
      () => validatePatchTodoInput({
        id: '123',
        completed: undefined,
      }),
      ERROR_CODES.VALIDATION_ERROR,
      { field: 'completed' },
    );
  });
});

