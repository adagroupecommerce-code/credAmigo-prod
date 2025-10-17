import { supabase } from '../lib/supabase';
import { DateFilter, getDateRange, CustomDateRange } from '../utils/dateRange';

export interface DashboardKPIs {
  totalLoans: number;
  activeLoans: number;
  totalLent: number;
  totalReceived: number;
  pendingAmount: number;
  overdueAmount: number;
  monthlyRevenue: number;
  defaultRate: number;
  completedLoans: number;
  totalClients: number;
  defaultedLoans: number;
}

/**
 * Get dashboard KPIs filtered by date range
 * All data comes from Supabase - NO MOCKS
 */
export async function getDashboardKpis(filter: DateFilter = 'month', customRange?: CustomDateRange): Promise<DashboardKPIs> {
  const { from, to } = getDateRange(filter, customRange);

  // Fetch loans within date range
  const { data: loans, error: loansError } = await supabase
    .from('loans')
    .select('id, amount, status, remaining_amount, total_amount, start_date, created_at')
    .gte('created_at', from)
    .lte('created_at', to);

  if (loansError) {
    console.error('Error fetching loans:', loansError);
  }

  // Fetch payments within date range (by payment_date or due_date)
  const { data: payments, error: paymentsError } = await supabase
    .from('payments')
    .select('id, amount, status, due_date, payment_date, created_at')
    .gte('created_at', from)
    .lte('created_at', to);

  if (paymentsError) {
    console.error('Error fetching payments:', paymentsError);
  }

  // Fetch clients (can be filtered or just count all)
  const { count: totalClients } = await supabase
    .from('clients')
    .select('id', { count: 'exact', head: true });

  // Calculate metrics from real data
  const loansList = loans || [];
  const paymentsList = payments || [];

  const totalLoans = loansList.length;
  const activeLoans = loansList.filter(l => l.status === 'active').length;
  const completedLoans = loansList.filter(l => l.status === 'completed').length;
  const defaultedLoans = loansList.filter(l => l.status === 'defaulted').length;

  const totalLent = loansList.reduce((sum, l) => sum + Number(l.amount || 0), 0);

  const totalReceived = paymentsList
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const pendingAmount = loansList
    .filter(l => l.status === 'active')
    .reduce((sum, l) => sum + Number(l.remaining_amount || 0), 0);

  const today = new Date().toISOString();
  const overdueAmount = paymentsList
    .filter(p => p.status === 'pending' && p.due_date < today)
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const monthlyRevenue = totalReceived;
  const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

  return {
    totalLoans,
    activeLoans,
    totalLent,
    totalReceived,
    pendingAmount,
    overdueAmount,
    monthlyRevenue,
    defaultRate,
    completedLoans,
    totalClients: totalClients || 0,
    defaultedLoans
  };
}

/**
 * Get recent activities from Supabase
 */
export async function getRecentActivities(limit: number = 10) {
  const { data: recentPayments } = await supabase
    .from('payments')
    .select(`
      id,
      amount,
      status,
      payment_date,
      created_at,
      loans!inner(
        clients!inner(name)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  const { data: recentLoans } = await supabase
    .from('loans')
    .select(`
      id,
      amount,
      status,
      created_at,
      clients!inner(name)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);

  return {
    payments: recentPayments || [],
    loans: recentLoans || []
  };
}
