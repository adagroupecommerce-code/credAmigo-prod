import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getCashFlowProjection(months = 6) {
  console.log(`\n🔄 Gerando projeção para ${months} meses...`);
  
  const projections = [];
  const now = new Date();

  for (let i = 0; i < months; i++) {
    const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
    const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

    const monthStr = month.toISOString().split('T')[0].substring(0, 7);
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthName = `${monthNames[month.getMonth()]}/${month.getFullYear().toString().substr(2)}`;

    const { data: expectedPayments } = await supabase
      .from('payments')
      .select('amount, status')
      .gte('due_date', firstDay.toISOString().split('T')[0])
      .lte('due_date', lastDay.toISOString().split('T')[0]);

    const expectedRevenue = expectedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
    const paidRevenue = expectedPayments?.filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    projections.push({
      month: monthStr,
      monthName,
      expectedRevenue,
      paidRevenue
    });
  }

  return projections;
}

async function testFilters() {
  console.log('🧪 TESTANDO FILTROS DE FLUXO DE CAIXA\n');
  console.log('='.repeat(60));
  
  // Teste 1: Mês Atual
  console.log('\n📅 TESTE 1: Mês Atual (1 mês)');
  const data1 = await getCashFlowProjection(1);
  console.log(`✅ Retornou ${data1.length} mês(es)`);
  console.log('Meses:', data1.map(d => d.monthName).join(', '));
  
  // Teste 2: 3 Meses
  console.log('\n📅 TESTE 2: Próximos 3 Meses');
  const data3 = await getCashFlowProjection(3);
  console.log(`✅ Retornou ${data3.length} mês(es)`);
  console.log('Meses:', data3.map(d => d.monthName).join(', '));
  
  // Teste 3: 6 Meses
  console.log('\n📅 TESTE 3: Próximos 6 Meses (Padrão)');
  const data6 = await getCashFlowProjection(6);
  console.log(`✅ Retornou ${data6.length} mês(es)`);
  console.log('Meses:', data6.map(d => d.monthName).join(', '));
  
  // Teste 4: 12 Meses
  console.log('\n📅 TESTE 4: Próximos 12 Meses');
  const data12 = await getCashFlowProjection(12);
  console.log(`✅ Retornou ${data12.length} mês(es)`);
  console.log('Meses:', data12.map(d => d.monthName).join(', '));
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ TODOS OS TESTES PASSARAM!');
  
  // Validação
  if (data1.length !== 1) console.error('❌ ERRO: Teste 1 deveria retornar 1 mês');
  if (data3.length !== 3) console.error('❌ ERRO: Teste 2 deveria retornar 3 meses');
  if (data6.length !== 6) console.error('❌ ERRO: Teste 3 deveria retornar 6 meses');
  if (data12.length !== 12) console.error('❌ ERRO: Teste 4 deveria retornar 12 meses');
}

testFilters().catch(console.error);
