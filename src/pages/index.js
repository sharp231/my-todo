import React, { useState } from 'react';

const TodoApp = () => {
  const [todos, setTodos] = useState(['水やりをする', '掃除をする']);
  const [command, setCommand] = useState('');

  const handleNewTodo = () => {
    const newTodo = prompt('新しいToDoを入力してください');
    if (newTodo) {
      setTodos([...todos, newTodo]);
      console.log(`${newTodo}が追加されました`);
    }
  };

  const handleListTodos = () => {
    // console.log('*********');
    todos.forEach((todo, index) => {
      console.log(`${index}: ${todo}`);
    });
    // console.log('*********');
  };

  const handleDeleteTodo = () => {
    const index = parseInt(prompt('削除するToDoの番号を入力してください'), 10);
    if (!Number.isNaN(index) && index >= 0 && index < todos.length) {
      const deletedTodo = todos.splice(index, 1);
      setTodos([...todos]);
      console.lxog(`${deletedTodo[0]}が削除されました`);
    } else {
      console.log('有効なインデックスを入力してください');
    }
  };

  const handleCommandInput = () => {
    let input = prompt('コマンドを入力してください(new, list, delete, quit)');
    while (
      input !== 'new' &&
      input !== 'list' &&
      input !== 'delete' &&
      input !== 'quit' &&
      input !== 'q'
    ) {
      console.log('コマンドが間違っています(new, list, delete, quit)');
      input = prompt('コマンドを入力してください(new, list, delete, quit)');
    }
    return input;
  };

  const handleCommand = () => {
    const input = handleCommandInput();
    if (input === 'new') {
      handleNewTodo();
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
            <li key={index} className='todoItem'>
              <span>{todo}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className='right-container'>
        <button className='commandButton' onClick={handleCommand}>
          コマンドを入力をしてください。
        </button>
      </div>
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
