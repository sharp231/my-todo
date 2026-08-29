export type TodoPriority = 'low' | 'medium' | 'high';

export type TodoId = string;

// 現在のvalidateTodoId()がnumberを返すための移行用。
// 将来はstringへ統一するのが望ましい。
export type TodoIdInput = TodoId | number;

export interface TodoRecord {
  id: TodoId;
  title: string;
  date: string;
  priority: TodoPriority;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export type TodoUpdateFields = Partial<
  Pick<
    TodoRecord,
    'title' | 'date' | 'priority' | 'completed'
  >
>;