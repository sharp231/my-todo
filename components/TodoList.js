import React from "react";

const formatDate = (dateString) => {
  if (!dateString) {
    // return "未設定";
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

const TodoList = ({ todos, deleteTodo }) => {
  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>
          <span>{todo.title}</span>
          <span> (期限: {formatDate(todo.date)})</span>
          <span> (重要度: {todo.priority || "未設定"})</span>
          <button className="button" onClick={() => deleteTodo(todo.id)}>削除</button>
        </li>
      ))}
    </ul>
  );
};

export default TodoList;