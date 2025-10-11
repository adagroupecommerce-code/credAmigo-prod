import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, AlertTriangle, Calendar, Filter } from 'lucide-react';
import { getDashboardMetrics } from '../utils/paymentUtils';
import { getDashboardKpis } from '@/services/dashboard';

const Dashboard = () => {
  const [dateFilter, setDateFilter] = React.useState<'all' | 'today' | 'week' | 'month' | 'quarter' | 'semester' | 'year' | 'custom'>('month');
  const [customDateRange, setCustomDateRange] = React.useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = React.useState({
    totalLoans: 0,
    activeLoans: 0,
    totalLent: 0,
    totalReceived: 0,
    pendingAmount: 0,
    overdueAmount: 0,
    monthlyRevenue: 0,
    defaultRate: 0
  });
  const [filteredData, setFilteredData] = React.useState(data);
  const [loading, setLoading] = React.useState(true);

  const paymentMetrics = getDashboardMetrics();

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const kpis = await getDashboardKpis();
      setData(kpis);
      setFilteredData(kpis);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDateFilterText = (filter: string) => {
    switch (filter) {
      case 'today': return 'Hoje';
      case 'week': return 'Última Semana';
      case 'month': return 'Último Mês';
      case 'quarter': return 'Último Trimestre';
      case 'semester': return 'Último Semestre';
      case 'year': return 'Último Ano';
      case 'custom': return 'Período Personalizado';
      default: return 'Todos os Períodos';
    }
  };

  const applyDateFilter = () => {
    // Em produção, aqui você faria a consulta filtrada no banco de dados
    // Por enquanto, vamos simular diferentes valores baseados no filtro
    let multiplier = 1;
    
    switch (dateFilter) {
      case 'today':
        multiplier = 0.03; // ~1/30 do mês
        break;
      case 'week':
        multiplier = 0.25; // ~1/4 do mês
        break;
      case 'month':
        multiplier = 1;
        break;
      case 'quarter':
        multiplier = 3;
        break;
      case 'semester':
        multiplier = 6;
        break;
      case 'year':
        multiplier = 12;
        break;
      case 'custom':
        // Calcular diferença em dias entre as datas
        const start = new Date(customDateRange.start);
        const end = new Date(customDateRange.end);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        multiplier = diffDays / 30; // Proporção baseada em 30 dias
        break;
      default:
        multiplier = 1;
    }

    setFilteredData({
      totalLoans: Math.round(data.totalLoans * multiplier),
      activeLoans: Math.round(data.activeLoans * multiplier),
      totalLent: Math.round(data.totalLent * multiplier),
      totalReceived: Math.round(data.totalReceived * multiplier),
      pendingAmount: Math.round(data.pendingAmount * multiplier),
      overdueAmount: Math.round(data.overdueAmount * multiplier),
      monthlyRevenue: Math.round(data.monthlyRevenue * multiplier),
      defaultRate: data.defaultRate
    });
  };

  React.useEffect(() => {
    if (!loading) {
      applyDateFilter();
    }
  }, [dateFilter, customDateRange, data, loading]);

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
        <div className="text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Filtros de Data */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-600" size={20} />
            <h3 className="text-sm sm:text-base font-medium text-gray-900">Filtros de Período</h3>
          </div>
          
          <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-0">
            Período: {getDateFilterText(dateFilter)}
            {dateFilter === 'custom' && (
              <span className="ml-2">
                ({new Date(customDateRange.start).toLocaleDateString('pt-BR')} - {new Date(customDateRange.end).toLocaleDateString('pt-BR')})
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
            {[
              { value: 'today', label: 'Hoje' },
              { value: 'week', label: 'Semana' },
              { value: 'month', label: 'Mês' },
              { value: 'quarter', label: 'Trimestre' },
              { value: 'semester', label: 'Semestre' },
              { value: 'year', label: 'Ano' },
              { value: 'all', label: 'Todos' }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDateFilter(value as any)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  dateFilter === value
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } touch-manipulation flex-1 sm:flex-none text-center`}
              >
                {label}
              </button>
            ))}
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                dateFilter === 'custom'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              } touch-manipulation flex-1 sm:flex-none text-center`}
            >
              <Calendar size={16} className="mr-1 inline" />
              Personalizado
            </button>
          </div>
          
          {dateFilter === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center w-full sm:w-auto">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <span className="text-gray-500 text-center sm:text-left">até</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          )}
        </div>
        
        {/* Indicador do Filtro Ativo */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
            <div className="flex flex-wrap items-center gap-1 sm:gap-2 text-blue-600">
              <Calendar size={16} />
              <span className="font-medium">Período Ativo:</span>
              <span>{getDateFilterText(dateFilter)}</span>
              {dateFilter === 'custom' && (
                <span className="text-gray-600">
                  ({new Date(customDateRange.start).toLocaleDateString('pt-BR')} - {new Date(customDateRange.end).toLocaleDateString('pt-BR')})
                </span>
              )}
            </div>
            <div className="text-gray-500 text-xs sm:text-sm">
              {dateFilter !== 'all' && (
                <span>Dados filtrados • </span>
              )}
              {filteredData.totalLoans} empréstimos no período
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Emprestado"
          value={formatCurrency(filteredData.totalLent)}
          icon={DollarSign}
          trend="up"
          trendValue={dateFilter === 'month' ? "+15% este mês" : `+15% no período`}
          color="blue"
        />
        <StatCard
          title="Total Recebido"
          value={formatCurrency(filteredData.totalReceived)}
          icon={TrendingUp}
          trend="up"
          trendValue={dateFilter === 'month' ? "+8% este mês" : `+8% no período`}
          color="green"
        />
        <StatCard
          title="Empréstimos Ativos"
          value={filteredData.activeLoans.toString()}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Valor Pendente"
          value={formatCurrency(filteredData.pendingAmount)}
          icon={Clock}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Retorno de Capital</h3>
          <div className="text-3xl font-bold text-blue-600">
            {formatCurrency(paymentMetrics.totalCapitalReturned)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Capital retornado através de {paymentMetrics.paymentCount} pagamentos
          </p>
          <div className="mt-3 text-xs text-blue-600">
            Média por pagamento: {formatCurrency(paymentMetrics.totalCapitalReturned / (paymentMetrics.paymentCount || 1))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Juros Recebidos</h3>
          <div className="text-3xl font-bold text-orange-600">
            {formatCurrency(paymentMetrics.totalInterestEarned)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Lucro através de juros recebidos
          </p>
          <div className="mt-3 text-xs text-orange-600">
            Margem média: {paymentMetrics.totalCapitalReturned > 0 ? ((paymentMetrics.totalInterestEarned / paymentMetrics.totalCapitalReturned) * 100).toFixed(1) : 0}%
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Receita Mensal</h3>
          <div className="text-3xl font-bold text-green-600">
            {formatCurrency(data.monthlyRevenue)}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Baseado nos pagamentos do mês atual
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Taxa de Inadimplência</h3>
          <div className="flex items-center">
            <div className="text-3xl font-bold text-green-600">
              {(data.defaultRate * 100).toFixed(1)}%
            </div>
            {data.defaultRate === 0 && (
              <div className="ml-2 text-green-600">
                <TrendingUp size={20} />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {data.defaultRate === 0 ? 'Excelente performance!' : 'Requer atenção'}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-600">Capital Emprestado</span>
              <DollarSign className="text-blue-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-blue-800 mt-1">
              {formatCurrency(filteredData.totalLent)}
            </div>
            <div className="text-xs text-blue-600 mt-1">
              Retornado: {formatCurrency(paymentMetrics.totalCapitalReturned)}
            </div>
          </div>
          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-orange-600">Juros Projetados vs Recebidos</span>
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-orange-800 mt-1">
              {formatCurrency(paymentMetrics.totalInterestEarned)}
            </div>
            <div className="text-xs text-orange-600 mt-1">
              Projetado: {formatCurrency(filteredData.totalReceived - filteredData.totalLent)}
            </div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-green-600">Total Recebido</span>
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <div className="text-2xl font-bold text-green-800 mt-1">
              {formatCurrency(paymentMetrics.totalPaymentsReceived)}
            </div>
            <div className="text-xs text-green-600 mt-1">
              Capital + Juros efetivamente recebidos
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-yellow-600">Valor a Receber</span>
            <Clock className="text-yellow-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-yellow-800 mt-1">
            {formatCurrency(filteredData.pendingAmount)}
          </div>
          <div className="text-xs text-yellow-600 mt-1">
            Capital + Juros pendentes
          </div>
        </div>
        
        {/* Métricas Específicas do Período */}
        <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-600">Receita do Período</span>
            <TrendingUp className="text-purple-600" size={20} />
          </div>
          <div className="text-2xl font-bold text-purple-800 mt-1">
            {formatCurrency(filteredData.monthlyRevenue)}
          </div>
          <div className="text-xs text-purple-600 mt-1">
            Baseado no período selecionado
          </div>
        </div>
        
        {/* Análise Comparativa */}
        {dateFilter !== 'all' && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Análise do Período</span>
              <Calendar className="text-gray-600" size={20} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Empréstimos:</span>
                <div className="font-bold text-blue-600">{filteredData.totalLoans}</div>
              </div>
              <div>
                <span className="text-gray-600">Taxa Retorno:</span>
                <div className="font-bold text-green-600">
                  {filteredData.totalLent > 0 ? ((filteredData.totalReceived / filteredData.totalLent - 1) * 100).toFixed(1) : 0}%
                </div>
              </div>
              <div>
                <span className="text-gray-600">Inadimplência:</span>
                <div className="font-bold text-red-600">{(filteredData.defaultRate * 100).toFixed(1)}%</div>
              </div>
              <div>
                <span className="text-gray-600">Margem:</span>
                <div className="font-bold text-purple-600">
                  {formatCurrency(filteredData.totalReceived - filteredData.totalLent)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;