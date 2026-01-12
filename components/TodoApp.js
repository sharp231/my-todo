import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TodoForm from './TodoForm';
import TodoList from './TodoList';
import EditTodoForm from './EditTodoForm';
import { CheckCircle, Clock, AlertTriangle, BarChart3 } from 'lucide-react';

const TodoApp = () => {
  const [todos, setTodos] = useState([]);
  const [editingTodo, setEditingTodo] = useState(null);

  // ■ 1. 初回ロード (GET)
  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const res = await fetch('/api/todos');
        if (res.ok) {
          const data = await res.json();
          // API(title, date) -> フロント(text, dueDate) に変換してセット
          const formattedTodos = data.map(t => ({
            ...t,
            text: t.title,
            dueDate: t.date,
            completed: t.completed
          }));
          setTodos(formattedTodos);
        }
      } catch (error) {
        console.error("GET Error:", error);
      }
    };
    fetchTodos();
  }, []);

  // ■ 2. 追加 (POST) - 400エラーの修正含む
  const addTodo = async (text, dueDate, priority) => {
    try {
      const payload = {
        title: text,       // フロントのtextをDBのtitleへ
        date: dueDate,     // フロントのdueDateをDBのdateへ
        priority,
        completed: false
      };

      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }, // ★必須
        body: JSON.stringify(payload)                    // ★必須
      });

      if (!res.ok) throw new Error('追加に失敗しました');

      const newTodo = await res.json();

      // 成功したらリストに追加（ここでも変換）
      setTodos(prev => [...prev, {
        ...newTodo,
        text: newTodo.title,
        dueDate: newTodo.date
      }]);
    } catch (error) {
      console.error("POST Error:", error);
    }
  };

  // ■ 3. 完了切り替え (PATCH)
  const toggleTodo = async (id) => {
    // まず画面を更新（サクサク動くように）
    const target = todos.find(t => t.id === id);
    const newStatus = !target.completed;
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: newStatus } : t));

    try {
      // APIに送信
      await fetch('/api/todos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, completed: newStatus })
      });
    } catch (error) {
      console.error("PATCH Error:", error);
      // エラーなら元に戻す処理を入れるのがベスト
    }
  };

  // ■ 4. 削除 (DELETE)
  const deleteTodo = async (id) => {
    try {
      const res = await fetch(`/api/todos?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setTodos(prev => prev.filter(t => t.id !== id));
      }
    } catch (error) {
      console.error("DELETE Error:", error);
    }
  };

  // ■ 5. 編集保存 (PUT)
  const editTodo = async (id, text, dueDate, priority) => {
    try {
      // 1. 編集対象のタスクを現在のリストから探す
      const currentTodo = todos.find(t => t.id === id);
      if (!currentTodo) return;

      // 2. 送信データを作る
      // ユーザーが編集したのは text, date, priority だが、
      // PUTバリデーションを通すため、既存の completed も含める
      const payload = {
        id,
        title: text,
        date: dueDate,
        priority,
        completed: currentTodo.completed
      };

      const res = await fetch('/api/todos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // 画面を更新
        setTodos(prev => prev.map(t =>
          t.id === id ? { ...t, text, dueDate, priority } : t
        ));
        setEditingTodo(null);
      } else {
        // エラー詳細をログに出す
        const errorData = await res.json();
        console.error("PUT Failed:", errorData);
        alert(`更新に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error("PUT Error:", error);
    }
  };

  const startEdit = (todo) => setEditingTodo(todo);
  const cancelEdit = () => setEditingTodo(null);

  // 期限切れ判定
  const isOverdue = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const dueDate = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  // 並び替え
  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });

  // 統計
  const stats = {
    total: todos.length,
    completed: todos.filter(t => t.completed).length,
    pending: todos.filter(t => !t.completed).length,
    overdue: todos.filter(t => !t.completed && isOverdue(t.dueDate)).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">タスク管理アプリ</h1>
          <p className="text-gray-600">効率的にタスクを管理しましょう</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="総タスク" value={stats.total} icon={BarChart3} color="text-gray-800" iconColor="text-blue-500" />
          <StatCard label="完了" value={stats.completed} icon={CheckCircle} color="text-emerald-600" iconColor="text-emerald-500" />
          <StatCard label="未完了" value={stats.pending} icon={Clock} color="text-amber-600" iconColor="text-amber-500" />
          <StatCard label="期限切れ" value={stats.overdue} icon={AlertTriangle} color="text-red-600" iconColor="text-red-500" />
        </motion.div>

        <TodoForm addTodo={addTodo} />

        <AnimatePresence>
          {editingTodo && (
            <EditTodoForm todo={editingTodo} onSave={editTodo} onCancel={cancelEdit} />
          )}
        </AnimatePresence>

        <TodoList todos={sortedTodos} onToggle={toggleTodo} onDelete={deleteTodo} onEdit={startEdit} isOverdue={isOverdue} />
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color, iconColor }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-600">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <Icon className={`w-8 h-8 ${iconColor}`} />
    </div>
  </div>
);

export default TodoApp;