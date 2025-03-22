import React, { useState } from 'react';
import { motion } from 'framer-motion';

const TodoForm = ({ addTodo }) => {
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [priority, setPriority] = useState('medium');


  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text || !date || !priority) return;
    addTodo(text, date, priority);
    setText('');
    setDate(new Date().toISOString().split('T')[0]);
    setPriority('medium');
  };

  const today = new Date().toISOString().split('T')[0];
  
  return (
    <motion.form
     onSubmit={handleSubmit}
     initial={{ opacity: 0, y: 50 }}
     animate={{ opacity: 1, y: 0 }}
     transition={{ duration: 0.5, ease: 'easeOut' }} 
     className='form-container'>
      <input
        type="text"
        placeholder="ToDoを入力"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        min={today}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)}>
        <option value="low">低</option>
        <option value="medium">中</option>
        <option value="high">高</option>
      </select>
      <motion.button
        type="submit"
        className='button'
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}>
        追加
      </motion.button>
    </motion.form>
  );
};

export default TodoForm;