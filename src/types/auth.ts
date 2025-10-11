export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'gerente' | 'operador';
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}