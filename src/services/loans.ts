import { supabase } from '@/lib/supabase';
import { upsertPayment, createPaymentsForLoan } from './payments';

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
  // 1. Criar empréstimo
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

  // 2. Criar parcelas automaticamente usando o gerador SAC
  if (data) {
    try {
      await createPaymentsForLoan({
        id: data.id,
        amount: payload.amount,
        interestRate: payload.interest_rate,
        installments: payload.installments,
        startDate: payload.start_date
      });
    } catch (paymentError) {
      console.error('❌ Erro ao criar parcelas automaticamente:', paymentError);
      // Não falha a criação do empréstimo se as parcelas falharem
    }
  }

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

/**
 * Sincroniza parcelas do installment_plan para a tabela payments
 * Útil para empréstimos existentes que não têm parcelas na tabela payments
 */
export async function syncLoanPayments(loanId: string) {
  try {
    // Buscar empréstimo
    const loan = await getLoanById(loanId);
    if (!loan || !loan.installment_plan) {
      console.log('⚠️ Loan não encontrado ou sem installment_plan');
      return;
    }

    // Verificar se já existem parcelas
    const { data: existingPayments } = await supabase
      .from('payments')
      .select('installment_number')
      .eq('loan_id', loanId);

    const existingNumbers = new Set(existingPayments?.map(p => p.installment_number) || []);

    // Inserir parcelas que não existem
    let created = 0;
    for (const installment of loan.installment_plan) {
      if (!existingNumbers.has(installment.installmentNumber)) {
        await upsertPayment({
          loan_id: loanId,
          installment_number: installment.installmentNumber,
          amount: installment.totalAmount,
          principal_amount: installment.principalAmount || null,
          interest_amount: installment.interestAmount || null,
          penalty: 0,
          due_date: installment.dueDate,
          payment_date: installment.paymentDate || null,
          status: installment.status || 'pending',
          original_amount: installment.totalAmount,
          payment_type: 'full',
          excess_amount: 0,
          notes: null
        });
        created++;
      }
    }

    console.log(`✅ ${created} parcelas sincronizadas para loan ${loanId}`);
    return created;
  } catch (error) {
    console.error('❌ Erro ao sincronizar parcelas:', error);
    throw error;
  }
}

/**
 * Sincroniza todos os empréstimos existentes
 */
export async function syncAllLoansPayments() {
  try {
    const loans = await listLoans();
    let totalSynced = 0;

    for (const loan of loans) {
      const synced = await syncLoanPayments(loan.id);
      totalSynced += synced || 0;
    }

    console.log(`✅ Total de ${totalSynced} parcelas sincronizadas`);
    return totalSynced;
  } catch (error) {
    console.error('❌ Erro ao sincronizar todos empréstimos:', error);
    throw error;
  }
}
