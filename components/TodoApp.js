import React, { useState, useEffect } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

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
  const addTodo = async (title) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }), // 新しいTodoを送信
      });
      const newTodo = await response.json();
      setTodos([...todos, newTodo]); // 新しいTodoをリストに追加
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  // Todoを削除
  const deleteTodo = async (index) => {
    try {
      const todoToDelete = todos[index];
      await fetch(`/api/todos/${todoToDelete.id}`, {
        method: 'DELETE',
      });
      setTodos(todos.filter((_, i) => i !== index)); // 削除後のリストを更新
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