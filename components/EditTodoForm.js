import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
// import { motion } from 'framer-motion';
import 'react-datepicker/dist/react-datepicker.css';

const EditTodoForm = ({ todo, onUpdate, onReplace, onCancel }) => {
  const [title, setTitle] = useState(todo.title || '');
  const [date, setDate] = useState(todo.date ? new Date(todo.date) : null); // Date型に変換
  const [priority, setPriority] = useState(todo.priority || 'medium');

  const handleSubmit = (e) => {
    e.preventDefault();

    // 現在の値と元の値を比較して変更されたフィールドを特定
    const originalDate = todo.date ? new Date(todo.date).toISOString() : null;
    const newDate = date ? date.toISOString() : null;

    const hasChangedTitle = title !== todo.title;
    const hasChangedDate = newDate !== originalDate;
    const hasChangedPriority = priority !== todo.priority;

    // 変更されたフィールドの数をカウント
    const changedFieldsCount = [hasChangedTitle, hasChangedDate, hasChangedPriority].filter(Boolean).length;

    // 送信するデータを準備
    const updatedData = {
      title: title || todo.title, // 空の場合は元の値を使用
      date: date ? date.toISOString() : todo.date, // 空の場合は元の値を使用
      priority: priority || todo.priority, // 空の場合は元の値を使用
    };

    // 3つすべてのフィールドが変更された場合はPUT（完全更新）、それ以外はPATCH（部分更新）
    if (changedFieldsCount === 3) {
      console.log('完全更新（PUT）を実行:', updatedData);
      onReplace(todo.id, updatedData);
    } else {
      // 部分更新の場合は変更されたフィールドのみ送信
      const partialData = {};
      if (hasChangedTitle) partialData.title = title || todo.title;
      if (hasChangedDate) partialData.date = date ? date.toISOString() : todo.date;
      if (hasChangedPriority) partialData.priority = priority || todo.priority;

      console.log('部分更新（PATCH）を実行:', partialData);
      onUpdate(todo.id, partialData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="edit-todo-form">
      <div>
        <input
          type="text"
          // className='form-container'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div>
        {/* <label>期限:</label> */}
        <DatePicker
          selected={date}
          // className="date-picker"
          onChange={(date) => setDate(date)} // 日付を選択
          dateFormat="yyyy-MM-dd" // 表示形式
          placeholderText="日付を選択"
          isClearable // 日付をクリア可能
        />
      </div>
      <div>
        {/* <label>優先度:</label> */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="low">低</option>
          <option value="medium">中</option>
          <option value="high">高</option>
        </select>
      </div>
      <button type="submit" className='button'>更新</button>
      <button type="button" className='button' onClick={onCancel}>
        キャンセル
      </button>
    </form>
  );
};

export default EditTodoForm;