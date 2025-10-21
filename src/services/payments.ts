import { supabase } from '@/lib/supabase';

export type PaymentRow = {
  id: string;
  loan_id: string;
  installment_number: number;
  status: 'pending' | 'paid' | 'overdue';
  amount: number | null;
  principal_amount: number | null;
  interest_amount: number | null;
  penalty: number | null;
  due_date: string | null;
  payment_date: string | null;
  created_at: string;
};

export async function listPaymentsByLoan(loanId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('loan_id', loanId)
    .order('installment_number', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getAllPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select('*, loans(*, clients(name))')
    .order('due_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertPayment(payload: {
  id?: string;
  loan_id: string;
  installment_number: number;
  amount: number;
  principal_amount?: number | null;
  interest_amount?: number | null;
  penalty?: number;
  due_date: string;
  payment_date?: string | null;
  status?: string;
  original_amount?: number;
  payment_type?: string;
  excess_amount?: number;
  notes?: string | null;
}) {
  const { data, error } = await supabase
    .from('payments')
    .upsert({
      id: payload.id,
      loan_id: payload.loan_id,
      installment_number: payload.installment_number,
      amount: payload.amount,
      principal_amount: payload.principal_amount ?? null,
      interest_amount: payload.interest_amount ?? null,
      penalty: payload.penalty ?? 0,
      due_date: payload.due_date,
      payment_date: payload.payment_date ?? null,
      status: payload.status ?? 'pending',
      original_amount: payload.original_amount ?? 0,
      payment_type: payload.payment_type ?? 'full',
      excess_amount: payload.excess_amount ?? 0,
      notes: payload.notes ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function updatePayment(id: string, patch: Partial<{
  amount: number;
  principal_amount: number | null;
  interest_amount: number | null;
  penalty: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  original_amount: number;
  payment_type: string;
  excess_amount: number;
  notes: string | null;
}>) {
  const { data, error } = await supabase
    .from('payments')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function deletePayment(id: string) {
  const { error } = await supabase.from('payments').delete().eq('id', id);
  if (error) throw error;
}

/**
 * Mark a payment as paid
 * Updates status, payment_date and amounts
 */
export async function markPaymentAsPaid(paymentId: string, payload: {
  payment_date: string;
  principal_amount?: number;
  interest_amount?: number;
  penalty?: number;
  amount: number;
}) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      payment_date: payload.payment_date,
      principal_amount: payload.principal_amount ?? null,
      interest_amount: payload.interest_amount ?? null,
      penalty: payload.penalty ?? 0,
      amount: payload.amount
    })
    .eq('id', paymentId)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark installment as paid (with proper number conversion)
 */
export async function markInstallmentPaid(paymentId: string, payload: {
  payment_date: string;
  total: number;
  principal_amount: number;
  interest_amount: number;
  penalty?: number;
}) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      payment_date: payload.payment_date,
      amount: Number(payload.total),
      principal_amount: Number(payload.principal_amount),
      interest_amount: Number(payload.interest_amount),
      penalty: Number(payload.penalty ?? 0)
    })
    .eq('id', paymentId)
    .select()
    .single();

  if (error) throw error;
  return data as PaymentRow;
}

/**
 * Get payments by loan ID (for re-fetching)
 */
export async function getPaymentsByLoan(loanId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select('id, loan_id, installment_number, status, amount, principal_amount, interest_amount, penalty, due_date, payment_date, created_at')
    .eq('loan_id', loanId)
    .order('installment_number', { ascending: true });

  if (error) throw error;
  return data as PaymentRow[];
}

/**
 * Sync payments from loan (optional: if RPC exists)
 */
export async function syncPaymentsFromLoan(loanId: string) {
  try {
    const { error } = await supabase.rpc('sync_payments_from_loan', { loan_id: loanId });
    if (error) throw error;
  } catch (error) {
    // RPC may not exist, ignore
    console.warn('sync_payments_from_loan RPC not available:', error);
  }
}
