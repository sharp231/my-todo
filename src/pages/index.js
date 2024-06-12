import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [command, setCommand] = useState('');

  const handleNewTodo = () => {
    const newTodoText = prompt('新しいTodoを入力');
    if (newTodoText) {
      const newTodoDate = prompt('日付を入力(YYYY-MM-DD)');
      const newTodoPriority = prompt(
        '優先度を入力(low/medium/high)'
      );
      const newTodo = {
        text: newTodoText,
        date: newTodoDate,
        priority: newTodoPriority,
      };
      setTodos([...todos, newTodo]);
      console.log(`${newTodoText} が追加`);
    }
  };
  const handleEditTodo = () => {
    const index = parseInt(prompt('編集するToDoの番号を入力'), 10);
    if (!Number.isNaN(index) && index >= 0 && index < todos.length) {
      const newTodoText = prompt('新しいTodoを入力');
      if (newTodoText) {
        const newTodoDate = prompt('日付を入力(YYYY-MM-DD)');
        const newTodoPriority = prompt(
          '優先度を入力(low/medium/high)'
        );
        const newdatedTodo = {
          text: newTodoText,
          date: newTodoDate,
          priority: newTodoPriority,
        };
        const newTodos = [...todos];
        newTodos[index] = newdatedTodo;
        setTodos(newTodos);
        console.log(`${newTodoText} が更新`);
      }
    } else {
      console.log('有効なインデックスを入力');
    }
  };

  const handleListTodos = () => {
    todos.forEach((todo, index) => {
      console.log(`${index}: ${todo}`);
    });
  };

  const handleDeleteTodo = () => {
    const index = parseInt(prompt('削除するToDoの番号を入力'), 10);
    if (!Number.isNaN(index) && index >= 0 && index < todos.length) {
      const deletedTodo = todos.splice(index, 1);
      setTodos([...todos]);
      console.log(`${deletedTodo[0]}が削除`);
    } else {
      console.log('有効なインデックスを入力');
    }
  };

  const handleCommandInput = () => {
    let input = prompt('コマンドを入力(new, list, edit,delete, quit)');
    while (
      input !== 'new' &&
      input !== 'edit' &&
      input !== 'list' &&
      input !== 'delete' &&
      input !== 'quit' &&
      input !== 'q'
    ) {
      console.log('コマンドが間違っています(new, list, edit ,delete, quit)');
      input = prompt('コマンドを入力(new, list, edit , delete, quit)');
    }
    return input;
  };

  const handleCommand = () => {
    const input = handleCommandInput();
    if (input === 'new') {
      handleNewTodo();
    } else if (input === 'edit') {
      handleEditTodo();
    } else if (input === 'list') {
      handleListTodos();
    } else if (input === 'delete') {
      handleDeleteTodo();
    } else if (input === 'quit' || input === 'q') {
      console.log('アプリを終了します');
    }
    setCommand(input);
  };

  return (
    <div className='container'>
      <div className='left-container'>
        <ul className='todoList'>
          {todos.map((todo, index) => (
            <motion.li
              key={index}
              className='todoItem'
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span>{todo.text}</span>
              {todo.date && <span> (期日: {todo.date})</span>}
              {todo.priority && <span> (優先度: {todo.priority})</span>}
            </motion.li>
          ))}
        </ul>
      </div>
      <motion.div
        className='right-container'
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <button className='commandButton' onClick={handleCommand}>
          コマンドを入力してください。
        </button>
      </motion.div>
    </div>
  );
};

export default function Home() {
  return (
    <div className='app-container'>
      <h1>Todo App</h1>
      <TodoApp />
    </div>
  );
}