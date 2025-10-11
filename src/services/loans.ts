import { supabase } from '@/lib/supabase';

export async function listLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*, clients(name)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getLoanById(id: string) {
  const { data, error } = await supabase
    .from('loans')
    .select('*, clients(name)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createLoan(payload: {
  client_id: string;
  amount: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  remaining_amount: number;
  status?: string;
  paid_installments?: number;
  notes?: string | null;
  installment_plan?: any;
}) {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      client_id: payload.client_id,
      amount: payload.amount,
      interest_rate: payload.interest_rate,
      installments: payload.installments,
      installment_value: payload.installment_value,
      total_amount: payload.total_amount,
      start_date: payload.start_date,
      end_date: payload.end_date,
      remaining_amount: payload.remaining_amount,
      status: payload.status ?? 'active',
      paid_installments: payload.paid_installments ?? 0,
      notes: payload.notes ?? null,
      installment_plan: payload.installment_plan ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function updateLoan(id: string, patch: Partial<{
  client_id: string;
  amount: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  paid_installments: number;
  remaining_amount: number;
  notes: string | null;
  installment_plan: any;
}>) {
  const { data, error } = await supabase
    .from('loans')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLoan(id: string) {
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;
}
