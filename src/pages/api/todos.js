import pool from '../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Todoリストを取得
    try {
      const result = await pool.query('SELECT * FROM todos ORDER BY created_at DESC');
      res.status(200).json(result.rows.map((todo) => ({
        id: todo.id,
        title: todo.title,
        date: todo.date,
        priority: todo.priority
      }))
      );
    } catch (error) {
      console.error('Error fetching todos:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    const { title, date, priority } = req.body;
    try {
      const result = await pool.query(
        'INSERT INTO todos (title, date, priority) VALUES ($1, $2, $3) RETURNING *',
        [title, date, priority]
      );
      const newTodo = result.rows[0];
      res.status(201).json({
        id: newTodo.id,
        title: newTodo.title,
        date: newTodo.date,
        priority: newTodo.priority,
      });
    } catch (error) {
      console.error('Error adding todo:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (req.method === 'DELETE') {
    // Todoを削除
    const { id } = req.query;
    try {
      await pool.query('DELETE FROM todos WHERE id = $1', [id]);
      res.status(204).end(); // 成功時は204 No Contentを返す
    } catch (error) {
      console.error('Error deleting todo:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}