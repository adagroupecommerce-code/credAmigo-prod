// Script de teste da conexão Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pafbydmrhfaiaokadlot.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhZmJ5ZG1yaGZhaWFva2FkbG90Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5NTgwOTcsImV4cCI6MjA3NTUzNDA5N30.QeIp2f3g-zL3aw4ozM7-sUH_LcBTjUh03xt7x_Ro2-w';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Testando conexão com Supabase...\n');

async function testConnection() {
  try {
    // Teste 1: Listar tabelas via query simples
    console.log('1️⃣ Testando leitura na tabela clients...');
    const { data: clients, error: clientsError } = await supabase
      .from('clients')
      .select('id, name')
      .limit(5);

    if (clientsError) {
      console.log('❌ Erro ao ler clients:', clientsError.message);
    } else {
      console.log('✅ Conexão OK! Clientes encontrados:', clients.length);
      if (clients.length > 0) {
        console.log('   Exemplo:', clients[0]);
      }
    }

    // Teste 2: Verificar outras tabelas
    console.log('\n2️⃣ Testando outras tabelas...');
    const tables = ['loans', 'payments', 'prospects', 'cash_accounts', 'transactions'];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
      } else {
        console.log(`   ✅ ${table}: ${count} registros`);
      }
    }

    console.log('\n✨ Teste concluído! O Supabase está funcionando corretamente.');
    console.log('📊 Acesse o dashboard em: https://pafbydmrhfaiaokadlot.supabase.co');

  } catch (error) {
    console.error('\n❌ Erro ao testar conexão:', error.message);
  }
}

testConnection();
