import { supabase } from '@/lib/supabase';

/**
 * Serviço Financeiro - Dados reais do Supabase
 * Calcula métricas baseadas em empréstimos, parcelas e transações
 */

export interface FinancialOverview {
  totalBalance: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  totalLoansValue: number;
  totalReceivable: number;
  totalReceived: number;
  cashInBank: number;
}

export interface CashFlowProjection {
  month: string;
  monthName: string;
  expectedRevenue: number;
  paidRevenue: number;
  expectedExpenses: number;
  netFlow: number;
}

export interface DREData {
  revenue: {
    loans: number;
    interest: number;
    fees: number;
    total: number;
  };
  expenses: {
    operational: number;
    marketing: number;
    salaries: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

/**
 * Busca visão geral financeira
 */
export async function getFinancialOverview(): Promise<FinancialOverview> {
  try {
    console.log('🔄 [FINANCEIRO] Carregando dados financeiros...');

    // 1. Buscar saldo total das contas
    const { data: accounts } = await supabase
      .from('cash_accounts')
      .select('balance')
      .eq('is_active', true);

    const totalBalance = accounts?.reduce((sum, acc) => sum + Number(acc.balance), 0) || 0;
    console.log(`💰 [FINANCEIRO] Saldo total: R$ ${totalBalance.toFixed(2)}`);

    // 2. Buscar empréstimos ativos
    const { data: loans } = await supabase
      .from('loans')
      .select('amount, total_amount, remaining_amount')
      .eq('status', 'active');

    const totalLoansValue = loans?.reduce((sum, loan) => sum + Number(loan.amount), 0) || 0;
    console.log(`💳 [FINANCEIRO] Total emprestado: R$ ${totalLoansValue.toFixed(2)} (${loans?.length || 0} empréstimos)`);

    // 3. Buscar parcelas pagas no mês atual
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount, interest_amount')
      .eq('status', 'paid')
      .gte('payment_date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('payment_date', lastDayOfMonth.toISOString().split('T')[0]);

    const monthlyRevenue = paidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 4. Buscar despesas do mês
    const { data: expenses } = await supabase
      .from('transactions')
      .select('amount')
      .eq('type', 'expense')
      .gte('date', firstDayOfMonth.toISOString().split('T')[0])
      .lte('date', lastDayOfMonth.toISOString().split('T')[0]);

    const monthlyExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    // 5. Buscar total a receber (parcelas pendentes)
    const { data: pendingPayments } = await supabase
      .from('payments')
      .select('amount')
      .in('status', ['pending', 'overdue']);

    const totalReceivable = pendingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    // 6. Buscar total recebido (todas parcelas pagas)
    const { data: allPaidPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'paid');

    const totalReceived = allPaidPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

    const netProfit = monthlyRevenue - monthlyExpenses;

    console.log(`📊 [FINANCEIRO] Receita mensal: R$ ${monthlyRevenue.toFixed(2)}`);
    console.log(`📊 [FINANCEIRO] A receber: R$ ${totalReceivable.toFixed(2)}`);
    console.log(`📊 [FINANCEIRO] Total recebido: R$ ${totalReceived.toFixed(2)}`);
    console.log(`✅ [FINANCEIRO] Dados carregados com sucesso!`);

    return {
      totalBalance,
      monthlyRevenue,
      monthlyExpenses,
      netProfit,
      totalLoansValue,
      totalReceivable,
      totalReceived,
      cashInBank: totalBalance
    };
  } catch (error) {
    console.error('❌ [FINANCEIRO] Erro ao buscar visão geral financeira:', error);
    throw error;
  }
}

/**
 * Busca projeção de fluxo de caixa (próximos 6 meses)
 */
export async function getCashFlowProjection(months: number = 6): Promise<CashFlowProjection[]> {
  try {
    console.log(`🔄 [FLUXO SERVICE] Gerando projeção para ${months} meses...`);
    const projections: CashFlowProjection[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
      const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      const monthStr = month.toISOString().split('T')[0].substring(0, 7);
      const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const monthName = `${monthNames[month.getMonth()]}/${month.getFullYear().toString().substr(2)}`;

      // Receitas esperadas (parcelas com vencimento no mês)
      const { data: expectedPayments } = await supabase
        .from('payments')
        .select('amount, status')
        .gte('due_date', firstDay.toISOString().split('T')[0])
        .lte('due_date', lastDay.toISOString().split('T')[0]);

      const expectedRevenue = expectedPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const paidRevenue = expectedPayments?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Despesas esperadas
      const { data: expectedExpenses } = await supabase
        .from('transactions')
        .select('amount')
        .eq('type', 'expense')
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      const expensesTotal = expectedExpenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      projections.push({
        month: monthStr,
        monthName,
        expectedRevenue,
        paidRevenue,
        expectedExpenses: expensesTotal,
        netFlow: expectedRevenue - expensesTotal
      });
    }

    console.log(`✅ [FLUXO SERVICE] ${projections.length} meses projetados`);
    return projections;
  } catch (error) {
    console.error('Erro ao buscar projeção de fluxo de caixa:', error);
    throw error;
  }
}

/**
 * Busca DRE (Demonstração do Resultado do Exercício)
 */
export async function getDREData(year?: number, month?: number): Promise<DREData> {
  try {
    const targetYear = year || new Date().getFullYear();
    const targetMonth = month !== undefined ? month : new Date().getMonth();

    const firstDay = new Date(targetYear, targetMonth, 1);
    const lastDay = new Date(targetYear, targetMonth + 1, 0);

    // Receitas - Parcelas pagas no período
    const { data: paidPayments } = await supabase
      .from('payments')
      .select('amount, principal_amount, interest_amount')
      .eq('status', 'paid')
      .gte('payment_date', firstDay.toISOString().split('T')[0])
      .lte('payment_date', lastDay.toISOString().split('T')[0]);

    const loansRevenue = paidPayments?.reduce((sum, p) => sum + Number(p.principal_amount || 0), 0) || 0;
    const interestRevenue = paidPayments?.reduce((sum, p) => sum + Number(p.interest_amount || 0), 0) || 0;
    const feesRevenue = 0; // Pode adicionar lógica de taxas aqui

    const totalRevenue = loansRevenue + interestRevenue + feesRevenue;

    // Despesas - Transações de despesa no período
    const { data: expenseTransactions } = await supabase
      .from('transactions')
      .select('amount, category')
      .eq('type', 'expense')
      .gte('date', firstDay.toISOString().split('T')[0])
      .lte('date', lastDay.toISOString().split('T')[0]);

    const operationalExpenses = expenseTransactions?.filter(e =>
      ['Operacional', 'Administrativa', 'Tecnologia'].includes(e.category)
    ).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const marketingExpenses = expenseTransactions?.filter(e =>
      e.category === 'Marketing'
    ).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const salariesExpenses = expenseTransactions?.filter(e =>
      e.category === 'Pessoal'
    ).reduce((sum, e) => sum + Number(e.amount), 0) || 0;

    const totalExpenses = operationalExpenses + marketingExpenses + salariesExpenses;

    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit; // Pode adicionar impostos aqui
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      revenue: {
        loans: loansRevenue,
        interest: interestRevenue,
        fees: feesRevenue,
        total: totalRevenue
      },
      expenses: {
        operational: operationalExpenses,
        marketing: marketingExpenses,
        salaries: salariesExpenses,
        total: totalExpenses
      },
      grossProfit,
      netProfit,
      profitMargin
    };
  } catch (error) {
    console.error('Erro ao buscar DRE:', error);
    throw error;
  }
}

/**
 * Busca contas de caixa/banco
 */
export async function getCashAccounts() {
  const { data, error } = await supabase
    .from('cash_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Busca transações
 */
export async function getTransactions(filters?: {
  accountId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}) {
  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.accountId) {
    query = query.eq('account_id', filters.accountId);
  }

  if (filters?.type) {
    query = query.eq('type', filters.type);
  }

  if (filters?.startDate) {
    query = query.gte('date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('date', filters.endDate);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}
