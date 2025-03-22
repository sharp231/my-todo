import React from 'react';

const TodoList = ({ todos, deleteTodo }) => {
  return (
    <ul>
      {todos.map((todo, index) => (
        <li key={index}>
          <span>{todo.text}</span>
          {todo.date && <span> (期日: {todo.date})</span>}
          {todo.priority && <span> (優先度: {todo.priority})</span>}
          <button className='button' onClick={() => deleteTodo(index)}>削除</button>
        </li>
      ))}
    </ul>
  );
};

export default TodoList;
