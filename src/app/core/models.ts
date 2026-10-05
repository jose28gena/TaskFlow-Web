export type TaskStatus = 'Todo' | 'InProgress' | 'Done';

export const STATUSES: readonly TaskStatus[] = ['Todo', 'InProgress', 'Done'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  Todo: 'Por hacer',
  InProgress: 'En progreso',
  Done: 'Hecha'
};

export interface AuthResponse {
  token: string;
  expiresAt: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface TaskDraft {
  title: string;
  description?: string | null;
  dueDate?: string | null;
}

export interface TaskUpdate {
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
}
