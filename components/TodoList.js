import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Check, Edit3, Trash2, Calendar, Flag, AlertTriangle, CheckCircle 
} from 'lucide-react';

const TodoList = ({ todos, onToggle, onDelete, onEdit, isOverdue }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'high': return '高';
      case 'medium': return '中';
      case 'low': return '低';
      default: return '中';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-800 mb-4">
        タスク一覧 ({todos.length})
      </h2>
      
      {todos.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 text-lg">タスクがありません</p>
          <p className="text-gray-400 text-sm">上のフォームから新しいタスクを追加してください</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div
                key={todo.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  todo.completed
                    ? 'bg-gray-50 border-gray-200'
                    : isOverdue(todo.dueDate)
                    ? 'bg-red-50 border-red-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  {/* 左側：チェックボックスと内容 */}
                  <div className="flex items-center space-x-4 flex-1">
                    <motion.button
                      onClick={() => onToggle(todo.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        todo.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-gray-300 hover:border-emerald-500'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {todo.completed && <Check className="w-4 h-4" />}
                    </motion.button>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`text-lg ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {todo.text}
                        </span>
                        {isOverdue(todo.dueDate) && !todo.completed && (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className={isOverdue(todo.dueDate) && !todo.completed ? 'text-red-600 font-medium' : ''}>
                            {todo.dueDate}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Flag className="w-4 h-4 mr-1 text-gray-400" />
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(todo.priority)}`}>
                            {getPriorityText(todo.priority)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 右側：編集・削除ボタン */}
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={() => onEdit(todo)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Edit3 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      onClick={() => onDelete(todo.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default TodoList;