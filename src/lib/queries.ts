import pool from './db';
import type {
  TodoId,
  TodoPriority,
  TodoRecord,
  TodoUpdateFields,
} from '@/types/todo';

const TODO_UPDATE_COLUMNS = {
  title: 'title',
  date: 'date',
  priority: 'priority',
  completed: 'completed',
} as const satisfies Record<keyof TodoUpdateFields, string>;

function isUpdatableTodoField(
  field: string,
): field is keyof typeof TODO_UPDATE_COLUMNS {
  return Object.prototype.hasOwnProperty.call(TODO_UPDATE_COLUMNS, field);
}

const TODO_RESULT_COLUMNS = `
  id,
  title,
  to_char(date, 'YYYY-MM-DD') AS date,
  priority,
  completed,
  created_at,
  updated_at
`;

// Todoリストを取得
export const getTodos = async (userId: string): Promise<TodoRecord[]> => {
  const result = await pool.query<TodoRecord>(
    `SELECT ${TODO_RESULT_COLUMNS}  FROM public.todos WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId],
  );
  return result.rows;
};

// Todoを追加
export const addTodo = async (
  userId: string,
  title: string,
  date: string,
  priority: TodoPriority,
  completed: boolean,
): Promise<TodoRecord> => {
  const result = await pool.query<TodoRecord>(
    `INSERT INTO public.todos (user_id,title, date, priority,completed) VALUES ($1, $2, $3, $4, $5) RETURNING ${TODO_RESULT_COLUMNS} `,
    [userId, title, date, priority, completed],
  );
  return result.rows[0];
};

// Todoを削除
export const deleteTodo = async (
  userId: string,
  id: TodoId,
): Promise<number> => {
  const result = await pool.query(
    'DELETE FROM public.todos WHERE user_id = $1 AND id = $2',
    [userId, id],
  );

  return result.rowCount ?? 0; // 削除された行数を返す
};

// Todoを更新
export const updateTodo = async (
  userId: string,
  id: TodoId,
  fields: TodoUpdateFields,
): Promise<TodoRecord | undefined> => {
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) {
    throw new TypeError('Todo update fields must be an object');
  }
  const updates = [];
  const values = [];

  // 更新するフィールドを動的に構築
  for (const field of Object.keys(fields)) {
    //SQL識別子はプレースホルダー化できないため、
    //許可した列例だけSQLへ展開する
    if (!isUpdatableTodoField(field)) {
      throw new Error('Unsupported todo update field');
    }
    const value = fields[field];
    if (value === undefined) {
      continue;
    }
    const column = TODO_UPDATE_COLUMNS[field];

    values.push(value);
    updates.push(`${column} = $${values.length}`);
  }
  // 更新するフィールドがない場合はエラーをスロー
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  // IDを最後に追加
  values.push(userId);
  const userIdPlaceholder = `$${values.length}`;

  values.push(id);
  const idPlaceholder = `$${values.length}`;

  const result = await pool.query<TodoRecord>(
    `
    UPDATE public.todos
    SET ${updates.join(', ')}
    WHERE user_id = ${userIdPlaceholder}
       AND id =${idPlaceholder}
    RETURNING ${TODO_RESULT_COLUMNS}
    `,
    values,
  );
  return result.rows[0]; // 更新後のTodoを返す
};
