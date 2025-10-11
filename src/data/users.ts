import { User } from '../types/auth';
import { rbacTestUsers } from './rbacUsers';

// Usar usuários RBAC como padrão
export const mockUsers: User[] = rbacTestUsers;

// Simulação de localStorage para persistência
export const authStorage = {
  getUsers: (): User[] => {
    const stored = localStorage.getItem('financeflow_users');
    return stored ? JSON.parse(stored) : rbacTestUsers;
  },
  
  saveUsers: (users: User[]) => {
    localStorage.setItem('financeflow_users', JSON.stringify(users));
  },
  
  getCurrentUser: (): User | null => {
    const stored = localStorage.getItem('financeflow_current_user');
    return stored ? JSON.parse(stored) : null;
  },
  
  setCurrentUser: (user: User | null) => {
    if (user) {
      localStorage.setItem('financeflow_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('financeflow_current_user');
    }
  }
};