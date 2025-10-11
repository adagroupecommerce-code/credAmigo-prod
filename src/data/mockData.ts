import { Client, Loan, Payment, Dashboard } from '../types';

export const mockClients: Client[] = [];
export const mockLoans: Loan[] = [];
export const mockPayments: Payment[] = [];
export const mockDashboard: Dashboard = {
  totalLoans: 0,
  activeLoans: 0,
  totalLent: 0,
  totalReceived: 0,
  pendingAmount: 0,
  overdueAmount: 0,
  monthlyRevenue: 0,
  defaultRate: 0
};