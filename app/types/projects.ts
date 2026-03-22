export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  order: string | null;
  status: string;
  information: string | null;
  orderNum: number;
  category?: Category | null;
  payment?: PaymentMethod | null;
  categoryId?: string | null;
  paymentId?: string | null;
  githubRepo?: string | null;
  githubUrl?: string | null;
  lastSyncedAt?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt?: string;
}

export interface ProjectPageSettings {
  id: string;
  cover: string | null;
  icon: string | null;
  title: string;
  description: string | null;
}
