import { useState, useEffect } from 'react';
import { RBAC_POLICIES, RBACPolicies, AuditLog } from '../types/rbac';
import { useAuth } from './useAuth';

export const useRBAC = () => {
  const auth = useAuth();
  const { authState } = auth;

  // Função para verificar se uma política casa com resource/action
  const matchesPolicy = (policy: { resource: string; actions: string[] }, resource: string, action: string): boolean => {
    const resourceMatch = policy.resource === '*' || policy.resource === resource;
    const actionMatch = policy.actions.includes('*') || policy.actions.includes(action);
    return resourceMatch && actionMatch;
  };

  // Função principal de autorização (deny-overrides)
  const authorize = (resource: string, action: string): boolean => {
    if (!authState.user) {
      logAuditEvent(resource, action, 'deny', 'User not authenticated');
      return false;
    }

    const userRole = authState.user.role;
    const rolePolicy = RBAC_POLICIES.roles.find(r => r.role === userRole);

    if (!rolePolicy) {
      logAuditEvent(resource, action, 'deny', 'Role not found');
      return false;
    }

    // 1. Verificar deny policies primeiro (deny-overrides)
    if (rolePolicy.deny) {
      for (const denyPolicy of rolePolicy.deny) {
        if (matchesPolicy(denyPolicy, resource, action)) {
          logAuditEvent(resource, action, 'deny', 'Explicit deny policy');
          return false;
        }
      }
    }

    // 2. Verificar allow policies
    for (const allowPolicy of rolePolicy.allow) {
      if (matchesPolicy(allowPolicy, resource, action)) {
        logAuditEvent(resource, action, 'allow', 'Allow policy matched');
        return true;
      }
    }

    // 3. Default deny
    logAuditEvent(resource, action, 'deny', 'No allow policy matched');
    return false;
  };

  // Função para verificar acesso a um módulo (read permission)
  const hasModuleAccess = (resource: string): boolean => {
    return authorize(resource, 'read');
  };

  // Função para verificar permissão específica
  const hasPermission = (resource: string, action: string): boolean => {
    return authorize(resource, action);
  };

  // Função para verificar se é administrador
  const isAdmin = (): boolean => {
    return authState.user?.role === 'admin';
  };

  // Função para verificar se é gerente ou admin
  const isManagerOrAdmin = (): boolean => {
    return authState.user?.role === 'admin' || authState.user?.role === 'gerente';
  };

  // Função para verificar se pode aprovar
  const canApprove = (resource: string): boolean => {
    return authorize(resource, 'approve');
  };

  // Função para verificar se pode configurar
  const canConfigure = (resource: string): boolean => {
    return authorize(resource, 'configure');
  };

  // Função para verificar se pode excluir
  const canDelete = (resource: string): boolean => {
    return authorize(resource, 'delete');
  };

  // Função para verificar se pode editar
  const canEdit = (resource: string): boolean => {
    return authorize(resource, 'update');
  };

  // Função para verificar se pode criar
  const canCreate = (resource: string): boolean => {
    return authorize(resource, 'create');
  };

  // Função para verificar se pode exportar
  const canExport = (resource: string): boolean => {
    return authorize(resource, 'export');
  };

  // Log de auditoria
  const logAuditEvent = (resource: string, action: string, decision: 'allow' | 'deny', reason?: string) => {
    if (!authState.user) return;

    const auditEvent: AuditLog = {
      id: Date.now().toString(),
      userId: authState.user.id,
      userRole: authState.user.role,
      resource,
      action,
      decision,
      reason,
      timestamp: new Date().toISOString(),
      metadata: {
        username: authState.user.username,
        userAgent: navigator.userAgent
      }
    };

    // Salvar no localStorage (em produção seria banco de dados)
    const existingLogs = JSON.parse(localStorage.getItem('rbac_audit_logs') || '[]');
    existingLogs.push(auditEvent);
    
    // Manter apenas os últimos 1000 logs
    if (existingLogs.length > 1000) {
      existingLogs.splice(0, existingLogs.length - 1000);
    }
    
    localStorage.setItem('rbac_audit_logs', JSON.stringify(existingLogs));

    // Log no console para desenvolvimento
    console.log(`RBAC: ${decision.toUpperCase()} - ${authState.user.role} tried ${action} on ${resource}`, auditEvent);
  };

  // Função para obter logs de auditoria
  const getAuditLogs = (filters?: {
    userId?: string;
    resource?: string;
    action?: string;
    decision?: 'allow' | 'deny';
    startDate?: string;
    endDate?: string;
  }): AuditLog[] => {
    const auditLogs = JSON.parse(localStorage.getItem('rbac_audit_logs') || '[]');
    let filteredLogs = auditLogs;

    if (filters) {
      if (filters.userId) {
        filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
      }
      if (filters.resource) {
        filteredLogs = filteredLogs.filter(log => log.resource === filters.resource);
      }
      if (filters.action) {
        filteredLogs = filteredLogs.filter(log => log.action === filters.action);
      }
      if (filters.decision) {
        filteredLogs = filteredLogs.filter(log => log.decision === filters.decision);
      }
      if (filters.startDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        filteredLogs = filteredLogs.filter(log => log.timestamp <= filters.endDate!);
      }
    }

    return filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Função para limpar logs de auditoria (apenas admin)
  const clearAuditLogs = (): boolean => {
    if (!isAdmin()) {
      logAuditEvent('audit', 'clear', 'deny', 'Only admin can clear audit logs');
      return false;
    }

    localStorage.removeItem('rbac_audit_logs');
    logAuditEvent('audit', 'clear', 'allow', 'Audit logs cleared by admin');
    return true;
  };

  return {
    // Funções principais de autorização
    authorize,
    hasModuleAccess,
    hasPermission,
    authState,
    
    // Funções de conveniência
    isAdmin,
    isManagerOrAdmin,
    canApprove,
    canConfigure,
    canDelete,
    canEdit,
    canCreate,
    canExport,
    
    // Auditoria
    getAuditLogs,
    clearAuditLogs
  };
};