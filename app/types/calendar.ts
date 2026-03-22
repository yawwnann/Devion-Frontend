export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  eventType: string;
  projectId?: string | null;
  todoId?: string | null;
  githubIssueId?: string | null;
}

export interface PageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}

export interface EventFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  eventType: string;
}

export interface EventTypeOption {
  label: string;
  value: string;
  icon: string;
}

export interface ColorOption {
  label: string;
  value: string;
}

export interface CalendarStats {
  total: number;
  today: number;
  upcoming: number;
  past: number;
}
