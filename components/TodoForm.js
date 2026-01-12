import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import ja from 'date-fns/locale/ja';
import 'react-datepicker/dist/react-datepicker.css';
import { Plus, Calendar, Flag } from 'lucide-react';

const TodoForm = ({ addTodo }) => {
  const [text, setText] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [priority, setPriority] = useState('中');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || !selectedDate || !priority) return;

    const formattedDate = selectedDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');

    // 画面表示用(日本語)から内部データ用(英語)へ変換
    const priorityMap = { '高': 'high', '中': 'medium', '低': 'low' };

    addTodo(text.trim(), formattedDate, priorityMap[priority]);

    // リセット
    setText('');
    setSelectedDate(new Date());
    setPriority('中');
  };

  const today = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-blue-500" />
        新しいタスクを追加
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* テキスト入力 */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タスク内容
            </label>
            <input
              type="text"
              placeholder="ToDoを入力"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 placeholder-gray-400"
              required
            />
          </div>

          {/* 日付選択 */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              期限日
            </label>
            <div className="w-full">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                minDate={today}
                locale={ja}
                dateFormat="yyyy年MM月dd日"
                placeholderText="日付を選択"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 block"
                wrapperClassName="w-full"
                required
              />
            </div>
          </div>

          {/* 優先度選択 */}
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Flag className="w-4 h-4 inline mr-1" />
              優先度
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-800 bg-white"
              required
            >
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </div>
        </div>

        <motion.button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5 mr-2" />
          タスクを追加
        </motion.button>
      </form>
    </motion.div>
  );
};

export default TodoForm;