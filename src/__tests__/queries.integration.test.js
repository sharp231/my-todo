import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import pool from '../lib/db';
import {
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from '../lib/queries';

const TEST_USER_ID = 'user_test_123';
const OTHER_USER_ID = 'user_test_456';

describe('todo queries', () => {
  beforeEach(async () => {
    await pool.query(
      'TRUNCATE TABLE public.todos RESTART IDENTITY'
    );
  });

  afterAll(async () => {
    await pool.end();
  });

  test('adds and returns a todo with completed', async () => {
    const created = await addTodo(
      TEST_USER_ID,
      'Create integration test',
      '2099-01-01',
      'high',
      true
    );

    expect(created).toEqual(
      expect.objectContaining({
        title: 'Create integration test',
        date: '2099-01-01',
        priority: 'high',
        completed: true,
      })
    );

    expect(typeof created.id).toBe('string');
    expect(created.created_at).toBeInstanceOf(Date);
    expect(created.updated_at).toBeInstanceOf(Date);
  });

  test('returns todos ordered by created_at descending', async () => {
    const olderTodo = await addTodo(
      TEST_USER_ID,
      'Older todo',
      '2099-01-01',
      'low',
      false
    );

    const newerTodo = await addTodo(
      TEST_USER_ID,
      'Newer todo',
      '2099-01-02',
      'medium',
      true
    );

    // 固定時間のsleepに依存せず、順序を決定的にする。
    await pool.query(
      `
        UPDATE public.todos
        SET created_at = $1
        WHERE id = $2
      `,
      ['2026-01-01T00:00:00.000Z', olderTodo.id]
    );

    await pool.query(
      `
        UPDATE public.todos
        SET created_at = $1
        WHERE id = $2
      `,
      ['2026-01-02T00:00:00.000Z', newerTodo.id]
    );

    const todos = await getTodos(TEST_USER_ID);

    expect(todos.map((todo) => todo.id)).toEqual([
      newerTodo.id,
      olderTodo.id,
    ]);
  });

  test('updates all supported todo fields', async () => {
    const created = await addTodo(
      TEST_USER_ID,
      'Original todo',
      '2099-01-01',
      'low',
      false
    );

    const updated = await updateTodo(TEST_USER_ID, created.id, {
      title: 'Updated todo',
      date: '2099-02-01',
      priority: 'high',
      completed: true,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'Updated todo',
        date: '2099-02-01',
        priority: 'high',
        completed: true,
      })
    );
  });

  test('updates only completed', async () => {
    const created = await addTodo(
      TEST_USER_ID,
      'Partial update',
      '2099-01-01',
      'medium',
      false
    );

    const updated = await updateTodo(TEST_USER_ID, created.id, {
      completed: true,
    });

    expect(updated).toEqual(
      expect.objectContaining({
        id: created.id,
        title: 'Partial update',
        date: '2099-01-01',
        priority: 'medium',
        completed: true,
      })
    );
  });

  test('returns undefined when the update target does not exist', async () => {
    const updated = await updateTodo(TEST_USER_ID, '999999999', {
      completed: true,
    });

    expect(updated).toBeUndefined();
  });

  test('deletes a todo and returns the affected row count', async () => {
    const created = await addTodo(
      TEST_USER_ID,
      'Delete todo',
      '2099-01-01',
      'low',
      false
    );

    expect(await deleteTodo(TEST_USER_ID, created.id)).toBe(1);
    expect(await deleteTodo(TEST_USER_ID, created.id)).toBe(0);
    expect(await getTodos(TEST_USER_ID)).toEqual([]);
  });

  test('rejects unsupported update fields', async () => {
    const created = await addTodo(
      TEST_USER_ID,
      'Protected todo',
      '2099-01-01',
      'low',
      false
    );

    await expect(
      updateTodo(TEST_USER_ID, created.id, {
        user_id: 'unexpected-user',
      })
    ).rejects.toThrow('Unsupported todo update field');
  });
  test('returns only todos owned by the requested user', async () => {
    const ownedTodo = await addTodo(
      TEST_USER_ID,
      'Owned todo',
      '2099-01-01',
      'high',
      false
    );

    await addTodo(
      OTHER_USER_ID,
      'Other user todo',
      '2099-01-02',
      'low',
      false
    );

    const todos = await getTodos(TEST_USER_ID);

    expect(todos).toHaveLength(1);
    expect(todos[0].id).toBe(ownedTodo.id);
    expect(todos[0].title).toBe('Owned todo');
  });

  test('does not update or delete another user todo', async () => {
    const ownedTodo = await addTodo(
      TEST_USER_ID,
      'Protected owner todo',
      '2099-01-01',
      'medium',
      false
    );

    const updated = await updateTodo(
      OTHER_USER_ID,
      ownedTodo.id,
      {
        title: 'Unauthorized update',
      }
    );

    expect(updated).toBeUndefined();
    expect(await deleteTodo(OTHER_USER_ID, ownedTodo.id)).toBe(0);

    const remainingTodos = await getTodos(TEST_USER_ID);

    expect(remainingTodos).toHaveLength(1);
    expect(remainingTodos[0]).toEqual(
      expect.objectContaining({
        id: ownedTodo.id,
        title: 'Protected owner todo',
      })
    );
  });
});
