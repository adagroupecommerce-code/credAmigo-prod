import { supabase } from '@/lib/supabase';
import { createPaymentsForLoan } from './payments';

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
  account_id?: string;
  status?: string;
  paid_installments?: number;
  notes?: string | null;
  installment_plan?: any;
}) {
  // 0. Selecionar conta (fornecida ou com maior saldo)
  let selectedAccount;

  if (payload.account_id) {
    // Usar conta especificada
    const { data: accountData, error: accountError } = await supabase
      .from('cash_accounts')
      .select('id, name, balance')
      .eq('id', payload.account_id)
      .eq('is_active', true)
      .single();

    if (accountError || !accountData) {
      throw new Error('Conta bancária não encontrada ou inativa');
    }
    selectedAccount = accountData;
  } else {
    // Buscar conta com maior saldo
    const { data: accounts, error: accountsError } = await supabase
      .from('cash_accounts')
      .select('id, name, balance')
      .eq('is_active', true)
      .order('balance', { ascending: false });

    if (accountsError) throw accountsError;

    if (!accounts || accounts.length === 0) {
      throw new Error('Nenhuma conta de caixa/banco ativa encontrada');
    }

    selectedAccount = accounts[0];
  }

  // Validar saldo
  const accountBalance = Number(selectedAccount.balance);
  if (accountBalance < payload.amount) {
    throw new Error(`Saldo insuficiente na conta ${selectedAccount.name}. Disponível: R$ ${accountBalance.toFixed(2)}, Necessário: R$ ${payload.amount.toFixed(2)}`);
  }

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
      account_id: selectedAccount.id,
      status: payload.status ?? 'active',
      paid_installments: payload.paid_installments ?? 0,
      notes: payload.notes ?? null,
      installment_plan: payload.installment_plan ?? null,
    })
    .select('id, client_id')
    .single();

  if (error) throw error;

  // 2. Criar transação de saída (empréstimo concedido)
  try {
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        account_id: selectedAccount.id,
        type: 'expense',
        category: 'Empréstimos',
        subcategory: 'Concessão de Empréstimo',
        amount: payload.amount,
        description: `Empréstimo concedido - ID: ${data.id}`,
        date: payload.start_date,
        reference: `LOAN-${data.id}`,
        tags: ['empréstimo', 'saída']
      });

    if (transactionError) {
      console.error('❌ Erro ao criar transação:', transactionError);
    }

    // 3. Atualizar saldo da conta
    const newBalance = accountBalance - payload.amount;
    const { error: updateError } = await supabase
      .from('cash_accounts')
      .update({ balance: newBalance })
      .eq('id', selectedAccount.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar saldo:', updateError);
    } else {
      console.log(`✅ Saldo atualizado: ${selectedAccount.name} - R$ ${newBalance.toFixed(2)}`);
    }
  } catch (txError) {
    console.error('❌ Erro ao processar transação:', txError);
  }

  // 4. Criar parcelas automaticamente usando o gerador SAC
  if (data) {
    try {
      console.log('🔄 Criando parcelas para empréstimo:', data.id);
      const payments = await createPaymentsForLoan({
        id: data.id,
        amount: payload.amount,
        interestRate: payload.interest_rate,
        installments: payload.installments,
        startDate: payload.start_date
      });
      console.log(`✅ ${payments?.length || payload.installments} parcelas criadas com sucesso!`);
    } catch (paymentError) {
      console.error('❌ ERRO CRÍTICO ao criar parcelas:', paymentError);
      // Não falhar a criação do empréstimo, mas alertar o usuário
      throw new Error(`Empréstimo criado mas falha ao gerar parcelas: ${paymentError}`);
    }
  }

  console.log('✅ Empréstimo criado com sucesso:', data.id);
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
  console.log('🗑️ [DELETE LOAN] Iniciando exclusão do empréstimo:', id);

  // 1. Buscar empréstimo para obter dados
  const loan = await getLoanById(id);
  if (!loan) {
    throw new Error('Empréstimo não encontrado');
  }

  console.log('📊 [DELETE LOAN] Empréstimo encontrado:', {
    amount: loan.amount,
    account_id: loan.account_id
  });

  // 2. Se o empréstimo tem conta associada, reverter o dinheiro
  if (loan.account_id) {
    try {
      console.log('💰 [DELETE LOAN] Revertendo valor para conta:', loan.account_id);

      // Buscar conta
      const { data: account, error: accountError } = await supabase
        .from('cash_accounts')
        .select('id, name, balance')
        .eq('id', loan.account_id)
        .maybeSingle();

      if (accountError) {
        console.error('❌ [DELETE LOAN] Erro ao buscar conta:', accountError);
      } else if (account) {
        // Devolver o dinheiro para a conta
        const currentBalance = Number(account.balance);
        const newBalance = currentBalance + loan.amount;

        const { error: updateError } = await supabase
          .from('cash_accounts')
          .update({ balance: newBalance })
          .eq('id', account.id);

        if (updateError) {
          console.error('❌ [DELETE LOAN] Erro ao atualizar saldo:', updateError);
        } else {
          console.log(`✅ [DELETE LOAN] Saldo devolvido: ${account.name}`);
          console.log(`   Anterior: R$ ${currentBalance.toFixed(2)}`);
          console.log(`   Devolvido: R$ ${loan.amount.toFixed(2)}`);
          console.log(`   Novo: R$ ${newBalance.toFixed(2)}`);

          // Criar transação de entrada (devolução/estorno)
          const { error: transactionError } = await supabase
            .from('transactions')
            .insert({
              account_id: account.id,
              type: 'income',
              category: 'Empréstimos',
              subcategory: 'Estorno de Empréstimo',
              amount: loan.amount,
              description: `Estorno - Empréstimo excluído - ID: ${id}`,
              date: new Date().toISOString().split('T')[0],
              reference: `LOAN-CANCEL-${id}`,
              tags: ['empréstimo', 'estorno', 'exclusão']
            });

          if (transactionError) {
            console.error('❌ [DELETE LOAN] Erro ao criar transação de estorno:', transactionError);
          } else {
            console.log('✅ [DELETE LOAN] Transação de estorno criada');
          }
        }
      } else {
        console.warn('⚠️ [DELETE LOAN] Conta não encontrada:', loan.account_id);
      }
    } catch (error) {
      console.error('❌ [DELETE LOAN] Erro ao processar reversão financeira:', error);
    }
  } else {
    console.log('⚠️ [DELETE LOAN] Empréstimo sem conta associada, pulando reversão');
  }

  // 3. Excluir parcelas associadas
  try {
    console.log('🗑️ [DELETE LOAN] Excluindo parcelas...');
    const { error: paymentsError } = await supabase
      .from('payments')
      .delete()
      .eq('loan_id', id);

    if (paymentsError) {
      console.error('❌ [DELETE LOAN] Erro ao excluir parcelas:', paymentsError);
    } else {
      console.log('✅ [DELETE LOAN] Parcelas excluídas');
    }
  } catch (error) {
    console.error('❌ [DELETE LOAN] Erro ao excluir parcelas:', error);
  }

  // 4. Excluir transação original do empréstimo
  try {
    console.log('🗑️ [DELETE LOAN] Excluindo transação original...');
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .eq('reference', `LOAN-${id}`);

    if (txError) {
      console.error('❌ [DELETE LOAN] Erro ao excluir transação:', txError);
    } else {
      console.log('✅ [DELETE LOAN] Transação original excluída');
    }
  } catch (error) {
    console.error('❌ [DELETE LOAN] Erro ao excluir transação:', error);
  }

  // 5. Excluir empréstimo
  console.log('🗑️ [DELETE LOAN] Excluindo empréstimo do banco...');
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) throw error;

  console.log('✅ [DELETE LOAN] Empréstimo excluído com sucesso!');
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
