import { getTodos, addTodo, deleteTodo, updateTodo } from '../../lib/queries';
import { handleError } from '../../utils/errorHandler';
import { validateTodoInput, validateId, validateUpdateTodoInput } from '../../utils/validation';

export default async function handler(req, res) {
  res.setHeader('Allow', ['GET', 'POST', 'DELETE', 'PUT' , 'PATCH']);

  if (req.method === 'GET') {
    try {
      const todos = await getTodos();
      res.status(200).json(todos);
    } catch (error) {
      handleError(res, error, 'Error fetching todos');
    }
  } else if (req.method === 'POST') {
    const { title, date, priority } = req.body;

    // バリデーション
    const validationError = validateTodoInput(title, date, priority);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      const newTodo = await addTodo(title, date, priority);
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
  } else if (req.method === 'PUT' || req.method === 'PATCH') {
    const { id, title, date, priority } = req.body;

    // バリデーション
    const validationError = validateUpdateTodoInput(id, title, date, priority);
    if (validationError) {
      return res.status(400).json(validationError);
    }

    try {
      const updatedTodo = await updateTodo(id, { title, date, priority });
      res.status(200).json(updatedTodo); // 更新後のデータを返す
    } catch (error) {
      handleError(res, error, 'Error updating todo');
    }
  } else {
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}