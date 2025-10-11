import React from 'react';
import { LogOut, User, Menu } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { authState, logout } = useAuth();

  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'operador': return 'Operador';
      default: return role;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 lg:hidden touch-manipulation"
        >
          <Menu size={24} className="text-gray-600" />
        </button>

        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={16} />
            </div>
            <div className="hidden sm:block">
              <div className="text-xs sm:text-sm font-medium text-gray-900">
                {authState.user?.username}
              </div>
              <div className="text-xs sm:text-xs text-gray-500">
                {authState.user?.role && getRoleText(authState.user.role)}
              </div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
            title="Sair"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline text-sm">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;