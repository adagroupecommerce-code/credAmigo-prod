import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, Plus, Filter, Download, Eye, CheckCircle } from 'lucide-react';
import CashBankManagement from './CashBankManagement';
import CashFlowManagement from './CashFlowManagement';
import DREManagement from './DREManagement';
import { getFinancialOverview, FinancialOverview } from '../services/financial';

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [financialData, setFinancialData] = useState<FinancialOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    setLoading(true);
    try {
      const data = await getFinancialOverview();
      setFinancialData(data);
      console.log('✅ Dados financeiros carregados:', data);
    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error);
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

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'cash-bank', label: 'Caixa/Banco', icon: DollarSign },
    { id: 'cash-flow', label: 'Fluxo de Caixa', icon: TrendingUp },
    { id: 'dre', label: 'DRE', icon: PieChart }
  ];

  const StatCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    color = 'blue' 
  }: {
    title: string;
    value: string;
    change?: string;
    changeType?: 'positive' | 'negative';
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200'
    };

    return (
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {change && (
              <div className={`flex items-center mt-2 text-sm ${
                changeType === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {changeType === 'positive' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                <span className="ml-1">{change}</span>
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

  const renderOverview = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando dados financeiros...</div>
        </div>
      );
    }

    if (!financialData) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Erro ao carregar dados financeiros</div>
        </div>
      );
    }

    const profitMargin = financialData.monthlyRevenue > 0
      ? ((financialData.netProfit / financialData.monthlyRevenue) * 100)
      : 0;

    return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo em Caixa/Banco"
          value={formatCurrency(financialData.totalBalance)}
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(financialData.monthlyRevenue)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(financialData.netProfit)}
          changeType={financialData.netProfit >= 0 ? 'positive' : 'negative'}
          icon={PieChart}
          color={financialData.netProfit >= 0 ? 'purple' : 'red'}
        />
        <StatCard
          title="Margem Líquida"
          value={`${profitMargin.toFixed(1)}%`}
          icon={BarChart3}
          color="yellow"
        />
      </div>

      {/* Métricas de Empréstimos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Emprestado</h3>
            <DollarSign size={20} className="text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.totalLoansValue)}</p>
          <p className="text-xs text-gray-500 mt-2">Capital em empréstimos ativos</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">A Receber</h3>
            <TrendingUp size={20} className="text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.totalReceivable)}</p>
          <p className="text-xs text-gray-500 mt-2">Parcelas pendentes e vencidas</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Recebido (Total)</h3>
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(financialData.totalReceived)}</p>
          <p className="text-xs text-gray-500 mt-2">Total de parcelas pagas</p>
        </div>
      </div>

      {/* Resumo Financeiro Mensal */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo Financeiro - Mês Atual</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Receita (Parcelas Pagas)</span>
              <span className="font-semibold text-green-600">{formatCurrency(financialData.monthlyRevenue)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Despesas Operacionais</span>
              <span className="font-semibold text-red-600">{formatCurrency(financialData.monthlyExpenses)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
              <span className="text-gray-900 font-bold text-lg">Lucro Líquido</span>
              <span className={`font-bold text-lg ${financialData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialData.netProfit)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Margem de Lucro</span>
              <span className="font-semibold text-blue-600">{profitMargin.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Total em Caixa/Banco</span>
              <span className="font-semibold text-blue-600">{formatCurrency(financialData.cashInBank)}</span>
            </div>
            <div className="py-2 mt-2">
              <p className="text-xs text-gray-500">
                {financialData.netProfit >= 0
                  ? '✅ Resultado positivo no mês'
                  : '⚠️ Resultado negativo - revisar despesas'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'cash-bank':
        return <CashBankManagement />;
      case 'cash-flow':
        return <CashFlowManagement />;
      case 'dre':
        return <DREManagement />;
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Módulo Financeiro</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors touch-manipulation">
            <Download size={20} className="mr-2" />
            Exportar
          </button>
          <button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation">
            <Plus size={20} className="mr-2" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap touch-manipulation
                    ${isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon size={14} className="mr-1 sm:mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 sm:p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FinancialDashboard;