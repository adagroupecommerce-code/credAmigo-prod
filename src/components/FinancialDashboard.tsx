import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Calendar, Plus, Filter, Download, Eye } from 'lucide-react';
import CashBankManagement from './CashBankManagement';
import CashFlowManagement from './CashFlowManagement';
import DREManagement from './DREManagement';
import { mockCashAccounts, mockDREReport } from '../data/financialData';

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const totalBalance = mockCashAccounts.reduce((sum, account) => sum + account.balance, 0);
  const dreData = mockDREReport;

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

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Saldo Total"
          value={formatCurrency(totalBalance)}
          change="+12.5% este mês"
          changeType="positive"
          icon={DollarSign}
          color="blue"
        />
        <StatCard
          title="Receita Mensal"
          value={formatCurrency(dreData.revenue.total)}
          change="+8.3% vs mês anterior"
          changeType="positive"
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(dreData.netProfit)}
          change="+15.2% vs mês anterior"
          changeType="positive"
          icon={PieChart}
          color="purple"
        />
        <StatCard
          title="Margem Líquida"
          value={`${dreData.margins.net.toFixed(1)}%`}
          change="+2.1pp este mês"
          changeType="positive"
          icon={BarChart3}
          color="yellow"
        />
      </div>

      {/* Resumo por Conta */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Resumo das Contas</h2>
          <button className="flex items-center px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
            <Eye size={16} className="mr-2" />
            Ver Detalhes
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockCashAccounts.map((account) => (
            <div key={account.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-gray-900">{account.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  account.type === 'cash' ? 'bg-green-100 text-green-800' :
                  account.type === 'bank' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {account.type === 'cash' ? 'Caixa' : 
                   account.type === 'bank' ? 'Banco' : 'Investimento'}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(account.balance)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {((account.balance / totalBalance) * 100).toFixed(1)}% do total
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DRE Resumida */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">DRE Resumida - {dreData.period}</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Receita Bruta</span>
              <span className="font-medium text-green-600">{formatCurrency(dreData.revenue.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">(-) Custos</span>
              <span className="font-medium text-red-600">({formatCurrency(dreData.costs.total)})</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-900 font-medium">Lucro Bruto</span>
              <span className="font-bold text-blue-600">{formatCurrency(dreData.grossProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">(-) Despesas Operacionais</span>
              <span className="font-medium text-red-600">({formatCurrency(dreData.expenses.total)})</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2">
              <span className="text-gray-900 font-medium">Lucro Operacional</span>
              <span className="font-bold text-purple-600">{formatCurrency(dreData.operationalProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Resultado Financeiro</span>
              <span className={`font-medium ${dreData.financialResult.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(dreData.financialResult.net)}
              </span>
            </div>
            <div className="flex justify-between border-t-2 border-gray-300 pt-3">
              <span className="text-gray-900 font-bold">Lucro Líquido</span>
              <span className="font-bold text-green-600 text-lg">{formatCurrency(dreData.netProfit)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Indicadores de Performance</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Margem Bruta</span>
                <span className="font-medium">{dreData.margins.gross.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dreData.margins.gross}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Margem Operacional</span>
                <span className="font-medium">{dreData.margins.operational.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dreData.margins.operational}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Margem Líquida</span>
                <span className="font-medium">{dreData.margins.net.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dreData.margins.net}%` }}
                ></div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-3">Composição da Receita</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Juros de Empréstimos</span>
                  <span className="font-medium">{((dreData.revenue.loanInterest / dreData.revenue.total) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Taxas e Tarifas</span>
                  <span className="font-medium">{((dreData.revenue.fees / dreData.revenue.total) * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Outras Receitas</span>
                  <span className="font-medium">{((dreData.revenue.other / dreData.revenue.total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

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