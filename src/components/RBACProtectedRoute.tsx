import React from 'react';
import { useRBAC } from '../hooks/useRBAC';
import { AlertTriangle, Shield, Lock } from 'lucide-react';

interface RBACProtectedRouteProps {
  children: React.ReactNode;
  resource: string;
  action: string;
  fallback?: React.ReactNode;
  showFallback?: boolean;
}

const RBACProtectedRoute: React.FC<RBACProtectedRouteProps> = ({ 
  children, 
  resource, 
  action, 
  fallback,
  showFallback = true
}) => {
  const { hasPermission, authState } = useRBAC();

  const hasAccess = hasPermission(resource, action);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (!showFallback) {
      return null;
    }

    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield className="text-red-600" size={32} />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
        <p className="text-gray-600 mb-4">
          Você não tem permissão para realizar a ação <strong>{action}</strong> no módulo <strong>{resource}</strong>.
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-yellow-800 mb-2">
            <Lock size={16} />
            <span className="font-medium">Informações de Acesso</span>
          </div>
          <div className="text-sm text-yellow-700 space-y-1">
            <div><strong>Usuário:</strong> {authState.user?.username}</div>
            <div><strong>Perfil:</strong> {authState.user?.role}</div>
            <div><strong>Recurso:</strong> {resource}</div>
            <div><strong>Ação:</strong> {action}</div>
          </div>
        </div>
        <p className="text-gray-500 text-sm mt-4">
          Entre em contato com o administrador para solicitar acesso.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default RBACProtectedRoute;