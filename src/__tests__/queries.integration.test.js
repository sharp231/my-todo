import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';

import pool from '../lib/db.js';
import {
  addTodo,
  deleteTodo,
  getTodos,
  updateTodo,
} from '../lib/queries.js';

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

    expect(created.id).toBeDefined();
    expect(created.created_at).toBeDefined();
    expect(created.updated_at).toBeDefined();
  });

  test('returns todos ordered by created_at descending', async () => {
    const olderTodo = await addTodo(
      'Older todo',
      '2099-01-01',
      'low',
      false
    );

    const newerTodo = await addTodo(
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

    const todos = await getTodos();

    expect(todos.map((todo) => todo.id)).toEqual([
      newerTodo.id,
      olderTodo.id,
    ]);
  });

  test('updates all supported todo fields', async () => {
    const created = await addTodo(
      'Original todo',
      '2099-01-01',
      'low',
      false
    );

    const updated = await updateTodo(created.id, {
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
      'Partial update',
      '2099-01-01',
      'medium',
      false
    );

    const updated = await updateTodo(created.id, {
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
    const updated = await updateTodo('999999999', {
      completed: true,
    });

    expect(updated).toBeUndefined();
  });

  test('deletes a todo and returns the affected row count', async () => {
    const created = await addTodo(
      'Delete todo',
      '2099-01-01',
      'low',
      false
    );

    expect(await deleteTodo(created.id)).toBe(1);
    expect(await deleteTodo(created.id)).toBe(0);
    expect(await getTodos()).toEqual([]);
  });

  test('rejects unsupported update fields', async () => {
    const created = await addTodo(
      'Protected todo',
      '2099-01-01',
      'low',
      false
    );

    await expect(
      updateTodo(created.id, {
        user_id: 'unexpected-user',
      })
    ).rejects.toThrow('Unsupported todo update field');
  });
});