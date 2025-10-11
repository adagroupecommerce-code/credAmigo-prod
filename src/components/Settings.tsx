import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, Shield, Bell, Database, Palette, FileText } from 'lucide-react';
import UserManagement from './UserManagement';
import { useAuth } from '../hooks/useAuth';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import { useRBAC } from '../hooks/useRBAC';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('users');
  const { hasModuleAccess } = useRBAC();

  const tabs = [
    {
      id: 'users',
      label: 'Usuários',
      icon: Users,
      component: UserManagement,
      permission: RBAC_RESOURCES.SETTINGS
    },
    {
      id: 'security',
      label: 'Segurança',
      icon: Shield,
      component: () => (
        <div className="text-center py-12">
          <Shield className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Configurações de Segurança</h2>
          <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
        </div>
      )
    },
    {
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
      component: () => (
        <div className="text-center py-12">
          <Bell className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Configurações de Notificações</h2>
          <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
        </div>
      )
    },
    {
      id: 'system',
      label: 'Sistema',
      icon: Database,
      component: () => (
        <div className="text-center py-12">
          <Database className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Configurações do Sistema</h2>
          <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
        </div>
      )
    },
    {
      id: 'appearance',
      label: 'Aparência',
      icon: Palette,
      component: () => (
        <div className="text-center py-12">
          <Palette className="mx-auto text-gray-400 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Configurações de Aparência</h2>
          <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
        </div>
      )
    }
  ];

  const availableTabs = tabs.filter(tab => 
    !tab.permission || hasModuleAccess(tab.permission)
  );

  const activeTabData = availableTabs.find(tab => tab.id === activeTab) || availableTabs[0];
  const ActiveComponent = activeTabData?.component;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <SettingsIcon className="text-blue-600" size={28} />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Configurações</h1>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            {availableTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-manipulation
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={14} className="mr-1 sm:mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {ActiveComponent && <ActiveComponent />}
        </div>
      </div>
    </div>
  );
};

export default Settings;