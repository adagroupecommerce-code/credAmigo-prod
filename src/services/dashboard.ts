import { supabase } from '@/lib/supabase';

export async function getDashboardKpis() {
  const [
    { data: loans },
    { data: payments },
    { data: clients }
  ] = await Promise.all([
    supabase.from('loans').select('amount, status, remaining_amount, total_amount'),
    supabase.from('payments').select('amount, status, due_date'),
    supabase.from('clients').select('id')
  ]);

  const totalLoans = (loans ?? []).length;
  const activeLoans = (loans ?? []).filter((l: any) => l.status === 'active').length;
  const totalLent = (loans ?? []).reduce((s: number, l: any) => s + Number(l.amount || 0), 0);

  const totalReceived = (payments ?? [])
    .filter((p: any) => p.status === 'paid')
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const pendingAmount = (loans ?? [])
    .filter((l: any) => l.status === 'active')
    .reduce((s: number, l: any) => s + Number(l.remaining_amount || 0), 0);

  const today = new Date().toISOString().split('T')[0];
  const overdueAmount = (payments ?? [])
    .filter((p: any) => p.status === 'pending' && p.due_date < today)
    .reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  const completedLoans = (loans ?? []).filter((l: any) => l.status === 'completed').length;
  const monthlyRevenue = totalReceived / Math.max(totalLoans, 1);

  const defaultRate = totalLoans > 0
    ? ((loans ?? []).filter((l: any) => l.status === 'defaulted').length / totalLoans) * 100
    : 0;

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
    totalClients: (clients ?? []).length,
  };
}
