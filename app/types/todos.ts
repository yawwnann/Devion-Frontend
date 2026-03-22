export interface Todo {
  id: string;
  title: string;
  isCompleted: boolean;
  day: string;
  order: number;
  githubIssueNumber?: number | null;
  githubIssueUrl?: string | null;
  githubRepoName?: string | null;
  githubLabels?: string | null;
  lastSyncedAt?: string | null;
  dueDate?: string | null;
  priority?: string;
  status?: string;
}

export interface TodoWeek {
  id: string;
  weekStart: string;
  weekEnd: string;
  todos: Todo[];
}

export interface TodoPageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}

export interface Column {
  id: string;
  label: string;
  headerClass: string;
  dotClass: string;
}
