import pool from './db';

// Todoリストを取得
export const getTodos = async () => {
  const result = await pool.query('SELECT * from todos ORDER BY created_at DESC');
  return result.rows;
};

// Todoを追加
export const addTodo = async (title, date, priority, completed) => {
  const result = await pool.query(
    'INSERT INTO todos (title, date, priority,completed) VALUES ($1, $2, $3,$4) RETURNING *',
    [title, date, priority, completed]
  );
  return result.rows[0];
};

// Todoを削除
export const deleteTodo = async (id) => {
  const query = 'DELETE FROM todos WHERE id = $1';
  const values = [id];

  const result = await pool.query(query, values);
  return result.rowCount; // 削除された行数を返す
};

// Todoを更新
export const updateTodo = async (id, fields) => {
  const updates = [];
  const values = [];
  let index = 1;

  // 更新するフィールドを動的に構築
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      updates.push(`${key} = $${index}`);
      values.push(value);
      index++;
    }
  }
  // 更新するフィールドがない場合はエラーをスロー
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  // IDを最後に追加
  values.push(id);
  const query = `UPDATE todos SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;

  const result = await pool.query(query, values);
  return result.rows[0]; // 更新後のTodoを返す
};