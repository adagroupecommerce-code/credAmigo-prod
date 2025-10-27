import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, RefreshCw, Download, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';
import { getCashFlowProjection, CashFlowProjection } from '../services/financial';

type PeriodFilter = 'current' | '3months' | '6months' | '12months';

const CashFlowManagement = () => {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(true);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('6months');

  useEffect(() => {
    console.log('🎬 [FLUXO] Fluxo de Caixa inicializado');

    // Auto-refresh a cada 15 segundos
    const interval = setInterval(() => {
      console.log('⏰ [FLUXO] Auto-refresh (15s)');
      loadCashFlowProjection();
    }, 15000);

    // Escutar eventos
    const handleLoanCreated = () => {
      console.log('🔔 [FLUXO] Evento loan-created recebido');
      setTimeout(() => loadCashFlowProjection(), 2000);
    };

    const handlePaymentMade = () => {
      console.log('🔔 [FLUXO] Evento payment-made recebido');
      setTimeout(() => loadCashFlowProjection(), 1000);
    };

    window.addEventListener('loan-created', handleLoanCreated);
    window.addEventListener('payment-made', handlePaymentMade);

    return () => {
      clearInterval(interval);
      window.removeEventListener('loan-created', handleLoanCreated);
      window.removeEventListener('payment-made', handlePaymentMade);
    };
  }, []);

  useEffect(() => {
    console.log(`🔄 [FLUXO] Filtro alterado para: ${periodFilter}`);
    loadCashFlowProjection();
  }, [periodFilter]);

  const loadCashFlowProjection = async () => {
    try {
      console.log('🔄 [FLUXO] Carregando projeção de fluxo de caixa...');
      console.log(`📌 [FLUXO] Filtro atual: ${periodFilter}`);

      const months = periodFilter === 'current' ? 1 :
                     periodFilter === '3months' ? 3 :
                     periodFilter === '6months' ? 6 : 12;

      console.log(`📊 [FLUXO] Solicitando ${months} meses ao serviço`);
      const data = await getCashFlowProjection(months);

      console.log(`✅ [FLUXO] ${data.length} meses carregados com sucesso`);
      console.log(`📋 [FLUXO] Dados recebidos:`, data.map(d => d.monthName).join(', '));

      setProjections(data);
    } catch (error) {
      console.error('❌ [FLUXO] Erro ao carregar projeção:', error);
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

  // Separar mês atual e futuros
  const currentMonth = projections[0];
  const futureMonths = projections.slice(1);

  const getTotalInflows = () => {
    return projections.reduce((sum, p) => sum + p.expectedRevenue, 0);
  };

  const getTotalOutflows = () => {
    return projections.reduce((sum, p) => sum + p.expectedExpenses, 0);
  };

  const getNetFlow = () => {
    return projections.reduce((sum, p) => sum + p.netFlow, 0);
  };

  const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    subtitle
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'red' | 'yellow';
    subtitle?: string;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
        <div className="text-gray-500">Carregando projeção de fluxo de caixa...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h2>
          <p className="text-sm text-gray-600 mt-1">
            Projeção de entradas e saídas • {projections.length} {projections.length === 1 ? 'mês' : 'meses'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filtro de Período */}
          <select
            value={periodFilter}
            onChange={(e) => {
              const newValue = e.target.value as PeriodFilter;
              console.log(`🎯 [FLUXO] Usuário selecionou: ${newValue}`);
              setPeriodFilter(newValue);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="current">Mês Atual</option>
            <option value="3months">Próximos 3 Meses</option>
            <option value="6months">Próximos 6 Meses</option>
            <option value="12months">Próximos 12 Meses</option>
          </select>

          <button
            onClick={() => loadCashFlowProjection()}
            className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={20} className="mr-2" />
            Atualizar
          </button>

          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={20} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Entradas"
          value={formatCurrency(getTotalInflows())}
          icon={ArrowDownLeft}
          color="green"
          subtitle="Receitas esperadas"
        />
        <StatCard
          title="Total Saídas"
          value={formatCurrency(getTotalOutflows())}
          icon={ArrowUpRight}
          color="red"
          subtitle="Despesas projetadas"
        />
        <StatCard
          title="Fluxo Líquido"
          value={formatCurrency(getNetFlow())}
          icon={TrendingUp}
          color={getNetFlow() >= 0 ? 'green' : 'red'}
          subtitle="Entradas - Saídas"
        />
        <StatCard
          title="Saldo Projetado"
          value={formatCurrency(getNetFlow())}
          icon={DollarSign}
          color="blue"
          subtitle="Expectativa de caixa"
        />
      </div>

      {/* Mês Atual (Período Presente) */}
      {currentMonth && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-semibold text-lg">📅 Período Atual</h3>
                <p className="text-blue-100 text-sm">{currentMonth.monthName}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Fluxo do Mês</p>
                <p className={`text-2xl font-bold ${currentMonth.netFlow >= 0 ? 'text-white' : 'text-red-200'}`}>
                  {formatCurrency(currentMonth.netFlow)}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Entradas Esperadas</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(currentMonth.expectedRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Parcelas a vencer este mês</p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Já Recebido</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentMonth.paidRevenue)}</p>
              <p className="text-xs text-gray-500 mt-1">Parcelas pagas</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${currentMonth.expectedRevenue > 0 ? (currentMonth.paidRevenue / currentMonth.expectedRevenue * 100) : 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {currentMonth.expectedRevenue > 0
                  ? `${((currentMonth.paidRevenue / currentMonth.expectedRevenue) * 100).toFixed(0)}% recebido`
                  : '0% recebido'}
              </p>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Saídas Esperadas</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(currentMonth.expectedExpenses)}</p>
              <p className="text-xs text-gray-500 mt-1">Despesas programadas</p>
            </div>
          </div>
        </div>
      )}

      {/* Projeções Futuras */}
      {futureMonths.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <h3 className="text-white font-semibold text-lg">🔮 Projeções Futuras</h3>
            <p className="text-gray-300 text-sm">Próximos {futureMonths.length} meses</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mês
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entradas Esperadas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Saídas Esperadas
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fluxo Líquido
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {futureMonths.map((projection) => (
                  <tr key={projection.month} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar className="text-gray-400 mr-2" size={16} />
                        <span className="text-sm font-medium text-gray-900">{projection.monthName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(projection.expectedRevenue)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-sm font-semibold text-red-600">
                        {formatCurrency(projection.expectedExpenses)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm font-bold ${
                        projection.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(projection.netFlow)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {projection.netFlow >= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <TrendingUp size={12} className="mr-1" />
                          Positivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <TrendingDown size={12} className="mr-1" />
                          Negativo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico Visual Simplificado */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Visualização do Fluxo</h3>
        <div className="space-y-3">
          {projections.map((projection) => {
            const maxValue = Math.max(...projections.map(p => Math.max(p.expectedRevenue, p.expectedExpenses)));
            const revenueWidth = maxValue > 0 ? (projection.expectedRevenue / maxValue) * 100 : 0;
            const expenseWidth = maxValue > 0 ? (projection.expectedExpenses / maxValue) * 100 : 0;

            return (
              <div key={projection.month} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{projection.monthName}</span>
                  <span className={`text-sm font-bold ${projection.netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(projection.netFlow)}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <div className="w-20 text-xs text-gray-500">Entradas:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-green-500 h-6 rounded-full flex items-center justify-end px-2"
                        style={{ width: `${revenueWidth}%`, minWidth: revenueWidth > 0 ? '60px' : '0' }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {formatCurrency(projection.expectedRevenue)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="w-20 text-xs text-gray-500">Saídas:</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                      <div
                        className="bg-red-500 h-6 rounded-full flex items-center justify-end px-2"
                        style={{ width: `${expenseWidth}%`, minWidth: expenseWidth > 0 ? '60px' : '0' }}
                      >
                        <span className="text-xs font-semibold text-white">
                          {formatCurrency(projection.expectedExpenses)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CashFlowManagement;
