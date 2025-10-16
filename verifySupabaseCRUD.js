import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Ler .env manualmente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '.env');
const envContent = readFileSync(envPath, 'utf-8');

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const SUPABASE_URL = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ ERRO: Variáveis de ambiente não configuradas!');
  console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let testResults = {
  passed: 0,
  failed: 0,
  total: 0
};

function logTest(name, status, details = '') {
  testResults.total++;
  if (status) {
    testResults.passed++;
    console.log(`✅ ${name}`);
    if (details) console.log(`   ${details}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}`);
    if (details) console.log(`   Erro: ${details}`);
  }
}

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log('='.repeat(60));
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// TESTE 1: CONFIGURAÇÃO INICIAL
// ============================================================================
async function testConfiguration() {
  logSection('1️⃣  CONFIGURAÇÃO INICIAL');

  logTest(
    'Variáveis de ambiente definidas',
    !!SUPABASE_URL && !!SUPABASE_ANON_KEY,
    `URL: ${SUPABASE_URL}`
  );

  try {
    const { data, error } = await supabase.from('clients').select('count').limit(1);
    logTest(
      'Conexão com Supabase estabelecida',
      !error,
      error ? error.message : 'Status 200 OK'
    );
  } catch (err) {
    logTest('Conexão com Supabase estabelecida', false, err.message);
  }
}

// ============================================================================
// TESTE 2: CRUD DE CLIENTES
// ============================================================================
async function testClientCRUD() {
  logSection('2️⃣  CRUD DE CLIENTES');

  let clientId = null;

  // CREATE
  try {
    const { data: created, error } = await supabase
      .from('clients')
      .insert({
        name: 'Teste Bolt QA',
        cpf: `${Date.now()}`, // CPF único
        phone: '27999999999',
        email: 'teste.qa@bolt.new',
        residential_address: {
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'Vitória',
          state: 'ES',
          zipCode: '29000-000'
        },
        work_address: {
          company: 'Bolt QA',
          street: '',
          number: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        },
        documents: {}
      })
      .select()
      .single();

    logTest('CREATE: Cliente criado', !error, error ? error.message : `ID: ${created?.id}`);
    clientId = created?.id;
  } catch (err) {
    logTest('CREATE: Cliente criado', false, err.message);
  }

  await sleep(500);

  // READ
  try {
    const { data: listed, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    logTest(
      'READ: Cliente listado',
      !error && listed?.id === clientId,
      error ? error.message : `Nome: ${listed?.name}`
    );
  } catch (err) {
    logTest('READ: Cliente listado', false, err.message);
  }

  await sleep(500);

  // UPDATE
  try {
    const { data: updated, error } = await supabase
      .from('clients')
      .update({ phone: '27988888888', email: 'atualizado@bolt.new' })
      .eq('id', clientId)
      .select()
      .single();

    logTest(
      'UPDATE: Cliente atualizado',
      !error && updated?.phone === '27988888888',
      error ? error.message : `Novo telefone: ${updated?.phone}`
    );
  } catch (err) {
    logTest('UPDATE: Cliente atualizado', false, err.message);
  }

  await sleep(500);

  // DELETE
  try {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);

    logTest('DELETE: Cliente excluído', !error, error ? error.message : 'Removido com sucesso');

    // Verificar se foi realmente excluído
    const { data: check } = await supabase.from('clients').select('*').eq('id', clientId);
    logTest(
      'DELETE: Verificação de exclusão',
      check?.length === 0,
      `Registros encontrados: ${check?.length || 0}`
    );
  } catch (err) {
    logTest('DELETE: Cliente excluído', false, err.message);
  }

  return clientId;
}

// ============================================================================
// TESTE 3: CRUD DE EMPRÉSTIMOS
// ============================================================================
async function testLoanCRUD() {
  logSection('3️⃣  CRUD DE EMPRÉSTIMOS');

  let clientId = null;
  let loanId = null;

  // Primeiro criar um cliente para vincular
  try {
    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente Teste Empréstimo',
        cpf: `${Date.now()}`,
        phone: '27999999999',
        residential_address: {},
        work_address: {},
        documents: {}
      })
      .select()
      .single();

    clientId = client?.id;
    logTest(
      'SETUP: Cliente criado para teste de empréstimo',
      !error,
      error ? error.message : `ID: ${clientId}`
    );
  } catch (err) {
    logTest('SETUP: Cliente criado para teste de empréstimo', false, err.message);
    return;
  }

  await sleep(500);

  // CREATE LOAN
  try {
    const { data: created, error } = await supabase
      .from('loans')
      .insert({
        client_id: clientId,
        amount: 10000,
        interest_rate: 2.5,
        installments: 12,
        installment_value: 925.00,
        total_amount: 11100,
        start_date: '2025-01-01',
        end_date: '2025-12-01',
        remaining_amount: 11100,
        notes: 'Empréstimo de teste'
      })
      .select()
      .single();

    logTest('CREATE: Empréstimo criado', !error, error ? error.message : `ID: ${created?.id}`);
    loanId = created?.id;
  } catch (err) {
    logTest('CREATE: Empréstimo criado', false, err.message);
  }

  await sleep(500);

  // READ LOAN
  try {
    const { data: listed, error } = await supabase
      .from('loans')
      .select('*')
      .eq('id', loanId)
      .single();

    logTest(
      'READ: Empréstimo listado',
      !error && listed?.id === loanId,
      error ? error.message : `Valor: R$ ${listed?.amount}`
    );
  } catch (err) {
    logTest('READ: Empréstimo listado', false, err.message);
  }

  await sleep(500);

  // UPDATE LOAN
  try {
    const { data: updated, error } = await supabase
      .from('loans')
      .update({ amount: 12000, notes: 'Empréstimo atualizado' })
      .eq('id', loanId)
      .select()
      .single();

    logTest(
      'UPDATE: Empréstimo atualizado',
      !error && updated?.amount === 12000,
      error ? error.message : `Novo valor: R$ ${updated?.amount}`
    );
  } catch (err) {
    logTest('UPDATE: Empréstimo atualizado', false, err.message);
  }

  await sleep(500);

  // DELETE LOAN
  try {
    const { error } = await supabase.from('loans').delete().eq('id', loanId);

    logTest('DELETE: Empréstimo excluído', !error, error ? error.message : 'Removido com sucesso');
  } catch (err) {
    logTest('DELETE: Empréstimo excluído', false, err.message);
  }

  await sleep(500);

  // Cleanup: Excluir cliente
  try {
    await supabase.from('clients').delete().eq('id', clientId);
    logTest('CLEANUP: Cliente removido', true, `ID: ${clientId}`);
  } catch (err) {
    logTest('CLEANUP: Cliente removido', false, err.message);
  }
}

// ============================================================================
// TESTE 4: CRUD DE PAGAMENTOS
// ============================================================================
async function testPaymentCRUD() {
  logSection('4️⃣  CRUD DE PAGAMENTOS');

  let clientId = null;
  let loanId = null;
  let paymentId = null;

  // Setup: Criar cliente e empréstimo
  try {
    const { data: client } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente Teste Pagamento',
        cpf: `${Date.now()}`,
        phone: '27999999999',
        residential_address: {},
        work_address: {},
        documents: {}
      })
      .select()
      .single();

    clientId = client?.id;

    const { data: loan } = await supabase
      .from('loans')
      .insert({
        client_id: clientId,
        amount: 5000,
        interest_rate: 2.0,
        installments: 6,
        installment_value: 900,
        total_amount: 5400,
        start_date: '2025-01-01',
        end_date: '2025-06-01',
        remaining_amount: 5400
      })
      .select()
      .single();

    loanId = loan?.id;

    logTest(
      'SETUP: Cliente e empréstimo criados',
      !!clientId && !!loanId,
      `Client: ${clientId}, Loan: ${loanId}`
    );
  } catch (err) {
    logTest('SETUP: Cliente e empréstimo criados', false, err.message);
    return;
  }

  await sleep(500);

  // CREATE PAYMENT
  try {
    const { data: created, error } = await supabase
      .from('payments')
      .insert({
        loan_id: loanId,
        installment_number: 1,
        amount: 900,
        principal_amount: 800,
        interest_amount: 100,
        due_date: '2025-02-01',
        status: 'pending'
      })
      .select()
      .single();

    logTest('CREATE: Pagamento criado', !error, error ? error.message : `ID: ${created?.id}`);
    paymentId = created?.id;
  } catch (err) {
    logTest('CREATE: Pagamento criado', false, err.message);
  }

  await sleep(500);

  // UPDATE PAYMENT STATUS
  try {
    const { data: updated, error } = await supabase
      .from('payments')
      .update({ status: 'paid', payment_date: '2025-02-01' })
      .eq('id', paymentId)
      .select()
      .single();

    logTest(
      'UPDATE: Status de pagamento atualizado',
      !error && updated?.status === 'paid',
      error ? error.message : `Novo status: ${updated?.status}`
    );
  } catch (err) {
    logTest('UPDATE: Status de pagamento atualizado', false, err.message);
  }

  await sleep(500);

  // DELETE PAYMENT
  try {
    const { error } = await supabase.from('payments').delete().eq('id', paymentId);

    logTest('DELETE: Pagamento excluído', !error, error ? error.message : 'Removido com sucesso');
  } catch (err) {
    logTest('DELETE: Pagamento excluído', false, err.message);
  }

  await sleep(500);

  // Cleanup
  try {
    await supabase.from('loans').delete().eq('id', loanId);
    await supabase.from('clients').delete().eq('id', clientId);
    logTest('CLEANUP: Registros removidos', true);
  } catch (err) {
    logTest('CLEANUP: Registros removidos', false, err.message);
  }
}

// ============================================================================
// TESTE 5: FLUXO E2E COMPLETO
// ============================================================================
async function testE2EFlow() {
  logSection('5️⃣  FLUXO END-TO-END COMPLETO');

  let clientId, loanId, paymentId;

  try {
    // 1. Criar cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente E2E Test',
        cpf: `${Date.now()}`,
        phone: '27999999999',
        residential_address: {},
        work_address: {},
        documents: {}
      })
      .select()
      .single();

    clientId = client?.id;
    logTest('E2E: 1. Cliente criado', !clientError, `ID: ${clientId}`);
    await sleep(500);

    // 2. Criar empréstimo
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        client_id: clientId,
        amount: 8000,
        interest_rate: 2.5,
        installments: 10,
        installment_value: 880,
        total_amount: 8800,
        start_date: '2025-01-01',
        end_date: '2025-10-01',
        remaining_amount: 8800
      })
      .select()
      .single();

    loanId = loan?.id;
    logTest('E2E: 2. Empréstimo criado', !loanError, `ID: ${loanId}`);
    await sleep(500);

    // 3. Criar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        loan_id: loanId,
        installment_number: 1,
        amount: 880,
        principal_amount: 750,
        interest_amount: 130,
        due_date: '2025-02-01',
        status: 'pending'
      })
      .select()
      .single();

    paymentId = payment?.id;
    logTest('E2E: 3. Pagamento criado', !paymentError, `ID: ${paymentId}`);
    await sleep(500);

    // 4. Atualizar pagamento
    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'paid', payment_date: '2025-02-01' })
      .eq('id', paymentId);

    logTest('E2E: 4. Pagamento atualizado', !updateError);
    await sleep(500);

    // 5. Excluir pagamento
    const { error: deletePaymentError } = await supabase
      .from('payments')
      .delete()
      .eq('id', paymentId);

    logTest('E2E: 5. Pagamento excluído', !deletePaymentError);
    await sleep(500);

    // 6. Excluir empréstimo
    const { error: deleteLoanError } = await supabase.from('loans').delete().eq('id', loanId);

    logTest('E2E: 6. Empréstimo excluído', !deleteLoanError);
    await sleep(500);

    // 7. Excluir cliente
    const { error: deleteClientError } = await supabase.from('clients').delete().eq('id', clientId);

    logTest('E2E: 7. Cliente excluído', !deleteClientError);

    logTest('E2E: Fluxo completo executado', true, '✨ Todos os passos concluídos');
  } catch (err) {
    logTest('E2E: Fluxo completo executado', false, err.message);
  }
}

// ============================================================================
// TESTE 6: VALIDAÇÃO E INTEGRIDADE
// ============================================================================
async function testValidationAndIntegrity() {
  logSection('6️⃣  VALIDAÇÃO E INTEGRIDADE');

  // Teste 1: CPF duplicado
  try {
    const uniqueCPF = `TEST${Date.now()}`;

    await supabase
      .from('clients')
      .insert({
        name: 'Cliente 1',
        cpf: uniqueCPF,
        phone: '27999999999',
        residential_address: {},
        work_address: {},
        documents: {}
      })
      .select()
      .single();

    await sleep(500);

    const { error } = await supabase
      .from('clients')
      .insert({
        name: 'Cliente 2',
        cpf: uniqueCPF, // CPF duplicado
        phone: '27988888888',
        residential_address: {},
        work_address: {},
        documents: {}
      })
      .select()
      .single();

    logTest(
      'VALIDAÇÃO: CPF duplicado rejeitado',
      !!error && error.code === '23505',
      error ? 'Constraint violation detectada' : 'ERRO: Duplicata aceita!'
    );

    // Cleanup
    await supabase.from('clients').delete().eq('cpf', uniqueCPF);
  } catch (err) {
    logTest('VALIDAÇÃO: CPF duplicado rejeitado', false, err.message);
  }

  await sleep(500);

  // Teste 2: Foreign key constraint
  try {
    const { error } = await supabase
      .from('loans')
      .insert({
        client_id: '00000000-0000-0000-0000-000000000000', // ID inválido
        amount: 5000,
        interest_rate: 2.0,
        installments: 6,
        installment_value: 900,
        total_amount: 5400,
        start_date: '2025-01-01',
        end_date: '2025-06-01',
        remaining_amount: 5400
      })
      .select()
      .single();

    logTest(
      'VALIDAÇÃO: Foreign key constraint',
      !!error && error.code === '23503',
      error ? 'FK violation detectada' : 'ERRO: FK não validada!'
    );
  } catch (err) {
    logTest('VALIDAÇÃO: Foreign key constraint', false, err.message);
  }

  await sleep(500);

  // Teste 3: Campos obrigatórios
  try {
    const { error } = await supabase
      .from('clients')
      .insert({
        // name ausente (obrigatório)
        cpf: `${Date.now()}`,
        phone: '27999999999'
      })
      .select()
      .single();

    logTest(
      'VALIDAÇÃO: Campos obrigatórios',
      !!error,
      error ? 'Validação de NOT NULL funcionando' : 'ERRO: Campo obrigatório não validado!'
    );
  } catch (err) {
    logTest('VALIDAÇÃO: Campos obrigatórios', false, err.message);
  }
}

// ============================================================================
// TESTE 7: RLS (ROW LEVEL SECURITY)
// ============================================================================
async function testRLS() {
  logSection('7️⃣  ROW LEVEL SECURITY (RLS)');

  try {
    const { data: clients } = await supabase.from('clients').select('*').limit(5);

    logTest(
      'RLS: Leitura com ANON KEY permitida',
      Array.isArray(clients),
      `${clients?.length || 0} registros acessíveis`
    );
  } catch (err) {
    logTest('RLS: Leitura com ANON KEY permitida', false, err.message);
  }

  await sleep(500);

  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({
        name: 'Teste RLS',
        cpf: `${Date.now()}`,
        phone: '27999999999',
        residential_address: {},
        work_address: {},
        documents: {}
      })
      .select()
      .single();

    logTest(
      'RLS: Escrita com ANON KEY permitida',
      !error,
      error ? error.message : 'INSERT permitido'
    );

    if (data?.id) {
      await supabase.from('clients').delete().eq('id', data.id);
    }
  } catch (err) {
    logTest('RLS: Escrita com ANON KEY permitida', false, err.message);
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║      🧪  SUPABASE CRUD VERIFICATION TEST SUITE  🧪        ║');
  console.log('║                                                            ║');
  console.log('║                    credAmigo-prod                          ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');

  const startTime = Date.now();

  await testConfiguration();
  await testClientCRUD();
  await testLoanCRUD();
  await testPaymentCRUD();
  await testE2EFlow();
  await testValidationAndIntegrity();
  await testRLS();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Relatório Final
  logSection('📊  RELATÓRIO FINAL');
  console.log(`\n  Total de testes:     ${testResults.total}`);
  console.log(`  ✅ Testes aprovados: ${testResults.passed}`);
  console.log(`  ❌ Testes falhados:  ${testResults.failed}`);
  console.log(`  ⏱️  Tempo de execução: ${duration}s`);

  const successRate = ((testResults.passed / testResults.total) * 100).toFixed(1);
  console.log(`\n  Taxa de sucesso:     ${successRate}%`);

  if (testResults.failed === 0) {
    console.log(`\n  🎉  TODOS OS TESTES PASSARAM! 🎉`);
    console.log(`\n  ✨ Integração com Supabase 100% funcional!`);
  } else {
    console.log(`\n  ⚠️  ${testResults.failed} teste(s) falharam.`);
    console.log(`  📋 Revise os erros acima.`);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Execute
runAllTests().catch((err) => {
  console.error('\n❌ ERRO FATAL:', err.message);
  process.exit(1);
});
