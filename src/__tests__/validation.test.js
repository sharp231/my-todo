import { describe, test, expect } from 'vitest';
import { 
  validateTodoInput, 
  validateId, 
  validateUpdateTodoInput, 
  validateCompleteTodoInput 
} from '../utils/validation';

describe('Todo Validation Tests', () => {
  // ■ POST Validation
  describe('validateTodoInput', () => {
    test('should return null for valid input', () => {
      const result = validateTodoInput('Test Task', '2024-03-20', 'medium', false);
      expect(result).toBeNull();
    });

    test('should return error if title is invalid or missing', () => {
      const result = validateTodoInput('', '2024-03-20', 'medium');
      expect(result).toEqual({ error: 'Invalid or missing "title"' });
    });

    test('should return error for invalid date format', () => {
      const result = validateTodoInput('Test Task', 'invalid-date', 'medium');
      expect(result).toEqual({ error: 'Invalid "date" format' });
    });

    test('should return error for invalid priority value', () => {
      const result = validateTodoInput('Test Task', '2024-03-20', 'invalid');
      expect(result).toEqual({ error: 'Invalid "priority" value' });
    });

    test('should return error if completed is not a boolean', () => {
      const result = validateTodoInput('Test Task', '2024-03-20', 'medium', 'true_string');
      expect(result).toEqual({ error: 'Invalid "completed" value (must be boolean)' });
    });
  });

  // ■ ID Validation
  describe('validateId', () => {
    test('should return null for valid numeric ID', () => {
      const result = validateId('123');
      expect(result).toBeNull();
    });

    test('should return error for non-numeric ID', () => {
      const result = validateId('abc');
      expect(result).toEqual({ error: 'Invalid or missing "id"' });
    });
  });

  // ■ PATCH Validation (Partial Update)
  describe('validateUpdateTodoInput', () => {
    test('should return null for valid partial input', () => {
      const result = validateUpdateTodoInput('123', 'Updated Task', '2024-03-20', 'high', true);
      expect(result).toBeNull();
    });

    test('should return error if ID is invalid', () => {
      const result = validateUpdateTodoInput('abc', 'Updated Task', '2024-03-20', 'high');
      expect(result).toEqual({ error: 'Invalid or missing "id"' });
    });

    test('should return error if title is invalid type', () => {
      const result = validateUpdateTodoInput('123', 123, '2024-03-20', 'high');
      expect(result).toEqual({ error: 'Invalid "title"' });
    });
    
    test('should return error if completed is not a boolean', () => {
      const result = validateUpdateTodoInput('123', undefined, undefined, undefined, 'not-boolean');
      expect(result).toEqual({ error: 'Invalid "completed" value (must be boolean)' });
    });
  });

  // ■ PUT Validation (Complete Update)
  describe('validateCompleteTodoInput', () => {
    test('should return null when all required fields are present and valid', () => {
      const result = validateCompleteTodoInput({
        title: 'Completed Task',
        date: '2024-03-20',
        priority: 'low',
        completed: false
      });
      expect(result).toBeNull();
    });

    test('should return error if required field "title" is missing', () => {
      const result = validateCompleteTodoInput({
        title: '',
        date: '2024-03-20',
        priority: 'low',
        completed: false
      });
      expect(result).toEqual({ error: 'Invalid or missing "title"' });
    });

    test('should return error if required field "completed" is missing', () => {
      const result = validateCompleteTodoInput({
        title: 'Completed Task',
        date: '2024-03-20',
        priority: 'low'
        // completed missing
      });
      expect(result).toEqual({ error: 'Invalid or missing "completed" value' });
    });
  });
});