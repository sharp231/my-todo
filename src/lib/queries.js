import pool from './db';

// Todoリストを取得
export const getTodos = async () => {
  const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
  return result.rows;
};

// Todoを追加
export const addTodo = async (title, date, priority) => {
  const result = await pool.query(
    'INSERT INTO todos (title, date, priority) VALUES ($1, $2, $3) RETURNING *',
    [title, date, priority]
  );
  return result.rows[0];
};

// Todoを削除
export const deleteTodo = async (id) => {
  await pool.query('DELETE FROM todos WHERE id = $1', [id]);
};