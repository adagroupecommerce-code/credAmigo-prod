/**
 * Script para sincronizar parcelas de empréstimos existentes
 * Execute: node sync-payments.js
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar .env
dotenv.config({ path: resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY devem estar definidos no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Gera parcelas usando SAC
 */
function generateInstallments(loan) {
  const { id, amount, interest_rate, installments, start_date } = loan;

  const principalPerInstallment = amount / installments;
  const monthlyRate = interest_rate / 100;

  const installmentsData = [];
  let remainingPrincipal = amount;

  for (let i = 1; i <= installments; i++) {
    const interestAmount = remainingPrincipal * monthlyRate;
    const installmentAmount = principalPerInstallment + interestAmount;

    // Adiciona meses à data inicial
    const dueDate = new Date(start_date);
    dueDate.setMonth(dueDate.getMonth() + i);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    installmentsData.push({
      loan_id: id,
      installment_number: i,
      amount: Number(installmentAmount.toFixed(2)),
      principal_amount: Number(principalPerInstallment.toFixed(2)),
      interest_amount: Number(interestAmount.toFixed(2)),
      due_date: dueDateStr,
      status: 'pending'
    });

    remainingPrincipal -= principalPerInstallment;
  }

  return installmentsData;
}

async function syncPayments() {
  console.log('🔄 Iniciando sincronização de parcelas...\n');

  try {
    // Buscar todos os empréstimos
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('id, amount, interest_rate, installments, start_date');

    if (loansError) throw loansError;

    if (!loans || loans.length === 0) {
      console.log('⚠️  Nenhum empréstimo encontrado');
      return;
    }

    console.log(`📋 Encontrados ${loans.length} empréstimos\n`);

    let totalCreated = 0;

    for (const loan of loans) {
      console.log(`\n📦 Processando empréstimo ${loan.id}`);
      console.log(`   Valor: R$ ${loan.amount} | Parcelas: ${loan.installments} | Taxa: ${loan.interest_rate}%`);

      // Verificar se já tem parcelas
      const { data: existing, error: checkError } = await supabase
        .from('payments')
        .select('id')
        .eq('loan_id', loan.id)
        .limit(1);

      if (checkError) {
        console.error(`   ❌ Erro ao verificar parcelas:`, checkError.message);
        continue;
      }

      if (existing && existing.length > 0) {
        console.log(`   ⏭️  Já possui parcelas, pulando...`);
        continue;
      }

      // Gerar parcelas
      const installments = generateInstallments(loan);

      // Inserir no banco
      const { data, error: insertError } = await supabase
        .from('payments')
        .insert(installments)
        .select('id');

      if (insertError) {
        console.error(`   ❌ Erro ao criar parcelas:`, insertError.message);
        continue;
      }

      console.log(`   ✅ ${installments.length} parcelas criadas com sucesso!`);
      totalCreated += installments.length;
    }

    console.log(`\n\n🎉 Sincronização concluída!`);
    console.log(`📊 Total de parcelas criadas: ${totalCreated}`);

  } catch (error) {
    console.error('\n❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
syncPayments();
