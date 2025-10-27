import { supabase } from '@/lib/supabase';
import { generateInstallments, InstallmentData } from '@/utils/installmentGenerator';

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
      due_date, payment_date, created_at,
      loans (
        id, client_id, amount,
        clients ( id, name )
      )
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
  // 1. Buscar informações do pagamento e empréstimo
  const { data: paymentData, error: paymentError } = await supabase
    .from('payments')
    .select(`
      id, loan_id, installment_number,
      loans (
        id, account_id, client_id,
        clients ( name )
      )
    `)
    .eq('id', paymentId)
    .single();

  if (paymentError) throw paymentError;

  // 2. Atualizar status da parcela
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

  // 3. Criar transação de entrada e atualizar saldo da conta
  const loan = paymentData.loans as any;
  if (loan?.account_id) {
    try {
      // Criar transação de entrada
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          account_id: loan.account_id,
          type: 'income',
          category: 'Recebimentos',
          subcategory: 'Pagamento de Parcela',
          amount: payload.total,
          description: `Parcela ${paymentData.installment_number} - ${loan.clients?.name || 'Cliente'}`,
          date: payload.payment_date,
          reference: `PAYMENT-${paymentId}`,
          tags: ['pagamento', 'parcela']
        });

      if (transactionError) {
        console.error('❌ Erro ao criar transação:', transactionError);
      }

      // Atualizar saldo da conta
      const { data: accountData, error: accountError } = await supabase
        .from('cash_accounts')
        .select('balance')
        .eq('id', loan.account_id)
        .single();

      if (!accountError && accountData) {
        const newBalance = Number(accountData.balance) + payload.total;

        const { error: updateError } = await supabase
          .from('cash_accounts')
          .update({ balance: newBalance })
          .eq('id', loan.account_id);

        if (updateError) {
          console.error('❌ Erro ao atualizar saldo:', updateError);
        } else {
          console.log(`✅ Saldo atualizado: +R$ ${payload.total.toFixed(2)} = R$ ${newBalance.toFixed(2)}`);
        }
      }
    } catch (txError) {
      console.error('❌ Erro ao processar transação financeira:', txError);
    }
  } else {
    console.warn('⚠️ Empréstimo sem conta vinculada. Transação não criada.');
  }

  // Disparar evento para notificar outros componentes
  window.dispatchEvent(new CustomEvent('payment-made', {
    detail: { paymentId, amount: payload.total }
  }));

  return mapToPayment(data as PaymentRow);
}

/** Opcional — se a RPC existir no banco */
export async function syncPaymentsFromLoan(loanId: string) {
  const { error } = await supabase.rpc('sync_payments_from_loan', { loan_id: loanId });
  if (error) throw error;
}

/**
 * Cria parcelas para um empréstimo (insere em lote no banco)
 */
export async function createPaymentsForLoan(loanData: {
  id: string;
  amount: number;
  interestRate: number;
  installments: number;
  startDate: string;
}) {
  // Gera as parcelas usando SAC
  const installments = generateInstallments(loanData);

  // Insere todas as parcelas no banco de uma vez
  const { data, error } = await supabase
    .from('payments')
    .insert(installments)
    .select('id');

  if (error) {
    console.error('Erro ao criar parcelas:', error);
    throw error;
  }

  console.log(`✅ ${installments.length} parcelas criadas para o empréstimo ${loanData.id}`);
  return data;
}

/**
 * Sincroniza parcelas de todos os empréstimos que não têm parcelas
 */
export async function syncAllLoansPayments() {
  try {
    // Busca todos os empréstimos
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('id, amount, interest_rate, installments, start_date');

    if (loansError) throw loansError;

    if (!loans || loans.length === 0) {
      console.log('⚠️ Nenhum empréstimo encontrado');
      return;
    }

    console.log(`📋 Encontrados ${loans.length} empréstimos`);

    // Para cada empréstimo, verifica se já tem parcelas
    for (const loan of loans) {
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('payments')
        .select('id')
        .eq('loan_id', loan.id)
        .limit(1);

      if (paymentsError) {
        console.error(`Erro ao verificar parcelas do empréstimo ${loan.id}:`, paymentsError);
        continue;
      }

      // Se já tem parcelas, pula
      if (existingPayments && existingPayments.length > 0) {
        console.log(`⏭️ Empréstimo ${loan.id} já possui parcelas`);
        continue;
      }

      // Cria as parcelas
      console.log(`📦 Gerando parcelas para empréstimo ${loan.id}...`);
      await createPaymentsForLoan({
        id: loan.id,
        amount: Number(loan.amount),
        interestRate: Number(loan.interest_rate),
        installments: loan.installments,
        startDate: loan.start_date
      });
    }

    console.log('✅ Sincronização de parcelas concluída!');
  } catch (error) {
    console.error('❌ Erro na sincronização de parcelas:', error);
    throw error;
  }
}
