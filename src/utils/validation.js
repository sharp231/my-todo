// Todoの入力データをバリデーション
export const validateTodoInput = (title, date, priority) => {
  if (!title || typeof title !== 'string') {
    return { error: 'Invalid or missing "title"' };
  }
  if (date && isNaN(Date.parse(date))) {
    return { error: 'Invalid "date" format' };
  }
  if (priority && !['low', 'medium', 'high'].includes(priority)) {
    return { error: 'Invalid "priority" value' };
  }
  return null; // バリデーション成功
};

// IDのバリデーション
export const validateId = (id) => {
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid or missing "id"' };
  }
  return null; // バリデーション成功
};

export const validateUpdateTodoInput = (id, title, date, priority) => {
  if (!id || isNaN(Number(id))) {
    return { error: 'Invalid or missing "id"' };
  }
  if (title !== undefined && typeof title !== 'string') {
    return { error: 'Invalid "title"' };
  }
  if (date !== undefined && isNaN(Date.parse(date))) {
    return { error: 'Invalid "date" format' };
  }
  if (priority !== undefined && !['low', 'medium', 'high'].includes(priority)) {
    return { error: 'Invalid "priority" value' };
  }
  return null; // バリデーション成功
};