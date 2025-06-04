import React, { useState, useEffect } from 'react';
import TodoForm from './TodoForm';
import TodoList from './TodoList';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);

  // APIからTodoリストを取得
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await fetch('/api/todos');
        const data = await response.json();
        setTodos(data);
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
        body: JSON.stringify({ title, date, priority }),
      });

      if (!response.ok) {
        throw new Error('Failed to add todo');
      }

      const newTodo = await response.json();
      console.log('New Todo Response:', newTodo);

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
        setTodos((prevTodos) => prevTodos.filter((todo) => todo.id !== id));
      } else {
        console.error('Failed to delete todo');
      }
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  // ■ 完全更新（PUT） - すべてのフィールドを置き換え
  const replaceTodo = async (id, todoData) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id, ...todoData }), // 全フィールドを送信
      });

      if (!response.ok) {
        throw new Error('Failed to replace todo');
      }

      const result = await response.json();
      console.log('Replace Todo Response:', result);

      // 完全に置き換えられたTodoをリストに反映
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id ? result.todo : todo // サーバーから返された完全なデータを使用
        )
      );
    } catch (error) {
      console.error('Error replacing todo:', error);
    }
  };

  // ■ 部分更新（PATCH） - 指定されたフィールドのみ更新
  const updateTodo = async (id, updatedFields) => {
    try {
      const response = await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({ id, ...updatedFields }), // 更新するフィールドのみ送信
      });

      if (!response.ok) {
        throw new Error('Failed to update todo');
      }

      const updatedTodo = await response.json();
      console.log('Update Todo Response:', updatedTodo);

      // 部分的に更新されたTodoをリストに反映
      setTodos((prevTodos) =>
        prevTodos.map((todo) =>
          todo.id === id ? { ...todo, ...updatedTodo } : todo
        )
      );
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 flex flex-col sm:flex-row gap-4">
      <div className="left-container flex-1">
        <TodoForm addTodo={addTodo} />
      </div>
      <div className="right-container flex-1">
        <TodoList
          todos={todos}
          deleteTodo={deleteTodo}
          updateTodo={updateTodo}     // 部分更新用
          replaceTodo={replaceTodo}   // 完全更新用
        />
      </div>
    </div>
  );
};

export default TodoApp;