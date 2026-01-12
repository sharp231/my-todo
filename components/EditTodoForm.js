import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import ja from 'date-fns/locale/ja';
import 'react-datepicker/dist/react-datepicker.css';
import { Save, X, Edit3 } from 'lucide-react';

const EditTodoForm = ({ todo, onSave, onCancel }) => {
  const [editText, setEditText] = useState(todo.text);
  const [editDate, setEditDate] = useState(todo.dueDate ? new Date(todo.dueDate) : new Date());
  const [editPriority, setEditPriority] = useState(() => {
    const priorityMap = { 'high': '高', 'medium': '中', 'low': '低' };
    return priorityMap[todo.priority] || '中';
  });

  const handleSave = () => {
    if (!editText.trim()) return;
    
    const formattedDate = editDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\//g, '-');

    const priorityMap = { '高': 'high', '中': 'medium', '低': 'low' };

    onSave(todo.id, editText.trim(), formattedDate, priorityMap[editPriority]);
  };

  const today = new Date();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onCancel} // 背景クリックで閉じる
    >
      <motion.div
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        exit={{ y: 50 }}
        className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()} // 中身クリックはバブリング防止
      >
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
          <Edit3 className="w-5 h-5 mr-2 text-blue-500" />
          タスクを編集
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">タスク内容</label>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">期限日</label>
            <div className='w-full'>
                <DatePicker
                selected={editDate}
                onChange={(date) => setEditDate(date)}
                minDate={today}
                locale={ja}
                dateFormat="yyyy年MM月dd日"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 block"
                />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">優先度</label>
            <select
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 bg-white"
            >
              <option value="高">高</option>
              <option value="中">中</option>
              <option value="低">低</option>
            </select>
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <motion.button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Save className="w-4 h-4 mr-2" />
            保存
          </motion.button>
          <motion.button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center px-4 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X className="w-4 h-4 mr-2" />
            キャンセル
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default EditTodoForm;