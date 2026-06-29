import { getTodos, addTodo, deleteTodo, updateTodo } from '../../lib/queries';
import { ApiError, ERROR_CODES, handleError } from '../../utils/errorHandler';
import { validateCreateTodoInput, validateReplaceTodoInput, validatePatchTodoInput, validateTodoId } from '../../utils/validation';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ALLOWED_METHODS = ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'];

const todoNotFound = (id) =>
  new ApiError(ERROR_CODES.NOT_FOUND, 'Todo not found', {
    details: { resource: 'todo', id },
  });
// JSONパース不可やContent-Type不備は、リクエスト形式不正として400を返す。
const readJsonBody = async (req) => {
  const contentType = req.headers['content-type'] ?? '';

  if (!contentType.includes('application/json')) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, 'Content-Type must be application/json', {
      details: { header: 'Content-Type' },
    });
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const rawBody = Buffer.concat(chunks).toString('utf8');
  if (!rawBody.trim()) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, 'request body is required');
  }
  try {
    return JSON.parse(rawBody);
  } catch (error) {
    throw new ApiError(ERROR_CODES.BAD_REQUEST, 'request body must be valid JSON', {
      cause: error,
    });
  }

};

export default async function handler(req, res) {
  res.setHeader('Allow', ALLOWED_METHODS);

  try {
    if (req.method === 'GET') {
      const todos = await getTodos();
      return res.status(200).json(todos);
    }
    if (req.method === 'POST') {
      const body = await readJsonBody(req);
      const input = validateCreateTodoInput(body);
      const newTodo = await addTodo(input.title, input.date, input.priority, input.completed);
      return res.status(201).json(newTodo);
    }
    if (req.method === 'DELETE') {
      const id = validateTodoId(req.query.id);
      const deletedCount = await deleteTodo(id);

      if (deletedCount === 0) throw todoNotFound(id);

      return res.status(200).json({ message: 'Todo deleted successfully' });
    }

    if (req.method === 'PUT') {
      const body = await readJsonBody(req);
      const input = validateReplaceTodoInput(body);

      const updatedTodo = await updateTodo(input.id, {
        title: input.title,
        date: input.date,
        priority: input.priority,
        completed: input.completed,
      });

      if (!updatedTodo) throw todoNotFound(input.id);

      return res.status(200).json({
        message: 'Todo completely replaced',
        method: 'PUT',
        todo: updatedTodo,
      });
    }
    if (req.method === 'PATCH') {
      const body = await readJsonBody(req);
      const input = validatePatchTodoInput(body);
      const updatedTodo = await updateTodo(input.id, input.fields)

      if (!updatedTodo) throw todoNotFound(input.id);

      return res.status(200).json(updatedTodo);
    }
    throw new ApiError(ERROR_CODES.METHOD_NOT_ALLOWED, `Method ${req.method} NotAllowed`);
  } catch (error) {
    return handleError(res, error);


  }
}
