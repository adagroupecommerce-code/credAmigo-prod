import { User } from '../types/auth';

// Usuários para testes de aceite conforme especificação
export const rbacTestUsers: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@financeflow.com',
    password: 'admin123',
    role: 'admin',
    permissions: [], // Será gerenciado pelo RBAC
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-12-19T10:00:00Z'
  },
  {
    id: 'gerente-001',
    username: 'gerente',
    email: 'gerente@financeflow.com',
    password: 'gerente123',
    role: 'gerente',
    permissions: [], // Será gerenciado pelo RBAC
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-12-19T09:30:00Z'
  },
  {
    id: 'operador-001',
    username: 'operador',
    email: 'operador@financeflow.com',
    password: 'operador123',
    role: 'operador',
    permissions: [], // Será gerenciado pelo RBAC
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-12-19T08:45:00Z'
  }
];

// Função para inicializar usuários RBAC
export const initializeRBACUsers = () => {
  const existingUsers = localStorage.getItem('financeflow_users');
  if (!existingUsers) {
    localStorage.setItem('financeflow_users', JSON.stringify(rbacTestUsers));
  }
};

// Função para obter usuários RBAC
export const getRBACUsers = (): User[] => {
  const stored = localStorage.getItem('financeflow_users');
  return stored ? JSON.parse(stored) : rbacTestUsers;
};