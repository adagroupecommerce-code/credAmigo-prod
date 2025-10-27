import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, Filter, Download, Plus, ArrowUpRight, ArrowDownLeft, BarChart3 } from 'lucide-react';
import { getCashFlowProjection, CashFlowProjection } from '../services/financial';

const CashFlowManagement = () => {
  const [projections, setProjections] = useState<CashFlowProjection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCashFlowProjection();
  }, []);

  const loadCashFlowProjection = async () => {
    setLoading(true);
    try {
      const data = await getCashFlowProjection();
      setProjections(data);
      console.log('✅ Projeção de fluxo de caixa carregada:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar projeção:', error);
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getTotalInflows = () => {
    return projections.reduce((sum, p) => sum + p.expectedRevenue, 0);
  };

  const getTotalOutflows = () => {
    return projections.reduce((sum, p) => sum + p.expectedExpenses, 0);
  };

  const getNetFlow = () => {
    return projections.reduce((sum, p) => sum + p.netFlow, 0);
  };

  const getProjectedBalance = () => {
    return getNetFlow();
  };

  const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: {
    title: string;
    value: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'red' | 'yellow';
    trend?: 'up' | 'down';
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
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ml-1">{trend === 'up' ? 'Crescimento' : 'Declínio'}</span>
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
        <div className="text-gray-500">Carregando projeção de fluxo de caixa...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Projeção de Fluxo de Caixa</h2>
          <p className="text-gray-600 mt-1">Projeção dos próximos 6 meses</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={20} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Entradas"
          value={formatCurrency(getTotalInflows())}
          icon={ArrowUpRight}
          color="green"
          trend="up"
        />
        <StatCard
          title="Total Saídas"
          value={formatCurrency(getTotalOutflows())}
          icon={ArrowDownLeft}
          color="red"
          trend="down"
        />
        <StatCard
          title="Fluxo Líquido"
          value={formatCurrency(getNetFlow())}
          icon={TrendingUp}
          color={getNetFlow() >= 0 ? 'green' : 'red'}
          trend={getNetFlow() >= 0 ? 'up' : 'down'}
        />
        <StatCard
          title="Saldo Projetado"
          value={formatCurrency(getProjectedBalance())}
          icon={BarChart3}
          color="blue"
        />
      </div>

      {/* Projeção de Fluxo de Caixa */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projeção Mensal</h3>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Mês</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Receitas Esperadas</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Receitas Pagas</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Despesas</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Fluxo Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {projections.map((projection, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {projection.monthName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatCurrency(projection.expectedRevenue)}
                  </td>
                  <td className="px-4 py-3 text-green-600 font-medium">
                    {formatCurrency(projection.paidRevenue)}
                  </td>
                  <td className="px-4 py-3 text-red-600 font-medium">
                    {formatCurrency(projection.expectedExpenses)}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`font-bold ${
                      projection.netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {projection.netFlow >= 0 ? '+' : ''}{formatCurrency(projection.netFlow)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-4 py-3 font-bold text-gray-900">TOTAIS</td>
                <td className="px-4 py-3 font-bold text-gray-600">
                  {formatCurrency(getTotalInflows())}
                </td>
                <td className="px-4 py-3 font-bold text-green-600">
                  {formatCurrency(projections.reduce((sum, p) => sum + p.paidRevenue, 0))}
                </td>
                <td className="px-4 py-3 font-bold text-red-600">
                  {formatCurrency(getTotalOutflows())}
                </td>
                <td className="px-4 py-3">
                  <div className={`font-bold ${
                    getNetFlow() >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {getNetFlow() >= 0 ? '+' : ''}{formatCurrency(getNetFlow())}
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Resumo de Fluxo */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo de Fluxo de Caixa</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatCurrency(getTotalInflows())}
            </div>
            <div className="text-sm text-gray-600">Total de Entradas Esperadas</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600 mb-2">
              {formatCurrency(getTotalOutflows())}
            </div>
            <div className="text-sm text-gray-600">Total de Despesas</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className={`text-2xl font-bold mb-2 ${getNetFlow() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(getNetFlow())}
            </div>
            <div className="text-sm text-gray-600">Fluxo Líquido Projetado</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashFlowManagement;