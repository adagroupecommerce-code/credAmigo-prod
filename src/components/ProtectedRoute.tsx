import React from 'react';
import { useRBAC } from '../hooks/useRBAC';
import { AlertTriangle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string;
  action?: string;
  fallback?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  module, 
  action, 
  fallback 
}) => {
  const { hasPermission, hasModuleAccess } = useRBAC();

  // Se apenas o módulo for especificado, verificar acesso ao módulo
  if (module && !action) {
    if (!hasModuleAccess(module)) {
      return fallback || (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta funcionalidade.</p>
        </div>
      );
    }
  }

  // Se módulo e ação forem especificados, verificar permissão específica
  if (module && action) {
    if (!hasPermission(module, action)) {
      return fallback || (
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para realizar esta ação.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;