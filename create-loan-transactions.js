/**
 * Script para criar transações dos empréstimos existentes
 * e ajustar saldo de caixa
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mdgdxckreueoxjuizmtl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kZ2R4Y2tyZXVlb3hqdWl6bXRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxNTM4NTMsImV4cCI6MjA3NTcyOTg1M30.AhYdiH6huLZXUrPKSRWFrH5ev3gs0xa9OBFSosCnS4o';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createLoanTransactions() {
  console.log('🔄 Criando transações para empréstimos existentes...\n');

  try {
    // 1. Buscar empréstimos
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('id, amount, start_date');

    if (loansError) throw loansError;

    console.log(`📋 Encontrados ${loans.length} empréstimos\n`);

    // 2. Buscar conta principal
    const { data: accounts, error: accountsError } = await supabase
      .from('cash_accounts')
      .select('id, name, balance')
      .eq('is_active', true)
      .order('balance', { ascending: false });

    if (accountsError) throw accountsError;

    const mainAccount = accounts[0];
    console.log(`💰 Conta principal: ${mainAccount.name} - Saldo atual: R$ ${mainAccount.balance}\n`);

    let totalLoansAmount = 0;

    // 3. Criar transações
    for (const loan of loans) {
      console.log(`📦 Processando empréstimo ${loan.id} - R$ ${loan.amount}`);

      // Verificar se já existe transação
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference', `LOAN-${loan.id}`)
        .maybeSingle();

      if (existingTx) {
        console.log(`   ⏭️  Transação já existe, pulando...`);
        continue;
      }

      // Criar transação
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          account_id: mainAccount.id,
          type: 'expense',
          category: 'Empréstimos',
          subcategory: 'Concessão de Empréstimo',
          amount: loan.amount,
          description: `Empréstimo concedido - ID: ${loan.id}`,
          date: loan.start_date,
          reference: `LOAN-${loan.id}`,
          tags: ['empréstimo', 'saída']
        });

      if (txError) {
        console.error(`   ❌ Erro ao criar transação:`, txError.message);
        continue;
      }

      console.log(`   ✅ Transação criada`);
      totalLoansAmount += Number(loan.amount);
    }

    // 4. Atualizar saldo da conta
    const newBalance = Number(mainAccount.balance) - totalLoansAmount;

    console.log(`\n💳 Atualizando saldo da conta:`);
    console.log(`   Saldo anterior: R$ ${mainAccount.balance}`);
    console.log(`   Total emprestado: R$ ${totalLoansAmount.toFixed(2)}`);
    console.log(`   Novo saldo: R$ ${newBalance.toFixed(2)}`);

    const { error: updateError } = await supabase
      .from('cash_accounts')
      .update({ balance: newBalance })
      .eq('id', mainAccount.id);

    if (updateError) {
      console.error(`\n❌ Erro ao atualizar saldo:`, updateError.message);
    } else {
      console.log(`\n✅ Saldo atualizado com sucesso!`);
    }

    console.log(`\n🎉 Processamento concluído!`);
    console.log(`📊 ${loans.length} transações criadas`);
    console.log(`💰 Saldo final: R$ ${newBalance.toFixed(2)}`);

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }
}

createLoanTransactions();
