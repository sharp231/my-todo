import {
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from 'vitest';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('../lib/db', () => ({
  default: {
    query: queryMock,
  },
}));

import {
  deleteTodo,
  updateTodo,
} from '../lib/queries';

const TEST_USER_ID = 'user_test_123';
const LARGE_TODO_ID = '9007199254740993';

describe('todo query security', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test.each([
    'id',
    'user_id',
    'created_at',
    'updated_at',
    '__proto__',
    'constructor',
    'toString',
    'title = NULL --',
  ])(
    'rejects unsupported column %s before querying',
    async (field) => {
      // 正常フィールドと不正フィールドが混在していても、
      // 更新全体を拒否する。
      const fields = {
        title: 'Allowed field',
        [field]: 'Blocked value',
      };

      await expect(
        updateTodo(
          TEST_USER_ID,
          LARGE_TODO_ID,
          fields,
        ),
      ).rejects.toThrow(
        'Unsupported todo update field',
      );

      expect(queryMock).not.toHaveBeenCalled();
    },
  );

  test.each([
    ['null', null],
    ['array', []],
    ['string', 'invalid'],
  ])(
    'rejects %s update input before querying',
    async (_label, fields) => {
      await expect(
        updateTodo(
          TEST_USER_ID,
          LARGE_TODO_ID,
          fields,
        ),
      ).rejects.toThrow(
        'Todo update fields must be an object',
      );

      expect(queryMock).not.toHaveBeenCalled();
    },
  );

  test.each([
    ['empty object', {}],
    ['undefined value', { completed: undefined }],
  ])(
    'rejects %s without querying',
    async (_label, fields) => {
      await expect(
        updateTodo(
          TEST_USER_ID,
          LARGE_TODO_ID,
          fields,
        ),
      ).rejects.toThrow('No fields to update');

      expect(queryMock).not.toHaveBeenCalled();
    },
  );

  test(
    'parameterizes values and preserves the string ID',
    async () => {
      const title = "Task'; DROP TABLE todos; --";
      const updatedTodo = {
        id: LARGE_TODO_ID,
        title,
        completed: false,
      };

      queryMock.mockResolvedValue({
        rows: [updatedTodo],
        rowCount: 1,
      });

      const result = await updateTodo(
        TEST_USER_ID,
        LARGE_TODO_ID,
        {
          title,
          completed: false,
        },
      );

      expect(result).toEqual(updatedTodo);
      expect(queryMock).toHaveBeenCalledTimes(1);

      const [sql, values] = queryMock.mock.calls[0];
      const normalizedSql = sql
        .replace(/\s+/g, ' ')
        .trim();

      expect(normalizedSql).toContain(
        'SET title = $1, completed = $2',
      );
      expect(normalizedSql).toMatch(
        /\bWHERE\s+user_id\s*=\s*\$3\s+AND\s+id\s*=\s*\$4\b/,
      );

      expect(sql).not.toContain(title);
      expect(sql).not.toContain(TEST_USER_ID);
      expect(sql).not.toContain(LARGE_TODO_ID);

      expect(values).toEqual([
        title,
        false,
        TEST_USER_ID,
        LARGE_TODO_ID,
      ]);
    },
  );

  test(
    'returns undefined when no update target exists',
    async () => {
      queryMock.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await updateTodo(
        TEST_USER_ID,
        LARGE_TODO_ID,
        { completed: true },
      );

      expect(result).toBeUndefined();
    },
  );

  test(
    'scopes deletion by user and preserves the string ID',
    async () => {
      queryMock.mockResolvedValue({
        rows: [],
        rowCount: 1,
      });

      const deletedCount = await deleteTodo(
        TEST_USER_ID,
        LARGE_TODO_ID,
      );

      expect(deletedCount).toBe(1);
      expect(queryMock).toHaveBeenCalledExactlyOnceWith(
        'DELETE FROM public.todos WHERE user_id = $1 AND id = $2',
        [TEST_USER_ID, LARGE_TODO_ID],
      );
    },
  );
});