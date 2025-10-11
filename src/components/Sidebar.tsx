import React from 'react';
import { Home, Users, DollarSign, Calculator, FileText, Settings, X, UserPlus, CreditCard, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES } from '../types/rbac';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onToggle: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, isOpen, onToggle, isCollapsed, onToggleCollapse }) => {
  const { hasModuleAccess } = useRBAC();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, module: RBAC_RESOURCES.DASHBOARD },
    { id: 'crm', label: 'Prospecção CRM', icon: UserPlus, module: RBAC_RESOURCES.CRM },
    { id: 'clients', label: 'Clientes', icon: Users, module: RBAC_RESOURCES.CUSTOMERS },
    { id: 'loans', label: 'Empréstimos', icon: DollarSign, module: RBAC_RESOURCES.LOANS },
    { id: 'billing', label: 'Cobrança', icon: CreditCard, module: RBAC_RESOURCES.COLLECTIONS },
    { id: 'financial', label: 'Financeiro', icon: BarChart3, module: RBAC_RESOURCES.FINANCE },
    { id: 'calculator', label: 'Simulador', icon: Calculator, module: RBAC_RESOURCES.SIMULATOR },
    { id: 'reports', label: 'Relatórios', icon: FileText, module: RBAC_RESOURCES.REPORTS },
    { id: 'settings', label: 'Configurações', icon: Settings, module: RBAC_RESOURCES.SETTINGS }
  ];

  const availableMenuItems = menuItems.filter(item => {
    const hasAccess = hasModuleAccess(item.module);
    return hasAccess;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 shadow-sm z-50 transition-all duration-300
        transform transition-transform duration-300 ease-in-out touch-manipulation
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:transform-none
        ${isCollapsed ? 'lg:w-16' : 'lg:w-64'} w-72 sm:w-64
      `}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 sm:p-6 border-b border-gray-200`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
              <DollarSign className="text-white" size={20} />
            </div>
            {!isCollapsed && <h1 className="text-lg sm:text-xl font-bold text-gray-900">FinanceFlow</h1>}
          </div>
          <div className="flex items-center gap-2">
            {/* Botão de colapsar (apenas desktop) */}
            <button
              onClick={onToggleCollapse}
              className="hidden lg:block p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
              title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
            >
              {isCollapsed ? <ChevronRight size={20} className="text-gray-600" /> : <ChevronLeft size={20} className="text-gray-600" />}
            </button>
            {/* Botão de fechar (apenas mobile) */}
            <button
              onClick={onToggle}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100 touch-manipulation"
            >
              <X size={20} className="text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="p-3 sm:p-4">
          <ul className="space-y-2">
            {availableMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onViewChange(item.id);
                      if (window.innerWidth < 1024) {
                        onToggle();
                      }
                    }}
                    className={`
                      w-full flex items-center ${isCollapsed ? 'justify-center px-2' : 'px-3 sm:px-4'} py-2 sm:py-3 rounded-lg text-left transition-colors touch-manipulation
                      ${isActive 
                        ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={18} className={isCollapsed ? '' : 'mr-2 sm:mr-3'} />
                    {!isCollapsed && <span className="text-sm sm:text-base">{item.label}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

      </div>
    </>
  );
};

export default Sidebar;