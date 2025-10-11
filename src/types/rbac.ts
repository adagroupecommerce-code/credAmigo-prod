export interface RBACResource {
  dashboard: 'dashboard';
  crm: 'crm';
  customers: 'customers';
  loans: 'loans';
  collections: 'collections';
  finance: 'finance';
  simulator: 'simulator';
  reports: 'reports';
  settings: 'settings';
}

export interface RBACAction {
  read: 'read';
  create: 'create';
  update: 'update';
  delete: 'delete';
  approve: 'approve';
  export: 'export';
  configure: 'configure';
}

export interface RBACPolicy {
  resource: string;
  actions: string[];
}

export interface RBACRole {
  role: string;
  allow: RBACPolicy[];
  deny?: RBACPolicy[];
}

export interface RBACPolicies {
  resources: string[];
  actions: string[];
  roles: RBACRole[];
  evaluation_mode: 'deny-overrides';
}

export const RBAC_RESOURCES = {
  DASHBOARD: 'dashboard',
  CRM: 'crm',
  CUSTOMERS: 'customers',
  LOANS: 'loans',
  COLLECTIONS: 'collections',
  FINANCE: 'finance',
  SIMULATOR: 'simulator',
  REPORTS: 'reports',
  SETTINGS: 'settings'
} as const;

export const RBAC_ACTIONS = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  APPROVE: 'approve',
  EXPORT: 'export',
  CONFIGURE: 'configure'
} as const;

export const RBAC_ROLES = {
  ADMIN: 'admin',
  GERENTE: 'gerente',
  OPERADOR: 'operador'
} as const;

// Políticas RBAC conforme especificação
export const RBAC_POLICIES: RBACPolicies = {
  resources: [
    "dashboard", "crm", "customers", "loans", "collections",
    "finance", "simulator", "reports", "settings"
  ],
  actions: ["read", "create", "update", "delete", "approve", "export", "configure"],
  roles: [
    {
      role: "admin",
      allow: [{ resource: "*", actions: ["*"] }]
    },
    {
      role: "gerente",
      allow: [
        { resource: "*", actions: ["read", "create", "update", "approve", "export", "configure"] }
      ],
      deny: [
        { resource: "*", actions: ["delete"] }
      ]
    },
    {
      role: "operador",
      allow: [
        { resource: "*", actions: ["read", "create", "export"] }
      ],
      deny: [
        { resource: "*", actions: ["update", "delete", "approve", "configure"] }
      ]
    }
  ],
  evaluation_mode: "deny-overrides"
};

// Interface para auditoria
export interface AuditLog {
  id: string;
  userId: string;
  userRole: string;
  resource: string;
  action: string;
  decision: 'allow' | 'deny';
  reason?: string;
  timestamp: string;
  metadata?: any;
}