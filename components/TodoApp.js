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
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row gap-4">
      <div className="left-container flex-1">
        <TodoForm addTodo={addTodo} />
      </div>
      <div className="right-container flex-1">
        <TodoList todos={todos} deleteTodo={deleteTodo} />
      </div>
    </div>
  );
};

export default TodoApp;