import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Calendar, Filter, RefreshCw } from 'lucide-react';
import { getDashboardKpis } from '../services/dashboard';
import { DateFilter, getDateRange, formatDateRange } from '../utils/dateRange';

const Dashboard = () => {
  const [dateFilter, setDateFilter] = React.useState<DateFilter>('month');
  const [data, setData] = React.useState({
    totalLoans: 0,
    activeLoans: 0,
    totalLent: 0,
    totalReceived: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    monthlyRevenue: 0,
    defaultRate: 0,
    completedLoans: 0,
    totalClients: 0,
    defaultedLoans: 0
  });
  const [loading, setLoading] = React.useState(true);

  // Reload data whenever filter changes - REAL DATA FROM SUPABASE
  React.useEffect(() => {
    loadDashboardData();
  }, [dateFilter]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log(`📊 Fetching dashboard data for period: ${dateFilter}`);

      // Fetch filtered data from Supabase
      const kpis = await getDashboardKpis(dateFilter);

      console.log('✅ Dashboard KPIs loaded:', kpis);
      setData(kpis);
    } catch (error) {
      console.error('❌ Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    trendValue,
    color = 'blue'
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    trend?: 'up' | 'down';
    trendValue?: string;
    color?: 'blue' | 'green' | 'red' | 'yellow';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && trendValue && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ml-1">{trendValue}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-blue-600" size={32} />
          <div className="text-gray-600">Carregando dados do período...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Visão geral do negócio</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-600" size={20} />
            <h3 className="text-base font-medium text-gray-900">Período</h3>
            <span className="text-sm text-blue-600 font-medium">
              {formatDateRange(dateFilter)}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              { value: 'day' as DateFilter, label: 'Hoje' },
              { value: 'week' as DateFilter, label: 'Semana' },
              { value: 'month' as DateFilter, label: 'Mês' },
              { value: 'quarter' as DateFilter, label: 'Trimestre' },
              { value: 'semester' as DateFilter, label: 'Semestre' },
              { value: 'year' as DateFilter, label: 'Ano' },
              { value: 'all' as DateFilter, label: 'Todos' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDateFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Period Info */}
          <div className="flex items-center gap-2 text-sm text-gray-600 pt-2 border-t border-gray-200">
            <Calendar size={16} />
            <span>
              Exibindo <strong>{data.totalLoans}</strong> empréstimos do período
            </span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Emprestado"
          value={formatCurrency(data.totalLent)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(data.totalReceived)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Empréstimos Ativos"
          value={data.activeLoans.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Valor Pendente"
          value={formatCurrency(data.pendingAmount)}
          icon={Clock}
          color="yellow"
        />
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita do Período</h3>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(data.monthlyRevenue)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Total recebido no período selecionado
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Inadimplência</h3>
          <div className="text-3xl font-bold text-red-600">
            {data.defaultRate.toFixed(1)}%
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {data.defaultedLoans} empréstimo(s) inadimplente(s)
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Empréstimos Concluídos</h3>
          <div className="text-3xl font-bold text-blue-600">
            {data.completedLoans}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Empréstimos quitados no período
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Total de Clientes</h3>
          <div className="text-3xl font-bold text-purple-600">
            {data.totalClients}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Clientes cadastrados no sistema
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Capital Emprestado</p>
            <p className="text-xl font-bold text-blue-800">
              {formatCurrency(data.totalLent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Recebido</p>
            <p className="text-xl font-bold text-green-800">
              {formatCurrency(data.totalReceived)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Lucro</p>
            <p className="text-xl font-bold text-purple-800">
              {formatCurrency(data.totalReceived - data.totalLent)}
            </p>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-900 font-medium">
              Dados em tempo real do Supabase
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Os valores exibidos refletem os dados reais do banco de dados para o período selecionado.
              Altere o filtro acima para visualizar diferentes períodos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
