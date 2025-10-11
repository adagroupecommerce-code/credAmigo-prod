import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calculator, DollarSign, Calendar, User, Save, Plus, Minus, CreditCard as Edit, Check, X, Zap, Clock, Phone, CheckCircle, AlertTriangle } from 'lucide-react';
import { Loan, Client } from '../types';
import { calculateSAC, getInstallmentPlan } from '../utils/sacCalculator';

interface LoanFormProps {
  clients: Client[];
  loan?: Loan;
  onSave: (loan: Partial<Loan>) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const LoanForm: React.FC<LoanFormProps> = ({ clients, loan, onSave, onCancel, isEditing = false }) => {
  const [formData, setFormData] = useState({
    clientId: loan?.clientId || '',
    amount: loan?.amount || 0,
    interestRate: loan?.interestRate || 25,
    installments: loan?.installments || 1,
    startDate: loan?.startDate || new Date().toISOString().split('T')[0],
    notes: loan?.notes || ''
  });

  const [calculationMode, setCalculationMode] = useState<'automatic' | 'manual'>('automatic');
  const [quickMode, setQuickMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<{
    amount: number;
    modality: 'avista' | '2x' | '3x' | '4x';
  } | null>(null);
  const [customInstallments, setCustomInstallments] = useState<Array<{
    installmentNumber: number;
    dueDate: string;
    principalAmount: number;
    interestAmount: number;
    totalAmount: number;
    remainingBalance: number;
  }>>([]);

  // Presets predefinidos conforme regras de negócio
  const LOAN_PRESETS = {
    500: {
      avista: { total: 625, installments: [{ value: 625, days: 30 }] },
      '2x': { installments: [{ value: 375, days: 30 }, { value: 315, days: 60 }] },
    },
    750: {
      avista: { total: 930, installments: [{ value: 930, days: 30 }] },
      '2x': { installments: [{ value: 560, days: 30 }, { value: 470, days: 60 }] },
      '3x': { installments: [{ value: 440, days: 30 }, { value: 375, days: 60 }, { value: 315, days: 90 }] },
    },
    1000: {
      avista: { total: 1250, installments: [{ value: 1250, days: 30 }] },
      '2x': { installments: [{ value: 750, days: 30 }, { value: 625, days: 60 }] },
      '3x': { installments: [{ value: 580, days: 30 }, { value: 500, days: 60 }, { value: 420, days: 90 }] },
      '4x': { installments: [{ value: 500, days: 30 }, { value: 440, days: 60 }, { value: 375, days: 90 }, { value: 315, days: 120 }] },
    }
  };

  const getAvailablePresets = () => {
    return Object.keys(LOAN_PRESETS).map(amount => ({
      amount: Number(amount),
      modalities: Object.keys(LOAN_PRESETS[amount as keyof typeof LOAN_PRESETS])
    }));
  };

  const applyPreset = (amount: number, modality: string) => {
    const preset = LOAN_PRESETS[amount as keyof typeof LOAN_PRESETS];
    if (!preset || !preset[modality as keyof typeof preset]) return;

    const presetData = preset[modality as keyof typeof preset];
    const startDate = new Date(formData.startDate);
    const installments: any[] = [];

    if (modality === 'avista') {
      // À vista - 30 dias
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + 30);
      
      installments.push({
        installmentNumber: 1,
        dueDate: dueDate.toISOString().split('T')[0],
        principalAmount: amount,
        interestAmount: presetData.total - amount,
        totalAmount: presetData.total,
        remainingBalance: 0
      });
    } else {
      // Parcelado
      const capital = amount / presetData.installments.length;
      
      presetData.installments.forEach((inst: any, index: number) => {
        const dueDate = new Date(startDate);
        dueDate.setDate(dueDate.getDate() + inst.days);
        
        installments.push({
          installmentNumber: index + 1,
          dueDate: dueDate.toISOString().split('T')[0],
          principalAmount: capital,
          interestAmount: inst.value - capital,
          totalAmount: inst.value,
          remainingBalance: amount - (capital * (index + 1))
        });
      });
    }

    setCustomInstallments(installments);
    setFormData(prev => ({
      ...prev,
      amount: amount,
      installments: installments.length,
      installmentValue: installments[0]?.totalAmount || 0,
      totalAmount: installments.reduce((sum, inst) => sum + inst.totalAmount, 0),
      interestRate: modality === 'avista' ? 25 : 
        ((installments.reduce((sum, inst) => sum + inst.interestAmount, 0) / amount) * 100)
    }));
    
    setCalculationMode('manual');
    setSelectedPreset({ amount, modality: modality as any });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateInstallments = () => {
    if (!formData.amount || !formData.installments || !formData.interestRate) return [];

    const monthlyRate = formData.interestRate / 100;
    const startDate = new Date(formData.startDate);
    let remainingBalance = formData.amount;
    const installments = [];

    for (let i = 1; i <= formData.installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestAmount = remainingBalance * monthlyRate;
      const installmentValue = (formData.amount * monthlyRate * Math.pow(1 + monthlyRate, formData.installments)) / 
                              (Math.pow(1 + monthlyRate, formData.installments) - 1);
      const principalAmount = installmentValue - interestAmount;
      remainingBalance -= principalAmount;

      installments.push({
        installmentNumber: i,
        dueDate: dueDate.toISOString().split('T')[0],
        principalAmount: Math.max(0, principalAmount),
        interestAmount: Math.max(0, interestAmount),
        totalAmount: installmentValue,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }

    return installments;
  };

  const automaticInstallments = calculateInstallments();

  useEffect(() => {
    if (calculationMode === 'automatic') {
      setCustomInstallments(automaticInstallments);
    }
  }, [formData.amount, formData.installments, formData.interestRate, formData.startDate, calculationMode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditInstallment = (index: number, field: string, value: number) => {
    const newInstallments = [...customInstallments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    
    // Recalcular total se capital ou juros mudaram
    if (field === 'principalAmount' || field === 'interestAmount') {
      newInstallments[index].totalAmount = 
        newInstallments[index].principalAmount + newInstallments[index].interestAmount;
    }
    
    // Recalcular saldos remanescentes
    let balance = formData.amount;
    for (let i = 0; i < newInstallments.length; i++) {
      balance -= newInstallments[i].principalAmount;
      newInstallments[i].remainingBalance = Math.max(0, balance);
    }
    
    setCustomInstallments(newInstallments);
  };

  const handleEditDate = (index: number, date: string) => {
    const newInstallments = [...customInstallments];
    newInstallments[index] = { ...newInstallments[index], dueDate: date };
    setCustomInstallments(newInstallments);
  };

  const addInstallment = () => {
    const lastInstallment = customInstallments[customInstallments.length - 1];
    const newDueDate = new Date(lastInstallment?.dueDate || formData.startDate);
    newDueDate.setMonth(newDueDate.getMonth() + 1);

    const newInstallment = {
      installmentNumber: customInstallments.length + 1,
      dueDate: newDueDate.toISOString().split('T')[0],
      principalAmount: 0,
      interestAmount: 0,
      totalAmount: 0,
      remainingBalance: 0
    };

    setCustomInstallments([...customInstallments, newInstallment]);
    setFormData(prev => ({ ...prev, installments: prev.installments + 1 }));
  };

  const removeInstallment = (index: number) => {
    if (customInstallments.length <= 1) return;
    
    const newInstallments = customInstallments.filter((_, i) => i !== index);
    // Renumerar parcelas
    const renumbered = newInstallments.map((inst, i) => ({
      ...inst,
      installmentNumber: i + 1
    }));
    
    setCustomInstallments(renumbered);
    setFormData(prev => ({ ...prev, installments: prev.installments - 1 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.clientId || !formData.amount || formData.installments <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const installmentsToUse = customInstallments.length > 0 ? customInstallments : automaticInstallments;
    const totalAmount = installmentsToUse.reduce((sum, inst) => sum + inst.totalAmount, 0);
    const installmentValue = installmentsToUse.length > 0 ? installmentsToUse[0].totalAmount : 0;
    
    const endDate = installmentsToUse.length > 0 
      ? installmentsToUse[installmentsToUse.length - 1].dueDate
      : new Date(formData.startDate).toISOString().split('T')[0];

    // Calcular taxa de juros efetiva baseada nas parcelas definidas
    const totalInterest = totalAmount - formData.amount;
    const effectiveRate = formData.amount > 0 ? (totalInterest / formData.amount) / formData.installments * 100 : formData.interestRate;

    const loanData = {
      ...formData,
      installmentValue,
      totalAmount,
      endDate,
      interestRate: effectiveRate,
      remainingAmount: totalAmount,
      paidInstallments: loan?.paidInstallments || 0,
      status: loan?.status || 'active' as const,
      installmentPlan: installmentsToUse // Preservar o plano de parcelas exato
    };

    onSave(loanData);
  };

  const selectedClient = clients.find(c => c.id === formData.clientId);

  // Memoizar a busca do cliente para otimizar performance
  const memoizedSelectedClient = React.useMemo(() => {
    return clients.find(c => c.id === formData.clientId);
  }, [clients, formData.clientId]);

  // Função para calcular limite sugerido de forma mais robusta
  const calculateSuggestedLimit = (client: Client) => {
    let baseLimit = client.creditScore * 20; // Fórmula base
    
    // Ajustes baseados no histórico
    if (client.defaultedLoans > 0) {
      baseLimit *= 0.5; // Reduzir 50% se há inadimplência
    }
    
    if (client.activeLoans > 2) {
      baseLimit *= 0.7; // Reduzir 30% se muitos empréstimos ativos
    }
    
    if (client.latePayments > client.onTimePayments) {
      baseLimit *= 0.6; // Reduzir 40% se mais atrasos que pagamentos em dia
    }
    
    return Math.max(baseLimit, 500); // Limite mínimo de R$ 500
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors touch-manipulation"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </button>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          {isEditing ? 'Editar Empréstimo' : 'Novo Empréstimo'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Básicos */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Dados do Empréstimo</h2>
          
          {/* Atalhos Predefinidos */}
          <div className="mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="text-blue-600" size={20} />
              <h3 className="text-sm sm:text-base font-medium text-blue-900">Atalhos Rápidos - Condições Predefinidas</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {getAvailablePresets().map(({ amount, modalities }) => (
                <div key={amount} className="space-y-2">
                  <div className="text-sm sm:text-base font-medium text-gray-900 text-center">
                    {formatCurrency(amount)}
                  </div>
                  <div className="space-y-1">
                    {modalities.map((modality) => {
                      const preset = LOAN_PRESETS[amount as keyof typeof LOAN_PRESETS][modality as keyof typeof LOAN_PRESETS[typeof amount]];
                      const isSelected = selectedPreset?.amount === amount && selectedPreset?.modality === modality;
                      
                      return (
                        <button
                          key={modality}
                          type="button"
                          onClick={() => applyPreset(amount, modality)}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50 hover:border-blue-300'
                          } touch-manipulation`}
                        >
                          {modality === 'avista' ? (
                            <div>
                              <div className="flex items-center justify-center gap-1 text-xs sm:text-sm">
                                <Clock size={12} />
                                À Vista (30d)
                              </div>
                              <div className="text-xs opacity-90 truncate">
                                {formatCurrency(preset.total || preset.installments[0].value)}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <div className="text-xs sm:text-sm">{modality.toUpperCase()}</div>
                              <div className="text-xs opacity-90 truncate">
                                {preset.installments.map((inst: any) => formatCurrency(inst.value)).join(' + ')}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs sm:text-xs text-blue-700">
              💡 Clique em um atalho para aplicar automaticamente as condições predefinidas
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Cliente <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleInputChange('clientId', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                required
              >
                <option value="">Selecione um cliente</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} - Score: {client.creditScore}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Valor do Empréstimo <span className="text-red-500">*</span>
              </label>
              
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="Ex: 10000"
                min="100"
                required
              />
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                Valor: {formatCurrency(formData.amount)}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Taxa de Juros (% ao mês) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.interestRate}
                onChange={(e) => handleInputChange('interestRate', Number(e.target.value))}
                step="0.1"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="Ex: 2.5"
                min="0"
                required
              />
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                Taxa anual: {(((1 + formData.interestRate/100) ** 12 - 1) * 100).toFixed(2)}%
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Número de Parcelas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={formData.installments}
                onChange={(e) => handleInputChange('installments', Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="Ex: 12"
                min="1"
                max="60"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                Data de Início <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                required
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:col-span-2">
                Observações
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation sm:col-span-2"
                placeholder="Observações sobre o empréstimo..."
              />
            </div>
          </div>
        </div>

        {/* Plano de Parcelas Unificado */}
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Plano de Parcelas</h2>
            {selectedPreset && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <Zap size={14} />
                Preset: {formatCurrency(selectedPreset.amount)} - {selectedPreset.modality.toUpperCase()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex bg-gray-100 rounded-lg p-1 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCalculationMode('automatic')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    calculationMode === 'automatic'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } flex-1 sm:flex-none touch-manipulation`}
                >
                  <Calculator size={16} className="mr-2 inline" />
                  Automático
                </button>
                <button
                  type="button"
                  onClick={() => setCalculationMode('manual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    calculationMode === 'manual'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  } flex-1 sm:flex-none touch-manipulation`}
                >
                  <Edit size={16} className="mr-2 inline" />
                  Personalizado
                </button>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPreset(null);
                    setCalculationMode('automatic');
                  }}
                  className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm touch-manipulation"
                >
                  Modo Livre
                </button>
                {calculationMode === 'manual' && (
                  <button
                    type="button"
                    onClick={addInstallment}
                    className="flex-1 sm:flex-none flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm touch-manipulation"
                  >
                    <Plus size={16} className="mr-1" />
                    <span className="hidden sm:inline">Adicionar</span>
                    <span className="sm:hidden">+</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {calculationMode === 'automatic' && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Calculator size={16} />
                <span className="font-medium">Cálculo Automático (Sistema SAC)</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Parcelas calculadas automaticamente com amortização constante e juros decrescentes
              </p>
            </div>
          )}

          {selectedPreset && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Zap size={16} />
                <span className="font-medium">Condições Predefinidas Aplicadas</span>
              </div>
              <p className="text-sm text-green-700 mt-1">
                Usando preset {formatCurrency(selectedPreset.amount)} - {selectedPreset.modality.toUpperCase()}. 
                Você pode editar individualmente cada parcela ou usar o "Modo Livre" para cálculo automático.
              </p>
            </div>
          )}

          {calculationMode === 'manual' && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <Edit size={16} />
                <span className="font-medium">Modo Personalizado</span>
              </div>
              <p className="text-sm text-orange-700 mt-1">
                Edite individualmente cada parcela: capital, juros e vencimento
              </p>
            </div>
          )}

          {/* Tabela Unificada de Parcelas */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[60px]">Parcela</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">Vencimento</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Capital</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Juros</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Total</th>
                  <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Saldo</th>
                  {calculationMode === 'manual' && (
                    <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[60px]">Ações</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {(calculationMode === 'automatic' ? automaticInstallments : customInstallments).map((installment, index) => {
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-sm font-medium">#{installment.installmentNumber}</td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {calculationMode === 'manual' ? (
                          <input
                            type="date"
                            value={installment.dueDate}
                            onChange={(e) => handleEditDate(index, e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm text-gray-900">
                            {new Date(installment.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {calculationMode === 'manual' ? (
                          <input
                            type="number"
                            value={installment.principalAmount}
                            onChange={(e) => handleEditInstallment(index, 'principalAmount', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-medium text-blue-600">
                            {formatCurrency(installment.principalAmount)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        {calculationMode === 'manual' ? (
                          <input
                            type="number"
                            value={installment.interestAmount}
                            onChange={(e) => handleEditInstallment(index, 'interestAmount', Number(e.target.value))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs sm:text-sm touch-manipulation"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-xs sm:text-sm font-medium text-orange-600">
                            {formatCurrency(installment.interestAmount)}
                          </span>
                        )}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className="text-xs sm:text-sm font-bold text-gray-900">
                          {formatCurrency(installment.totalAmount)}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <span className="text-xs sm:text-sm text-gray-600">
                          {formatCurrency(installment.remainingBalance)}
                        </span>
                      </td>
                      {calculationMode === 'manual' && (
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          {customInstallments.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeInstallment(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded touch-manipulation"
                              title="Remover parcela"
                            >
                              <Minus size={14} />
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                <tr>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-gray-900" colSpan={2}>TOTAIS</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className="text-xs sm:text-sm font-bold text-blue-600">
                      {formatCurrency((calculationMode === 'automatic' ? automaticInstallments : customInstallments)
                        .reduce((sum, inst) => sum + inst.principalAmount, 0))}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className="text-xs sm:text-sm font-bold text-orange-600">
                      {formatCurrency((calculationMode === 'automatic' ? automaticInstallments : customInstallments)
                        .reduce((sum, inst) => sum + inst.interestAmount, 0))}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3">
                    <span className="text-xs sm:text-sm font-bold text-gray-900">
                      {formatCurrency((calculationMode === 'automatic' ? automaticInstallments : customInstallments)
                        .reduce((sum, inst) => sum + inst.totalAmount, 0))}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3"></td>
                  {calculationMode === 'manual' && <td className="px-2 sm:px-4 py-2 sm:py-3"></td>}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Resumo Financeiro */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-xs sm:text-sm text-blue-600 font-medium">Capital Total</div>
              <div className="text-lg sm:text-xl font-bold text-blue-800">
                {formatCurrency(formData.amount)}
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-xs sm:text-sm text-orange-600 font-medium">Juros Total</div>
              <div className="text-lg sm:text-xl font-bold text-orange-800">
                {formatCurrency((calculationMode === 'automatic' ? automaticInstallments : customInstallments)
                  .reduce((sum, inst) => sum + inst.interestAmount, 0))}
              </div>
            </div>
            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-xs sm:text-sm text-green-600 font-medium">Total a Receber</div>
              <div className="text-lg sm:text-xl font-bold text-green-800">
                {formatCurrency((calculationMode === 'automatic' ? automaticInstallments : customInstallments)
                  .reduce((sum, inst) => sum + inst.totalAmount, 0))}
              </div>
            </div>
          </div>
        </div>

        {/* Informações do Cliente Selecionado */}
        {memoizedSelectedClient && (
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User size={20} />
              Informações do Cliente Selecionado
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Dados Pessoais */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 border-b border-gray-200 pb-2">Dados Pessoais</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">Nome:</span>
                    <div className="text-sm sm:text-base font-medium text-gray-900">{memoizedSelectedClient.name}</div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">CPF:</span>
                    <div className="text-sm sm:text-base font-medium text-gray-900">{memoizedSelectedClient.cpf}</div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">Telefone:</span>
                    <div className="text-sm sm:text-base font-medium text-gray-900 flex items-center gap-2">
                      <Phone size={16} />
                      {memoizedSelectedClient.phone}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">Email:</span>
                    <div className="text-sm sm:text-base font-medium text-gray-900">{memoizedSelectedClient.email || 'Não informado'}</div>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">Status:</span>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs sm:text-sm font-medium border ml-2 ${
                      memoizedSelectedClient.status === 'active' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : memoizedSelectedClient.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800 border-gray-200'
                        : 'bg-red-100 text-red-800 border-red-200'
                    }`}>
                      {memoizedSelectedClient.status === 'active' ? 'Ativo' : 
                       memoizedSelectedClient.status === 'inactive' ? 'Inativo' : 'Impedido'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm text-gray-600">Cliente desde:</span>
                    <div className="text-sm sm:text-base font-medium text-gray-900">
                      {new Date(memoizedSelectedClient.createdAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Score e Histórico Financeiro */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 border-b border-gray-200 pb-2">Análise de Crédito</h3>
                <div className="space-y-3">
                  <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm text-blue-600 font-medium">Score de Crédito</span>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          memoizedSelectedClient.creditScore >= 700 ? 'text-green-600' :
                          memoizedSelectedClient.creditScore >= 500 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {memoizedSelectedClient.creditScore}
                        </div>
                        <div className="text-xs sm:text-xs text-blue-600">
                          {memoizedSelectedClient.creditScore >= 850 ? 'Excelente Pagador' :
                           memoizedSelectedClient.creditScore >= 700 ? 'Bom Pagador' :
                           memoizedSelectedClient.creditScore >= 500 ? 'Risco Médio' :
                           memoizedSelectedClient.creditScore >= 300 ? 'Risco Alto' : 'Risco Muito Alto'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                      <div className="text-base sm:text-lg font-bold text-green-600">{memoizedSelectedClient.completedLoans}</div>
                      <div className="text-xs text-green-700">Quitados</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                      <div className="text-base sm:text-lg font-bold text-blue-600">{memoizedSelectedClient.activeLoans}</div>
                      <div className="text-xs text-blue-700">Ativos</div>
                    </div>
                  </div>
                  
                  {memoizedSelectedClient.defaultedLoans > 0 && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Atenção: {memoizedSelectedClient.defaultedLoans} empréstimo(s) inadimplente(s)</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Total Emprestado:</span>
                      <span className="text-xs sm:text-sm font-medium">{formatCurrency(memoizedSelectedClient.totalBorrowed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Total Pago:</span>
                      <span className="text-xs sm:text-sm font-medium text-green-600">{formatCurrency(memoizedSelectedClient.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Pagamentos em Dia:</span>
                      <span className="text-xs sm:text-sm font-medium text-green-600">{memoizedSelectedClient.onTimePayments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs sm:text-sm text-gray-600">Pagamentos Atrasados:</span>
                      <span className="text-xs sm:text-sm font-medium text-red-600">{memoizedSelectedClient.latePayments}</span>
                    </div>
                    {memoizedSelectedClient.averagePaymentDelay > 0 && (
                      <div className="flex justify-between">
                        <span className="text-xs sm:text-sm text-gray-600">Atraso Médio:</span>
                        <span className="text-xs sm:text-sm font-medium text-orange-600">{memoizedSelectedClient.averagePaymentDelay} dias</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recomendações e Alertas */}
              <div className="space-y-4">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 border-b border-gray-200 pb-2">Recomendações</h3>
                <div className="space-y-3">
                  {/* Recomendação baseada no score */}
                  {memoizedSelectedClient.creditScore >= 700 ? (
                    <div className="p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800 mb-1">
                        <CheckCircle size={16} />
                        <span className="text-xs sm:text-sm font-medium">Cliente Recomendado</span>
                      </div>
                      <p className="text-green-700 text-xs sm:text-sm">
                        Excelente histórico de pagamentos. Baixo risco para novos empréstimos.
                      </p>
                    </div>
                  ) : memoizedSelectedClient.creditScore >= 500 ? (
                    <div className="p-2 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 mb-1">
                        <AlertTriangle size={16} />
                        <span className="text-xs sm:text-sm font-medium">Análise Cuidadosa</span>
                      </div>
                      <p className="text-yellow-700 text-xs sm:text-sm">
                        Score médio. Considere condições mais conservadoras ou garantias adicionais.
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 mb-1">
                        <AlertTriangle size={16} />
                        <span className="text-xs sm:text-sm font-medium">Alto Risco</span>
                      </div>
                      <p className="text-red-700 text-xs sm:text-sm">
                        Score baixo. Recomenda-se análise detalhada antes da aprovação.
                      </p>
                    </div>
                  )}

                  {/* Alerta para empréstimos ativos */}
                  {memoizedSelectedClient.activeLoans > 0 && (
                    <div className="p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center gap-2 text-orange-800 mb-1">
                        <Clock size={16} />
                        <span className="text-xs sm:text-sm font-medium">Empréstimos Ativos</span>
                      </div>
                      <p className="text-orange-700 text-xs sm:text-sm">
                        Cliente possui {memoizedSelectedClient.activeLoans} empréstimo(s) ativo(s). 
                        Verifique a capacidade de pagamento antes de aprovar novo crédito.
                      </p>
                    </div>
                  )}

                  {/* Alerta para atrasos */}
                  {memoizedSelectedClient.latePayments > 0 && (
                    <div className="p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-800 mb-1">
                        <AlertTriangle size={16} />
                        <span className="text-xs sm:text-sm font-medium">Histórico de Atrasos</span>
                      </div>
                      <p className="text-red-700 text-xs sm:text-sm">
                        Cliente tem {memoizedSelectedClient.latePayments} pagamento(s) em atraso no histórico.
                        Atraso médio: {memoizedSelectedClient.averagePaymentDelay} dias.
                      </p>
                    </div>
                  )}

                  {/* Recomendação de valor máximo */}
                  <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800 mb-1">
                      <DollarSign size={16} />
                      <span className="text-xs sm:text-sm font-medium">Limite Sugerido</span>
                    </div>
                    <div className="text-blue-700 text-xs sm:text-sm">
                      <div className="font-medium">{formatCurrency(calculateSuggestedLimit(memoizedSelectedClient))}</div>
                      <div className="text-xs text-blue-600 mt-1">
                        Cálculo ajustado por histórico e risco
                      </div>
                    </div>
                  </div>

                  {/* Cliente desde */}
                  <div className="text-xs sm:text-sm text-gray-600">
                    <span className="font-medium">Cliente desde:</span> 
                    <div className="sm:inline sm:ml-1 block">{new Date(memoizedSelectedClient.createdAt).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {Math.floor((new Date().getTime() - new Date(memoizedSelectedClient.createdAt).getTime()) / (1000 * 60 * 60 * 24))} dias de relacionamento
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
          >
            <Save size={20} className="mr-2" />
            {isEditing ? 'Atualizar Empréstimo' : 'Criar Empréstimo'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default LoanForm;