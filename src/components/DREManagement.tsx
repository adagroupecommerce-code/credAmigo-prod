import React, { useState, useEffect } from 'react';
import { PieChart, TrendingUp, TrendingDown, Calendar, Download, Filter, BarChart3, DollarSign } from 'lucide-react';
import { getDREData, DREData } from '../services/financial';

const DREManagement = () => {
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDREData();
  }, [selectedYear, selectedMonth]);

  const loadDREData = async () => {
    setLoading(true);
    try {
      const data = await getDREData(selectedYear, selectedMonth);
      setDreData(data);
      console.log('✅ DRE carregado:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar DRE:', error);
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

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getPeriodText = (period: string) => {
    const [year, month] = period.split('-');
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  const StatCard = ({ 
    title, 
    value, 
    percentage, 
    icon: Icon, 
    color = 'blue',
    trend 
  }: {
    title: string;
    value: string;
    percentage?: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
    trend?: 'up' | 'down';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {percentage && (
              <p className="text-sm text-gray-500 mt-1">{percentage} da receita</p>
            )}
            {trend && (
              <div className={`flex items-center mt-2 text-sm ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ml-1">{trend === 'up' ? '+12.5%' : '-8.3%'} vs mês anterior</span>
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
        <div className="text-gray-500">Carregando DRE...</div>
      </div>
    );
  }

  if (!dreData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500">Erro ao carregar DRE</div>
      </div>
    );
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">DRE - Demonstração do Resultado</h2>
          <p className="text-gray-600 mt-1">{monthNames[selectedMonth]} {selectedYear}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {monthNames.map((name, idx) => (
              <option key={idx} value={idx}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={20} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Receita Total"
          value={formatCurrency(dreData.revenue.total)}
          percentage={formatPercentage(100)}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Despesas Totais"
          value={formatCurrency(dreData.expenses.total)}
          icon={TrendingDown}
          color="red"
        />
        <StatCard
          title="Lucro Bruto"
          value={formatCurrency(dreData.grossProfit)}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(dreData.netProfit)}
          percentage={formatPercentage(dreData.profitMargin)}
          icon={PieChart}
          color={dreData.netProfit >= 0 ? 'green' : 'red'}
          trend="up"
        />
      </div>

      {/* DRE Completa */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Demonstração do Resultado do Exercício - {getPeriodText(selectedPeriod)}
          </h2>
          {compareMode && (
            <div className="text-sm text-gray-500">
              Comparando com {getPeriodText(comparePeriod)}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* RECEITAS */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">RECEITAS OPERACIONAIS</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Juros de Empréstimos</span>
                <div className="text-right">
                  <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.loanInterest)}</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.revenue.loanInterest / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Taxas e Tarifas</span>
                <div className="text-right">
                  <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.fees)}</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.revenue.fees / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Outras Receitas</span>
                <div className="text-right">
                  <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.other)}</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.revenue.other / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">RECEITA BRUTA TOTAL</span>
                <div className="text-right">
                  <span className="font-bold text-green-600 text-lg">{formatCurrency(dreData.revenue.total)}</span>
                  <div className="text-xs text-gray-500">100.0%</div>
                </div>
              </div>
            </div>
          </div>

          {/* CUSTOS */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">(-) CUSTOS OPERACIONAIS</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Provisão Devedores Duvidosos</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.costs.defaultLosses)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.costs.defaultLosses / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Custos Operacionais</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.costs.operationalCosts)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.costs.operationalCosts / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">TOTAL CUSTOS</span>
                <div className="text-right">
                  <span className="font-bold text-red-600">({formatCurrency(dreData.costs.total)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.costs.total / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LUCRO BRUTO */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
              <span className="font-bold text-blue-900 text-lg">LUCRO BRUTO</span>
              <div className="text-right">
                <span className="font-bold text-blue-800 text-xl">{formatCurrency(dreData.grossProfit)}</span>
                <div className="text-sm text-blue-600">
                  {formatPercentage(dreData.margins.gross)}
                </div>
              </div>
            </div>
          </div>

          {/* DESPESAS OPERACIONAIS */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">(-) DESPESAS OPERACIONAIS</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Despesas Administrativas</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.administrative)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.expenses.administrative / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Marketing e Publicidade</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.marketing)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.expenses.marketing / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Pessoal e Encargos</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.personnel)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.expenses.personnel / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Outras Despesas</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.other)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.expenses.other / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">TOTAL DESPESAS OPERACIONAIS</span>
                <div className="text-right">
                  <span className="font-bold text-red-600">({formatCurrency(dreData.expenses.total)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.expenses.total / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LUCRO OPERACIONAL */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-center bg-purple-50 p-4 rounded-lg">
              <span className="font-bold text-purple-900 text-lg">LUCRO OPERACIONAL</span>
              <div className="text-right">
                <span className="font-bold text-purple-800 text-xl">{formatCurrency(dreData.operationalProfit)}</span>
                <div className="text-sm text-purple-600">
                  {formatPercentage(dreData.margins.operational)}
                </div>
              </div>
            </div>
          </div>

          {/* RESULTADO FINANCEIRO */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">RESULTADO FINANCEIRO</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Receitas Financeiras</span>
                <div className="text-right">
                  <span className="font-medium text-green-600">{formatCurrency(dreData.financialResult.financialIncome)}</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.financialResult.financialIncome / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">(-) Despesas Financeiras</span>
                <div className="text-right">
                  <span className="font-medium text-red-600">({formatCurrency(dreData.financialResult.financialExpenses)})</span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((dreData.financialResult.financialExpenses / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">RESULTADO FINANCEIRO LÍQUIDO</span>
                <div className="text-right">
                  <span className={`font-bold ${dreData.financialResult.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {dreData.financialResult.net >= 0 ? '' : '('}{formatCurrency(Math.abs(dreData.financialResult.net))}{dreData.financialResult.net >= 0 ? '' : ')'}
                  </span>
                  <div className="text-xs text-gray-500">
                    {formatPercentage((Math.abs(dreData.financialResult.net) / dreData.revenue.total) * 100)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* LUCRO LÍQUIDO */}
          <div className="bg-green-50 p-6 rounded-lg border-2 border-green-200">
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-900 text-xl">LUCRO LÍQUIDO DO PERÍODO</span>
              <div className="text-right">
                <span className="font-bold text-green-800 text-2xl">{formatCurrency(dreData.netProfit)}</span>
                <div className="text-lg text-green-600">
                  {formatPercentage(dreData.margins.net)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Análise de Margens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução das Margens</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Margem Bruta</span>
                <span className="font-medium text-blue-600">{formatPercentage(dreData.margins.gross)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${dreData.margins.gross}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Margem Operacional</span>
                <span className="font-medium text-purple-600">{formatPercentage(dreData.margins.operational)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${dreData.margins.operational}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Margem Líquida</span>
                <span className="font-medium text-green-600">{formatPercentage(dreData.margins.net)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${dreData.margins.net}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Composição da Receita</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-green-700 font-medium">Juros de Empréstimos</span>
              <div className="text-right">
                <div className="text-green-800 font-bold">{formatCurrency(dreData.revenue.loanInterest)}</div>
                <div className="text-xs text-green-600">
                  {formatPercentage((dreData.revenue.loanInterest / dreData.revenue.total) * 100)}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-700 font-medium">Taxas e Tarifas</span>
              <div className="text-right">
                <div className="text-blue-800 font-bold">{formatCurrency(dreData.revenue.fees)}</div>
                <div className="text-xs text-blue-600">
                  {formatPercentage((dreData.revenue.fees / dreData.revenue.total) * 100)}
                </div>
              </div>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-purple-700 font-medium">Outras Receitas</span>
              <div className="text-right">
                <div className="text-purple-800 font-bold">{formatCurrency(dreData.revenue.other)}</div>
                <div className="text-xs text-purple-600">
                  {formatPercentage((dreData.revenue.other / dreData.revenue.total) * 100)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicadores de Performance */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Indicadores de Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {formatPercentage((dreData.revenue.loanInterest / dreData.revenue.total) * 100)}
            </div>
            <div className="text-sm text-gray-600">Concentração em Juros</div>
            <div className="text-xs text-gray-500 mt-1">
              Principal fonte de receita
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatPercentage((dreData.costs.total / dreData.revenue.total) * 100)}
            </div>
            <div className="text-sm text-gray-600">Custo sobre Receita</div>
            <div className="text-xs text-gray-500 mt-1">
              Eficiência operacional
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {formatPercentage((dreData.expenses.total / dreData.revenue.total) * 100)}
            </div>
            <div className="text-sm text-gray-600">Despesas sobre Receita</div>
            <div className="text-xs text-gray-500 mt-1">
              Controle de gastos
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {(dreData.revenue.total / dreData.expenses.total).toFixed(1)}x
            </div>
            <div className="text-sm text-gray-600">Cobertura de Despesas</div>
            <div className="text-xs text-gray-500 mt-1">
              Receita vs despesas
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DREManagement;