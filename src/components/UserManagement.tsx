import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Eye, EyeOff, Save, X, Shield, Users as UsersIcon } from 'lucide-react';
import { User } from '../types/auth';
import { authStorage } from '../data/users';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>(authStorage.getUsers());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const { hasPermission } = useRBAC();

  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    email: '',
    password: '',
    role: 'operador',
    isActive: true
  });

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const user: User = {
      id: Date.now().toString(),
      username: newUser.username!,
      email: newUser.email!,
      password: newUser.password!,
      role: newUser.role as any,
      isActive: newUser.isActive!,
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, user];
    setUsers(updatedUsers);
    authStorage.saveUsers(updatedUsers);
    setShowNewUserForm(false);
    setNewUser({
      username: '',
      email: '',
      password: '',
      role: 'operador',
      isActive: true
    });
  };

  const handleUpdateUser = (updatedUser: User) => {
    const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    authStorage.saveUsers(updatedUsers);
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
      const updatedUsers = users.filter(u => u.id !== userId);
      setUsers(updatedUsers);
      authStorage.saveUsers(updatedUsers);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'gerente': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'operador': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'operador': return 'Operador';
      default: return role;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <UsersIcon className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        </div>
        <RBACButton
          resource={RBAC_RESOURCES.SETTINGS}
          action={RBAC_ACTIONS.CREATE}
          onClick={() => setShowNewUserForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} className="mr-2" />
          Novo Usuário
        </RBACButton>
      </div>

      {/* Formulário de Novo Usuário */}
      {showNewUserForm && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Novo Usuário</h2>
            <button
              onClick={() => setShowNewUserForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
              <input
                type="text"
                value={newUser.username}
                onChange={(e) => setNewUser(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
              <input
                type="password"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ 
                  ...prev, 
                  role: e.target.value as User['role'],
                  permissions: DEFAULT_PERMISSIONS[e.target.value as User['role']]
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="operador">Operador</option>
                <option value="gerente">Gerente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowNewUserForm(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateUser}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Criar Usuário
            </button>
          </div>
        </div>
      )}

      {/* Lista de Usuários */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Usuário</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Perfil</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Último Login</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{user.username}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        Senha: 
                        {showPasswords[user.id] ? (
                          <span className="font-mono">{user.password}</span>
                        ) : (
                          <span>••••••••</span>
                        )}
                        <button
                          onClick={() => setShowPasswords(prev => ({ ...prev, [user.id]: !prev[user.id] }))}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {showPasswords[user.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getRoleColor(user.role)}`}>
                      {getRoleText(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <RBACButton
                        resource={RBAC_RESOURCES.SETTINGS}
                        action={RBAC_ACTIONS.UPDATE}
                        onClick={() => setEditingUser(user)}
                        className="flex items-center px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={16} className="mr-1" />
                        Editar
                      </RBACButton>
                      {user.id !== 'admin-001' && (
                        <RBACButton
                          resource={RBAC_RESOURCES.SETTINGS}
                          action={RBAC_ACTIONS.DELETE}
                          onClick={() => handleDeleteUser(user.id)}
                          className="flex items-center px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Excluir
                        </RBACButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edição */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Editar Usuário: {editingUser.username}</h2>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, role: e.target.value as User['role'] } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="operador">Operador</option>
                    <option value="gerente">Gerente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editingUser.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingUser(prev => prev ? { ...prev, isActive: e.target.value === 'active' } : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Shield size={16} />
                  <span className="font-medium">Sistema RBAC Automático</span>
                </div>
                <p className="text-sm text-blue-700">
                  As permissões são gerenciadas automaticamente pelo sistema RBAC baseado no perfil selecionado:
                </p>
                <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
                  <li><strong>Admin:</strong> Acesso total a todos os módulos</li>
                  <li><strong>Gerente:</strong> Tudo exceto excluir (delete)</li>
                  <li><strong>Operador:</strong> Visualizar e criar apenas</li>
                </ul>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleUpdateUser(editingUser)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Save size={16} className="mr-2" />
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;