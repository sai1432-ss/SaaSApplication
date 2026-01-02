export type UserRole = 'super_admin' | 'tenant_admin' | 'user';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}