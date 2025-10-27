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
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Demonstração do Resultado do Exercício
        </h2>

        <div className="space-y-4">
          {/* RECEITAS */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">RECEITAS OPERACIONAIS</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Principal de Empréstimos</span>
                <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.loans)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Juros de Empréstimos</span>
                <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.interest)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Taxas e Tarifas</span>
                <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.fees)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">RECEITA TOTAL</span>
                <span className="font-bold text-green-600 text-lg">{formatCurrency(dreData.revenue.total)}</span>
              </div>
            </div>
          </div>

          {/* DESPESAS */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">(-) DESPESAS OPERACIONAIS</h3>
            <div className="space-y-2 ml-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Despesas Operacionais</span>
                <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.operational)})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Marketing</span>
                <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.marketing)})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Pessoal</span>
                <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.salaries)})</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-semibold text-gray-900">TOTAL DESPESAS</span>
                <span className="font-bold text-red-600">({formatCurrency(dreData.expenses.total)})</span>
              </div>
            </div>
          </div>

          {/* LUCRO BRUTO */}
          <div className="border-b border-gray-200 pb-4">
            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg">
              <span className="font-bold text-blue-900 text-lg">LUCRO BRUTO</span>
              <span className="font-bold text-blue-800 text-xl">{formatCurrency(dreData.grossProfit)}</span>
            </div>
          </div>

          {/* LUCRO LÍQUIDO */}
          <div className="pt-4">
            <div className="flex justify-between items-center bg-green-50 p-4 rounded-lg">
              <span className="font-bold text-green-900 text-xl">LUCRO LÍQUIDO</span>
              <div className="text-right">
                <span className={`font-bold text-xl ${dreData.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatCurrency(dreData.netProfit)}
                </span>
                <div className="text-sm text-green-600">
                  Margem: {formatPercentage(dreData.profitMargin)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DREManagement;
