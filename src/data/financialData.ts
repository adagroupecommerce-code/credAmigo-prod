import { CashAccount, Transaction, DREReport, CashFlowProjection } from '../types/financial';

export const mockCashAccounts: CashAccount[] = [];
export const mockTransactions: Transaction[] = [];
export const mockDREReport: DREReport = {
  period: '',
  revenue: { loanInterest: 0, fees: 0, other: 0, total: 0 },
  costs: { defaultLosses: 0, operationalCosts: 0, total: 0 },
  expenses: { administrative: 0, marketing: 0, personnel: 0, other: 0, total: 0 },
  financialResult: { financialIncome: 0, financialExpenses: 0, net: 0 },
  grossProfit: 0,
  operationalProfit: 0,
  netProfit: 0,
  margins: { gross: 0, operational: 0, net: 0 }
};
export const mockCashFlowProjection: CashFlowProjection[] = [];