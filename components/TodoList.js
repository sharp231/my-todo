import React, { useState } from "react";
import EditTodoForm from "./EditTodoForm";

const formatDate = (dateString) => {
  if (!dateString) {
    return "未設定";
  }
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch (error) {
    console.error("日付のフォーマットエラー:", error);
    return dateString; // エラー発生時は元の文字列を返す
  }
};

const TodoList = ({ todos, deleteTodo, updateTodo, replaceTodo }) => {
  const [editingTodoId, setEditingTodoId] = useState(null); // 編集中のTodo IDを管理

  const handleEditClick = (id) => {
    setEditingTodoId(id); // 編集対象のTodo IDを設定
  };

  const handleCancelEdit = () => {
    setEditingTodoId(null); // 編集状態を解除
  };

  return (
    <ul>
      {todos.map((todo) =>
        editingTodoId === todo.id ? (
          <li key={todo.id}>
            <EditTodoForm
              todo={{ ...todo, date: todo.date ? new Date(todo.date) : null }} // Date型に変換
              // 編集対象のTodoを渡す
              onUpdate={(id, updatedFields) => {
                updateTodo(id, updatedFields); // 部分更新（PATCH）
                setEditingTodoId(null); // 編集状態を解除
              }}
              onReplace={(id, todoData) => {
                replaceTodo(id, todoData); // 完全更新（PUT）
                setEditingTodoId(null); // 編集状態を解除
              }}
              onCancel={handleCancelEdit}
            />
          </li>
        ) : (
          <li key={todo.id}>
            <span>{todo.title}</span>
            <span> (期限: {formatDate(todo.date)})</span>
            <span> (重要度: {todo.priority || "未設定"})</span>
            <button className="button" onClick={() => handleEditClick(todo.id)}>
              編集
            </button>
            <button className="button" onClick={() => deleteTodo(todo.id)}>
              削除
            </button>
          </li>
        )
      )}
    </ul>
  );
};

export default TodoList;