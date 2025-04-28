import React, { useState, useEffect } from 'react';
import TodoForm from './todoForm';
import TodoList from './todoList';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);

  // APIからTodoリストを取得
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch('/api/todos'); // APIエンドポイントを呼び出す
        const data = await response.json();
        setTodos(data); // 取得したデータを状態にセット
      } catch (error) {
        console.error('Error fetching todos:', error);
      }
    };

    fetchTodos();
  }, []);

  // 新しいTodoを追加
  const addTodo = async (title, date, priority) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, priority }), // 送信するデータをJSON形式に変換
      });
  
      if (!response.ok) {
        throw new Error('Failed to add todo');
      }
  
      const newTodo = await response.json();
  
      // レスポンスデータを確認
      console.log('New Todo Response:', newTodo);
  
      // 新しいTodoをリストに追加
      setTodos((prevTodos) => [...prevTodos, newTodo]);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  // Todoを削除
  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // 削除成功後、状態を更新
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      } else {
        console.error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
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