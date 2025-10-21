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
  loans?: {
    id: string;
    client_id: string;
    amount: number | null;
    clients?: { id: string; name: string | null } | null;
  } | null;
};

function mapToPayment(p: PaymentRow) {
  return {
    id: p.id,
    loanId: p.loan_id,
    installmentNumber: p.installment_number,
    amount: Number(p.amount ?? 0),
    principalAmount: Number(p.principal_amount ?? 0),
    interestAmount: Number(p.interest_amount ?? 0),
    penalty: Number(p.penalty ?? 0),
    dueDate: p.due_date ?? '',
    paymentDate: p.payment_date ?? null,
    status: p.status,
    clientName: p.loans?.clients?.name ?? 'Cliente Desconhecido',
    loanAmount: Number(p.loans?.amount ?? 0),
  };
}

/** Busca todas as parcelas com os relacionamentos reais no Supabase */
export async function getAllPayments() {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id, loan_id, installment_number, status, amount, principal_amount, interest_amount, penalty,
      due_date, payment_date, created_at
    `)
    .order('due_date', { ascending: true });

  if (error) throw error;
  return (data as PaymentRow[]).map(mapToPayment);
}

/** Busca apenas as parcelas de um empréstimo específico */
export async function getPaymentsByLoan(loanId: string) {
  const { data, error } = await supabase
    .from('payments')
    .select(`
      id, loan_id, installment_number, status, amount, principal_amount, interest_amount, penalty,
      due_date, payment_date, created_at
    `)
    .eq('loan_id', loanId)
    .order('installment_number', { ascending: true });

  if (error) throw error;
  return (data as PaymentRow[]).map(mapToPayment);
}

/** Marca uma parcela como paga e retorna os dados atualizados do banco */
export async function markInstallmentPaid(
  paymentId: string,
  payload: {
    payment_date: string;     // ISO (yyyy-mm-dd)
    total: number;
    principal_amount: number;
    interest_amount: number;
    penalty?: number;
  }
) {
  const { data, error } = await supabase
    .from('payments')
    .update({
      status: 'paid',
      payment_date: payload.payment_date,
      amount: Number(payload.total),
      principal_amount: Number(payload.principal_amount),
      interest_amount: Number(payload.interest_amount),
      penalty: Number(payload.penalty ?? 0),
    })
    .eq('id', paymentId)
    .select(`
      id, loan_id, installment_number, status, amount, principal_amount, interest_amount, penalty,
      due_date, payment_date, created_at
    `)
    .single();

  if (error) throw error;
  return mapToPayment(data as PaymentRow);
}

/** Opcional — se a RPC existir no banco */
export async function syncPaymentsFromLoan(loanId: string) {
  const { error } = await supabase.rpc('sync_payments_from_loan', { loan_id: loanId });
  if (error) throw error;
}
