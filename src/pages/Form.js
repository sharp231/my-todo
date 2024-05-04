import React, { useState } from 'react';
import TodoForm from './TodoForm';

const TodoApp = () => {
  const [todos, setTodos] = useState(['水やりをする', '掃除をする']);

  const addTodo = (todo) => {
    setTodos([...todos, todo]);
  };

  return (
    <div className='container'>
      <div className='left-container'>
        <TodoForm onAddTodo={addTodo} />
      </div>
    </div>
  );
};
export default TodoApp;
