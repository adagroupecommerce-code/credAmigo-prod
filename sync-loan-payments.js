import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Ler .env manualmente
const envFile = readFileSync('.env', 'utf-8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function syncLoanPayments() {
  console.log('🔄 SINCRONIZANDO PARCELAS PAGAS\n');
  console.log('='.repeat(80));

  try {
    // Buscar todos os empréstimos
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select('id, installments, paid_installments')
      .order('created_at', { ascending: false });

    if (loansError) throw loansError;

    console.log(`\n📋 Encontrados ${loans?.length || 0} empréstimos\n`);

    let updated = 0;
    let unchanged = 0;

    for (const loan of loans || []) {
      console.log(`\n📦 Empréstimo: ${loan.id}`);
      console.log(`   Valor atual: ${loan.paid_installments || 0}/${loan.installments} parcelas`);

      // Contar parcelas pagas
      const { data: paidPayments, error: countError } = await supabase
        .from('payments')
        .select('id', { count: 'exact' })
        .eq('loan_id', loan.id)
        .eq('status', 'paid');

      if (countError) {
        console.error(`   ❌ Erro ao contar parcelas:`, countError.message);
        continue;
      }

      const paidCount = paidPayments?.length || 0;
      console.log(`   Valor correto: ${paidCount}/${loan.installments} parcelas`);

      if (paidCount !== (loan.paid_installments || 0)) {
        // Precisa atualizar
        console.log(`   🔄 Atualizando...`);

        const updates = {
          paid_installments: paidCount,
          updated_at: new Date().toISOString()
        };

        // Se todas as parcelas foram pagas, marcar como completed
        if (paidCount >= loan.installments) {
          updates.status = 'completed';
          updates.remaining_amount = 0;
          console.log(`   🎉 Todas as parcelas pagas! Marcando como finalizado...`);
        }

        const { error: updateError } = await supabase
          .from('loans')
          .update(updates)
          .eq('id', loan.id);

        if (updateError) {
          console.error(`   ❌ Erro ao atualizar:`, updateError.message);
          continue;
        }

        console.log(`   ✅ Atualizado: ${loan.paid_installments || 0} → ${paidCount}`);
        updated++;
      } else {
        console.log(`   ✓ Já está correto`);
        unchanged++;
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 RESUMO:');
    console.log(`   Total de empréstimos: ${loans?.length || 0}`);
    console.log(`   ✅ Atualizados: ${updated}`);
    console.log(`   ✓ Já corretos: ${unchanged}`);
    console.log('\n✅ SINCRONIZAÇÃO CONCLUÍDA!\n');

  } catch (error) {
    console.error('\n❌ ERRO NA SINCRONIZAÇÃO:', error.message);
    process.exit(1);
  }
}

syncLoanPayments();
