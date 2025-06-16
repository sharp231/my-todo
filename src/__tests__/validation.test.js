import { describe, test, expect } from 'vitest';
import { validateTodoInput, validateId, validateUpdateTodoInput, validateCompleteTodoInput } from '../utils/validation';

describe('Todo Validation Tests', () => {
  describe('validateTodoInput', () => {
    test('正常な入力の場合、nullを返す', () => {
      const result = validateTodoInput('テストタスク', '2024-03-20', 'medium');
      expect(result).toBeNull();
    });

    test('タイトルが無効な場合、エラーを返す', () => {
      const result = validateTodoInput('', '2024-03-20', 'medium');
      expect(result).toEqual({ error: 'Invalid or missing "title"' });
    });

    test('日付が無効な場合、エラーを返す', () => {
      const result = validateTodoInput('テストタスク', 'invalid-date', 'medium');
      expect(result).toEqual({ error: 'Invalid "date" format' });
    });

    test('優先度が無効な場合、エラーを返す', () => {
      const result = validateTodoInput('テストタスク', '2024-03-20', 'invalid');
      expect(result).toEqual({ error: 'Invalid "priority" value' });
    });
  });

  describe('validateId', () => {
    test('正常なIDの場合、nullを返す', () => {
      const result = validateId('123');
      expect(result).toBeNull();
    });

    test('無効なIDの場合、エラーを返す', () => {
      const result = validateId('abc');
      expect(result).toEqual({ error: 'Invalid or missing "id"' });
    });
  });

  describe('validateUpdateTodoInput', () => {
    test('正常な入力の場合、nullを返す', () => {
      const result = validateUpdateTodoInput('123', '更新タスク', '2024-03-20', 'high');
      expect(result).toBeNull();
    });

    test('IDが無効な場合、エラーを返す', () => {
      const result = validateUpdateTodoInput('abc', '更新タスク', '2024-03-20', 'high');
      expect(result).toEqual({ error: 'Invalid or missing "id"' });
    });

    test('タイトルが無効な場合、エラーを返す', () => {
      const result = validateUpdateTodoInput('123', 123, '2024-03-20', 'high');
      expect(result).toEqual({ error: 'Invalid "title"' });
    });
  });

  describe('validateCompleteTodoInput', () => {
    test('正常な入力の場合、nullを返す', () => {
      const result = validateCompleteTodoInput({
        title: '完了タスク',
        date: '2024-03-20',
        priority: 'low'
      });
      expect(result).toBeNull();
    });

    test('必須フィールドが欠けている場合、エラーを返す', () => {
      const result = validateCompleteTodoInput({
        title: '',
        date: '2024-03-20',
        priority: 'low'
      });
      expect(result).toEqual({ error: 'Invalid or missing "title"' });
    });
  });
});