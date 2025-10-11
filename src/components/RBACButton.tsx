import React from 'react';
import { useRBAC } from '../hooks/useRBAC';

interface RBACButtonProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
  type?: 'button' | 'submit' | 'reset';
  fallback?: React.ReactNode;
}

const RBACButton: React.FC<RBACButtonProps> = ({
  resource,
  action,
  children,
  className = '',
  onClick,
  disabled = false,
  title,
  type = 'button',
  fallback
}) => {
  const { hasPermission } = useRBAC();

  const hasAccess = hasPermission(resource, action);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={className}
      title={title}
    >
      {children}
    </button>
  );
};

export default RBACButton;