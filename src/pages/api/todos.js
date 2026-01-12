import { getTodos, addTodo, deleteTodo, updateTodo } from '../../lib/queries';
import { handleError } from '../../utils/errorHandler';
import { validateTodoInput, validateCompleteTodoInput, validateId, validateUpdateTodoInput } from '../../utils/validation';

export default async function handler(req, res) {
  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT', 'PATCH']);

  if (req.method === 'GET') {
    try {
      const todos = await getTodos();
      res.status(200).json(todos);
    } catch (error) {
      handleError(res, error, 'Error fetching todos');
    }
  } else if (req.method === 'POST') {
    const { title, date, priority, completed } = req.body;

    // バリデーション
    const validationError = validateTodoInput(title, date, priority, completed);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      // DB関数にcompletedを渡す・　completedがundefinedの場合はfalseとするなど初期値処理推奨
      const isCompleted = completed === true || completed === 'true';
      const newTodo = await addTodo(title, date, priority, isCompleted);
      res.status(201).json(newTodo);
    } catch (error) {
      handleError(res, error, 'Error adding todo');
    }
  } else if (req.method === 'DELETE') {
    const { id } = req.query;

    // バリデーション
    const validationError = validateId(id);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      await deleteTodo(id);
      res.status(200).json({ message: 'Todo deleted successfully' });
    } catch (error) {
      handleError(res, error, 'Error deleting todo');

    }
  } else if (req.method === 'PUT') {
    // ■ 完全置換(PUT) ■
    // body: { id, title, date, priority }
    const { id, title, date, priority, completed } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }
    const err = validateCompleteTodoInput({ title, date, priority, completed });
    if (err) return res.status(400).json(err);

    try {
      // updateTodoにcompletedも渡す
      const updatedTodo = await updateTodo(id, { title, date, priority, completed });
      if (!updatedTodo) {
        return res.status(404).json({ error: 'Todo not found' });
      }
      return res.status(200).json({
        message: 'Todo completely replaced',
        method: 'PUT',
        todo: updatedTodo
      });
    } catch (error) {
      handleError(res, error, 'Error replacing todo');
    }

  } else if (req.method === 'PATCH') {
    // ■ 部分更新(PATCH) ■
    // completedを追加(完了チェックボックスの切り替え)
    const { id, title, date, priority, completed } = req.body;
    const validationError = validateUpdateTodoInput(id, title, date, priority, completed);
    if (validationError) {
      return res.status(400).json(validationError);
    }
    try {
      const updateData = {};
      if (title !== undefined) updateData.title = title;
      if (date !== undefined) updateData.date = date;
      if (priority !== undefined) updateData.priority = priority;
      if (completed !== undefined) updateData.completed = completed;

      const updatedTodo = await updateTodo(id, updateData);
      if (!updatedTodo) return res.status(404).json({ error: 'Todo not found' });

      res.status(200).json(updatedTodo); // 更新後のデータを返す
    } catch (error) {
      console.error('Error updating todo:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

