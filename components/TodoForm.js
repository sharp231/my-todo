import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import ja from 'date-fns/locale/ja';
import 'react-datepicker/dist/react-datepicker.css';

const TodoForm = ({ addTodo }) => {
  const [text, setText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [priority, setPriority] = useState('medium');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text || !selectedDate || !priority) return;

    // 日付をISO形式に変換してからTを境に分割
    // ローカルタイムゾーンで日付をフォーマット
  const formattedDate = selectedDate.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).replace(/\//g, '-'); // "
    addTodo(text, formattedDate, priority);

    // フォームをリセット
    setText('');
    setSelectedDate(new Date());
    setPriority('medium');
  };

  const today = new Date();

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="form-container"
    >
      <input
        type="text"
        placeholder="ToDoを入力"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="text-input"
      />
      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        minDate={today}
        locale={ja}
        dateFormat="yyyy年MM月dd日"
        placeholderText="日付を選択"
        className="date-picker"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="priority-select"
      >
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <motion.button
        type="submit"
        className="button"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        追加
      </motion.button>
    </motion.form>
  );
};

export default TodoForm;