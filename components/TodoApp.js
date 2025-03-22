import React, { useState } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';


const TodoApp = () => {
  const [todos, setTodos] = useState([]);

  const addTodo = (text, date, priority) => {
    const newTodo = { text, date, priority };
    setTodos([...todos, newTodo]);
  };

  const deleteTodo = (index) => {
    setTodos(todos.filter((_, i) => i !== index));
  };

  return (
    <div>
      <h1>ToDoアプリ</h1>
      <TodoForm addTodo={addTodo} />
      <TodoList todos={todos} deleteTodo={deleteTodo} />
    </div>
  );
};

export default TodoApp;