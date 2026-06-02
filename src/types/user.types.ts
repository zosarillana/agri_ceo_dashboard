export interface UserDepartment {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'superadmin' | 'user';
  departments: UserDepartment[];
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}