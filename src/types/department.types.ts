export interface Department {
  id: number;
  name: string;
  users_count?: number;
  created_at: string | null;
  updated_at: string | null;
}

export interface DepartmentUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'superadmin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentPayload {
  name: string;
}

export interface UpdateDepartmentPayload {
  name: string;
}