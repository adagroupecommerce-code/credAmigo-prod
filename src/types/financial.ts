export interface CashAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'investment';
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense' | 'transfer';
  category: string;
  subcategory?: string;
  amount: number;
  description: string;
  date: string;
  reference?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CashFlowEntry {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'inflow' | 'outflow';
  amount: number;
  accountId: string;
  transactionId?: string;
  isRecurring: boolean;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  };
}

export interface DREEntry {
  id: string;
  period: string; // YYYY-MM
  category: 'revenue' | 'cost' | 'expense' | 'financial';
  subcategory: string;
  description: string;
  amount: number;
  percentage?: number;
}

export interface DREReport {
  period: string;
  revenue: {
    loanInterest: number;
    fees: number;
    other: number;
    total: number;
  };
  costs: {
    defaultLosses: number;
    operationalCosts: number;
    total: number;
  };
  expenses: {
    administrative: number;
    marketing: number;
    personnel: number;
    other: number;
    total: number;
  };
  financialResult: {
    financialIncome: number;
    financialExpenses: number;
    net: number;
  };
  grossProfit: number;
  operationalProfit: number;
  netProfit: number;
  margins: {
    gross: number;
    operational: number;
    net: number;
  };
}

export interface CashFlowProjection {
  date: string;
  openingBalance: number;
  inflows: {
    loanPayments: number;
    newLoans: number;
    other: number;
    total: number;
  };
  outflows: {
    newLoanDisbursements: number;
    operationalExpenses: number;
    taxes: number;
    other: number;
    total: number;
  };
  netFlow: number;
  closingBalance: number;
}

export const TRANSACTION_CATEGORIES = {
  income: [
    'Juros de Empréstimos',
    'Taxas e Tarifas',
    'Multas por Atraso',
    'Rendimentos Financeiros',
    'Outros Recebimentos'
  ],
  expense: [
    'Despesas Administrativas',
    'Marketing e Publicidade',
    'Pessoal e Encargos',
    'Impostos e Taxas',
    'Despesas Financeiras',
    'Provisão para Devedores Duvidosos',
    'Outras Despesas'
  ]
};

export const DRE_CATEGORIES = {
  revenue: {
    'Juros de Empréstimos': 'Receita principal com juros cobrados',
    'Taxas e Tarifas': 'Taxas de abertura, manutenção, etc.',
    'Multas por Atraso': 'Multas cobradas por atraso',
    'Outras Receitas': 'Demais receitas operacionais'
  },
  cost: {
    'Provisão Devedores Duvidosos': 'Provisão para inadimplência',
    'Custos Operacionais': 'Custos diretos da operação'
  },
  expense: {
    'Despesas Administrativas': 'Despesas gerais e administrativas',
    'Marketing': 'Investimentos em marketing',
    'Pessoal': 'Salários e encargos',
    'Outras Despesas': 'Demais despesas operacionais'
  },
  financial: {
    'Receitas Financeiras': 'Rendimentos de aplicações',
    'Despesas Financeiras': 'Juros pagos, tarifas bancárias'
  }
};