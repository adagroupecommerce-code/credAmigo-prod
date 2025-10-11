import React from 'react';
import { ArrowLeft, Calendar, DollarSign, User, Clock, CheckCircle, XCircle, AlertTriangle, TrendingUp, Calculator, CreditCard as Edit, Save, X, CreditCard } from 'lucide-react';
import { Loan } from '../types';
import { mockClients } from '../data/mockData';
import { generatePaymentsFromLoan, calculateCapitalInterestMetrics, processPayment, validatePaymentData, PaymentData, PaymentProcessResult } from '../utils/paymentUtils';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

interface LoanDetailsProps {
  loan: Loan;
  onBack: () => void;
  onUpdateLoan?: (updatedLoan: Loan) => void;
}

const LoanDetails: React.FC<LoanDetailsProps> = ({ loan, onBack, onUpdateLoan }) => {
  const { canEdit } = useRBAC();
  
  const [editingInstallment, setEditingInstallment] = React.useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = React.useState<number | null>(null);
  const [editedInstallments, setEditedInstallments] = React.useState<any[]>([]);
  const [paymentData, setPaymentData] = React.useState<PaymentData>({
    paymentDate: new Date().toISOString().split('T')[0],
    principalPaid: 0,
    interestPaid: 0,
    totalPaid: 0,
    penaltyPaid: 0
  });
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [paymentValidation, setPaymentValidation] = React.useState<{ isValid: boolean; errors: string[] }>({ isValid: true, errors: [] });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // Gerar dados consolidados das parcelas (fonte única de verdade)
  const consolidatedPayments = React.useMemo(() => {
    return generatePaymentsFromLoan(loan);
  }, [loan]);

  const client = mockClients.find(c => c.id === loan.clientId);

  // Calcular breakdown das parcelas baseado no installmentPlan
  const installmentBreakdown = React.useMemo(() => {
    if (loan.installmentPlan && loan.installmentPlan.length > 0) {
      return loan.installmentPlan.map(installment => ({
        installmentNumber: installment.installmentNumber,
        principalAmount: installment.principalAmount,
        interestAmount: installment.interestAmount,
        totalAmount: installment.totalAmount,
        remainingBalance: installment.remainingBalance,
        status: installment.status || 'pending',
        paymentDate: installment.paymentDate,
        dueDate: installment.dueDate,
        paidAmountForThisInstallment: installment.paidAmountForThisInstallment || 0,
        remainingAmountForThisInstallment: installment.remainingAmountForThisInstallment || installment.totalAmount
      }));
    } else {
      // Fallback: calcular usando Tabela Price
      const monthlyRate = loan.interestRate / 100;
      const installments = [];
      let balance = loan.amount;
      const startDate = new Date(loan.startDate);
      
      for (let i = 1; i <= loan.installments; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        
        const interestAmount = balance * monthlyRate;
        const principalAmount = loan.installmentValue - interestAmount;
        balance -= principalAmount;
        
        let status: 'pending' | 'paid' | 'overdue' = 'pending';
        if (i <= loan.paidInstallments) {
          status = 'paid';
        } else if (dueDate < new Date()) {
          status = 'overdue';
        }
        
        installments.push({
          installmentNumber: i,
          principalAmount: Math.max(0, principalAmount),
          interestAmount: Math.max(0, interestAmount),
          totalAmount: loan.installmentValue,
          remainingBalance: Math.max(0, balance),
          status,
          paymentDate: status === 'paid' ? dueDate.toISOString().split('T')[0] : undefined,
          dueDate: dueDate.toISOString().split('T')[0],
          paidAmountForThisInstallment: status === 'paid' ? loan.installmentValue : 0,
          remainingAmountForThisInstallment: status === 'paid' ? 0 : loan.installmentValue
        });
      }
      
      return installments;
    }
  }, [loan]);

  React.useEffect(() => {
    setEditedInstallments(installmentBreakdown);
  }, [installmentBreakdown]);

  // Calcular totais de capital e juros do empréstimo
  const loanTotals = React.useMemo(() => {
    return calculateCapitalInterestMetrics(loan);
  }, [loan]);

  // Validação em tempo real dos dados de pagamento
  React.useEffect(() => {
    const validation = validatePaymentData(paymentData);
    setPaymentValidation(validation);
  }, [paymentData]);

  // Função para calcular valores proporcionais automaticamente
  const calculateProportionalValues = (totalPaid: number, originalInstallment: any) => {
    if (!originalInstallment || totalPaid <= 0) {
      return { principalPaid: 0, interestPaid: 0 };
    }

    const originalTotal = originalInstallment.totalAmount;
    const ratio = Math.min(totalPaid / originalTotal, 1); // Máximo 100% da parcela original

    return {
      principalPaid: Math.round(originalInstallment.principalAmount * ratio * 100) / 100,
      interestPaid: Math.round(originalInstallment.interestAmount * ratio * 100) / 100
    };
  };
  
  const handleEditInstallment = (index: number, field: string, value: any) => {
    const newInstallments = [...editedInstallments];
    newInstallments[index] = { ...newInstallments[index], [field]: value };
    
    // Recalcular total se capital ou juros mudaram
    if (field === 'principalAmount' || field === 'interestAmount') {
      newInstallments[index].totalAmount = 
        (newInstallments[index].principalAmount || 0) + 
        (newInstallments[index].interestAmount || 0);
    }
    
    setEditedInstallments(newInstallments);
  };

  const handleSaveInstallment = async (index: number) => {
    try {
      // Atualizar o installmentPlan do empréstimo
      const updatedLoan = { ...loan };
      if (!updatedLoan.installmentPlan) {
        updatedLoan.installmentPlan = installmentBreakdown;
      }
      
      updatedLoan.installmentPlan[index] = editedInstallments[index];
      
      // Propagar mudanças
      if (onUpdateLoan) {
        onUpdateLoan(updatedLoan);
      }
      
      setEditingInstallment(null);
    } catch (error) {
      console.error('Erro ao salvar parcela:', error);
      alert('Erro ao salvar alterações da parcela');
    }
  };

  const handleOpenPaymentModal = (installmentIndex: number) => {
    const installment = installmentBreakdown[installmentIndex];
    const payment = consolidatedPayments[installmentIndex];
    
    // Calcular valor remanescente para esta parcela
    const remainingAmount = installment.remainingAmountForThisInstallment || installment.totalAmount;
    
    // Pré-preencher com valores proporcionais baseados no valor remanescente
    const proportionalValues = calculateProportionalValues(remainingAmount, installment);
    
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      principalPaid: proportionalValues.principalPaid,
      interestPaid: proportionalValues.interestPaid,
      totalPaid: remainingAmount,
      penaltyPaid: payment.penalty || 0
    });
    
    setShowPaymentModal(installmentIndex);
  };

  const handlePaymentSubmit = async () => {
    if (showPaymentModal === null) return;
    
    setIsProcessingPayment(true);
    
    try {
      const installmentNumber = installmentBreakdown[showPaymentModal].installmentNumber;
      
      // Processar pagamento usando a função orquestradora
      const result: PaymentProcessResult = await processPayment(loan, installmentNumber, paymentData);
      
      if (!result.success) {
        alert(`Erro ao processar pagamento: ${result.error}`);
        return;
      }

      // Propagar mudanças para o estado global
      if (result.updatedLoan && onUpdateLoan) {
        onUpdateLoan(result.updatedLoan);
      }

      // Feedback específico baseado no tipo de pagamento
      let successMessage = `Pagamento registrado com sucesso!\n`;
      successMessage += `Capital: ${formatCurrency(paymentData.principalPaid)}\n`;
      successMessage += `Juros: ${formatCurrency(paymentData.interestPaid)}\n`;
      successMessage += `Total: ${formatCurrency(paymentData.totalPaid)}`;

      if (result.isPartialPayment) {
        successMessage += `\n\n⚠️ Pagamento Parcial: Parcela marcada como parcialmente paga.`;
      }

      if (result.isOverpayment && result.excessAmount) {
        successMessage += `\n\n💰 Pagamento a Maior: Excedente de ${formatCurrency(result.excessAmount)} registrado.`;
      }

      alert(successMessage);

      // Fechar modal e limpar dados
      setShowPaymentModal(null);
      setPaymentData({
        paymentDate: new Date().toISOString().split('T')[0],
        principalPaid: 0,
        interestPaid: 0,
        totalPaid: 0,
        penaltyPaid: 0
      });
      
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      alert('Erro inesperado ao processar pagamento');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Função para atualizar valores automaticamente quando totalPaid muda
  const handleTotalPaidChange = (newTotalPaid: number) => {
    if (showPaymentModal === null) return;
    
    const installment = installmentBreakdown[showPaymentModal];
    const proportionalValues = calculateProportionalValues(newTotalPaid, installment);
    
    setPaymentData(prev => ({
      ...prev,
      totalPaid: newTotalPaid,
      principalPaid: proportionalValues.principalPaid,
      interestPaid: proportionalValues.interestPaid
    }));
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="text-green-600" size={16} />;
      case 'partially_paid':
        return <Clock className="text-blue-600" size={16} />;
      case 'overdue':
        return <AlertTriangle className="text-red-600" size={16} />;
      default:
        return <Clock className="text-yellow-600" size={16} />;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'partially_paid':
        return 'Parcial';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'partially_paid':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getRowBackgroundColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-50';
      case 'partially_paid':
        return 'bg-blue-50';
      case 'overdue':
        return 'bg-red-50';
      default:
        return 'hover:bg-gray-50';
    }
  };

  // Calcular totais por categoria usando dados consolidados
  const totals = React.useMemo(() => {
    const result = {
      pending: { count: 0, principal: 0, interest: 0, total: 0 },
      overdue: { count: 0, principal: 0, interest: 0, total: 0 },
      paid: { count: 0, principal: 0, interest: 0, total: 0 },
      partiallyPaid: { count: 0, principal: 0, interest: 0, total: 0 }
    };

    consolidatedPayments.forEach((payment, index) => {
      const breakdown = installmentBreakdown[index];
      if (breakdown) {
        // Usar status do breakdown (mais preciso)
        const status = breakdown.status;
        
        if (status === 'paid') {
          result.paid.count++;
          result.paid.principal += breakdown.principalAmount;
          result.paid.interest += breakdown.interestAmount;
          result.paid.total += breakdown.totalAmount;
        } else if (status === 'partially_paid') {
          result.partiallyPaid.count++;
          result.partiallyPaid.principal += breakdown.paidAmountForThisInstallment || 0;
          result.partiallyPaid.interest += 0; // Será calculado proporcionalmente
          result.partiallyPaid.total += breakdown.paidAmountForThisInstallment || 0;
        } else if (status === 'overdue') {
          result.overdue.count++;
          result.overdue.principal += breakdown.remainingAmountForThisInstallment || breakdown.principalAmount;
          result.overdue.interest += breakdown.interestAmount;
          result.overdue.total += (breakdown.remainingAmountForThisInstallment || breakdown.totalAmount) + (payment.penalty || 0);
        } else {
          result.pending.count++;
          result.pending.principal += breakdown.principalAmount;
          result.pending.interest += breakdown.interestAmount;
          result.pending.total += breakdown.totalAmount;
        }
      }
    });

    return result;
  }, [consolidatedPayments, installmentBreakdown]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} className="mr-2" />
          Voltar
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Detalhes do Empréstimo #{loan.id}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informações Gerais */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Gerais</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="text-blue-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Cliente</div>
                  <div className="font-medium">{loan.clientName}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Valor do Empréstimo</div>
                  <div className="font-medium">{formatCurrency(loan.amount)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calculator className="text-purple-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Taxa de Juros</div>
                  <div className="font-medium">{loan.interestRate}% a.m.</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <TrendingUp className="text-orange-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Valor da Parcela</div>
                  <div className="font-medium">{formatCurrency(loan.installmentValue)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-blue-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Data de Início</div>
                  <div className="font-medium">{formatDate(loan.startDate)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="text-red-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Data de Vencimento</div>
                  <div className="font-medium">{formatDate(loan.endDate)}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo por Categoria */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo por Categoria</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-blue-800">Capital Total</h3>
                  <DollarSign className="text-blue-600" size={20} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Emprestado:</span>
                    <span className="font-medium">{formatCurrency(loanTotals.totalCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Retornado:</span>
                    <span className="font-medium text-green-600">{formatCurrency(loanTotals.paidCapital)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Pendente:</span>
                    <span className="font-medium text-orange-600">{formatCurrency(loanTotals.pendingCapital)}</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-300 pt-1">
                    <span className="text-blue-800 font-medium">% Retornado:</span>
                    <span className="font-bold">{loanTotals.capitalReturnRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-orange-800">Juros Total</h3>
                  <TrendingUp className="text-orange-600" size={20} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-orange-700">Projetado:</span>
                    <span className="font-medium">{formatCurrency(loanTotals.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">Recebido:</span>
                    <span className="font-medium text-green-600">{formatCurrency(loanTotals.paidInterest)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700">A Receber:</span>
                    <span className="font-medium text-blue-600">{formatCurrency(loanTotals.pendingInterest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-orange-300 pt-1">
                    <span className="text-orange-800 font-medium">% Recebido:</span>
                    <span className="font-bold">{loanTotals.interestEarnRate.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-green-800">Parcelas Pagas</h3>
                  <CheckCircle className="text-green-600" size={20} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Quantidade:</span>
                    <span className="font-medium">{totals.paid.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Capital:</span>
                    <span className="font-medium">{formatCurrency(totals.paid.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Juros:</span>
                    <span className="font-medium">{formatCurrency(totals.paid.interest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-green-300 pt-1">
                    <span className="text-green-800 font-medium">Total:</span>
                    <span className="font-bold">{formatCurrency(totals.paid.total)}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-red-800">Parcelas Vencidas</h3>
                  <AlertTriangle className="text-red-600" size={20} />
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-700">Quantidade:</span>
                    <span className="font-medium">{totals.overdue.count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Capital:</span>
                    <span className="font-medium">{formatCurrency(totals.overdue.principal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700">Juros:</span>
                    <span className="font-medium">{formatCurrency(totals.overdue.interest)}</span>
                  </div>
                  <div className="flex justify-between border-t border-red-300 pt-1">
                    <span className="text-red-800 font-medium">Total:</span>
                    <span className="font-bold">{formatCurrency(totals.overdue.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Mostrar parciais se existirem */}
            {totals.partiallyPaid.count > 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800 mb-2">
                  <Clock size={16} />
                  <span className="font-medium">Parcelas Parcialmente Pagas</span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Quantidade:</span>
                    <div className="font-medium">{totals.partiallyPaid.count}</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Valor Pago:</span>
                    <div className="font-medium">{formatCurrency(totals.partiallyPaid.total)}</div>
                  </div>
                  <div>
                    <span className="text-blue-700">Saldo Devedor:</span>
                    <div className="font-medium text-orange-600">
                      {formatCurrency(
                        installmentBreakdown
                          .filter(inst => inst.status === 'partially_paid')
                          .reduce((sum, inst) => sum + (inst.remainingAmountForThisInstallment || 0), 0)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tabela de Parcelas Consolidada */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Cronograma de Parcelas</h2>
              {canEdit && (
                <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  <Edit size={14} className="inline mr-1" />
                  Modo de Edição Disponível
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Parcela</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Vencimento</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Capital</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Juros</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Multa</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Total</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Pago</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Restante</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Pagamento</th>
                    {canEdit && (
                      <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Ações</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {consolidatedPayments.map((payment, index) => {
                    const breakdown = editedInstallments[index] || installmentBreakdown[index];
                    const isOverdue = new Date(payment.dueDate) < new Date() && 
                                     (payment.status === 'pending' || breakdown.status === 'partially_paid');
                    const isEditing = editingInstallment === index;
                    
                    return (
                      <tr key={payment.id} className={`transition-colors ${getRowBackgroundColor(breakdown.status)}`}>
                        <td className="px-4 py-3 font-medium">#{payment.installmentNumber}</td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="date"
                              value={breakdown.dueDate}
                              onChange={(e) => handleEditInstallment(index, 'dueDate', e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          ) : (
                            <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatDate(payment.dueDate)}
                            </div>
                          )}
                          {isOverdue && (
                            <div className="text-xs text-red-500">
                              {Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias em atraso
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={breakdown?.principalAmount || 0}
                              onChange={(e) => handleEditInstallment(index, 'principalAmount', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              step="0.01"
                            />
                          ) : (
                            <span className="font-medium text-blue-600">
                              {formatCurrency(breakdown?.principalAmount || 0)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              value={breakdown?.interestAmount || 0}
                              onChange={(e) => handleEditInstallment(index, 'interestAmount', Number(e.target.value))}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              step="0.01"
                            />
                          ) : (
                            <span className="font-medium text-orange-600">
                              {formatCurrency(breakdown?.interestAmount || 0)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {payment.penalty ? (
                            <span className="font-medium text-red-600">
                              {formatCurrency(payment.penalty)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900">
                            {formatCurrency((breakdown?.totalAmount || payment.amount) + (payment.penalty || 0))}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-green-600">
                            {formatCurrency(breakdown?.paidAmountForThisInstallment || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-orange-600">
                            {formatCurrency(breakdown?.remainingAmountForThisInstallment || 0)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium border ${getPaymentStatusColor(breakdown.status)}`}>
                            {getPaymentStatusIcon(breakdown.status)}
                            {getPaymentStatusText(breakdown.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {payment.paymentDate ? (
                            <div className="text-sm text-gray-900">{formatDate(payment.paymentDate)}</div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {canEdit && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {isEditing ? (
                                <>
                                  <RBACButton
                                    resource={RBAC_RESOURCES.LOANS}
                                    action={RBAC_ACTIONS.UPDATE}
                                    onClick={() => handleSaveInstallment(index)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    title="Salvar alterações"
                                  >
                                    <Save size={14} />
                                  </RBACButton>
                                  <button
                                    onClick={() => setEditingInstallment(null)}
                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                    title="Cancelar edição"
                                  >
                                    <X size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <RBACButton
                                    resource={RBAC_RESOURCES.LOANS}
                                    action={RBAC_ACTIONS.UPDATE}
                                    onClick={() => setEditingInstallment(index)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    title="Editar parcela"
                                  >
                                    <Edit size={14} />
                                  </RBACButton>
                                  {breakdown.status !== 'paid' && (breakdown.remainingAmountForThisInstallment || 0) > 0.01 && (
                                    <RBACButton
                                      resource={RBAC_RESOURCES.COLLECTIONS}
                                      action={RBAC_ACTIONS.UPDATE}
                                      onClick={() => handleOpenPaymentModal(index)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                      title="Baixar parcela"
                                    >
                                      <CreditCard size={14} />
                                    </RBACButton>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Capital</div>
                  <div className="text-lg font-bold text-blue-800">{formatCurrency(loanTotals.totalCapital)}</div>
                  <div className="text-xs text-blue-600">
                    Retornado: {formatCurrency(loanTotals.paidCapital)} ({loanTotals.capitalReturnRate.toFixed(1)}%)
                  </div>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm text-orange-600 font-medium">Juros</div>
                  <div className="text-lg font-bold text-orange-800">{formatCurrency(loanTotals.totalInterest)}</div>
                  <div className="text-xs text-orange-600">
                    Recebido: {formatCurrency(loanTotals.paidInterest)} ({loanTotals.interestEarnRate.toFixed(1)}%)
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Valor Emprestado</span>
                <span className="font-medium">{formatCurrency(loan.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total de Juros</span>
                <span className="font-medium text-orange-600">{formatCurrency(loanTotals.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Valor Total</span>
                <span className="font-medium">{formatCurrency(loanTotals.totalCapital + loanTotals.totalInterest)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Parcelas Pagas</span>
                <span className="font-medium">{totals.paid.count}/{loan.installments}</span>
              </div>
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg">
                <span className="text-gray-900 font-semibold">Valor Restante</span>
                <span className="font-bold text-blue-600">{formatCurrency(loanTotals.pendingCapital + loanTotals.pendingInterest)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Progresso</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Progresso do Pagamento</span>
                <span>{Math.round((totals.paid.count / loan.installments) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(totals.paid.count / loan.installments) * 100}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-600">
                {loan.installments - totals.paid.count} parcelas restantes
              </div>
            </div>
          </div>

          {/* Análise de Rentabilidade */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Análise de Rentabilidade</h2>
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Margem de Lucro</div>
                <div className="text-xl font-bold text-blue-800">
                  {(((loan.totalAmount / loan.amount) - 1) * 100).toFixed(2)}%
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">💵 Investimento:</span>
                  <span className="font-medium">{formatCurrency(loan.amount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">💰 Retorno:</span>
                  <span className="font-medium text-green-700">{formatCurrency(loan.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">📈 Lucro:</span>
                  <span className="font-medium text-blue-700">{formatCurrency(loan.totalAmount - loan.amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Baixa de Parcela (Corrigido) */}
      {showPaymentModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Baixar Parcela #{consolidatedPayments[showPaymentModal]?.installmentNumber}
                </h2>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isProcessingPayment}
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Informações da Parcela */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Informações da Parcela</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cliente:</span>
                    <div className="font-medium">{loan.clientName}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor Original:</span>
                    <div className="font-medium">{formatCurrency(installmentBreakdown[showPaymentModal]?.totalAmount || 0)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Já Pago:</span>
                    <div className="font-medium text-green-600">
                      {formatCurrency(installmentBreakdown[showPaymentModal]?.paidAmountForThisInstallment || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor Restante:</span>
                    <div className="font-medium text-orange-600">
                      {formatCurrency(installmentBreakdown[showPaymentModal]?.remainingAmountForThisInstallment || 0)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <div className="font-medium">{formatDate(consolidatedPayments[showPaymentModal]?.dueDate || '')}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Empréstimo:</span>
                    <div className="font-medium">#{loan.id}</div>
                  </div>
                </div>
              </div>

              {/* Campos de Pagamento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data do Pagamento *
                  </label>
                  <input
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessingPayment}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total Pago * (Principal)
                  </label>
                  <input
                    type="number"
                    value={paymentData.totalPaid}
                    onChange={(e) => handleTotalPaidChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isProcessingPayment}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Valor total efetivamente pago pelo cliente
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capital Pago (R$) *
                  </label>
                  <input
                    type="number"
                    value={paymentData.principalPaid}
                    onChange={(e) => {
                      const principal = Number(e.target.value);
                      setPaymentData(prev => ({ 
                        ...prev, 
                        principalPaid: principal,
                        totalPaid: principal + prev.interestPaid + (prev.penaltyPaid || 0)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isProcessingPayment}
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    Porção do capital retornado
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Juros Pagos (R$) *
                  </label>
                  <input
                    type="number"
                    value={paymentData.interestPaid}
                    onChange={(e) => {
                      const interest = Number(e.target.value);
                      setPaymentData(prev => ({ 
                        ...prev, 
                        interestPaid: interest,
                        totalPaid: prev.principalPaid + interest + (prev.penaltyPaid || 0)
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    disabled={isProcessingPayment}
                  />
                  <div className="text-xs text-orange-600 mt-1">
                    Porção dos juros recebidos
                  </div>
                </div>

                {consolidatedPayments[showPaymentModal]?.penalty && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Multa por Atraso
                    </label>
                    <input
                      type="number"
                      value={paymentData.penaltyPaid || 0}
                      onChange={(e) => {
                        const penalty = Number(e.target.value);
                        setPaymentData(prev => ({ 
                          ...prev, 
                          penaltyPaid: penalty,
                          totalPaid: prev.principalPaid + prev.interestPaid + penalty
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      disabled={isProcessingPayment}
                    />
                    <div className="text-xs text-red-600 mt-1">
                      Multa calculada: {formatCurrency(consolidatedPayments[showPaymentModal]?.penalty || 0)}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Validação em tempo real */}
              {!paymentValidation.isValid && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 mb-1">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Erros de Validação</span>
                  </div>
                  <ul className="text-sm text-red-700 list-disc list-inside">
                    {paymentValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Resumo do Pagamento */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Resumo do Pagamento</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Capital:</span>
                    <div className="font-bold text-blue-800">{formatCurrency(paymentData.principalPaid)}</div>
                  </div>
                  <div>
                    <span className="text-orange-700">Juros:</span>
                    <div className="font-bold text-orange-800">{formatCurrency(paymentData.interestPaid)}</div>
                  </div>
                  <div>
                    <span className="text-gray-700">Total:</span>
                    <div className="font-bold text-gray-900">{formatCurrency(paymentData.totalPaid)}</div>
                  </div>
                </div>
                
                {paymentData.penaltyPaid && paymentData.penaltyPaid > 0 && (
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <div className="flex justify-between text-sm">
                      <span className="text-red-700">Multa:</span>
                      <div className="font-bold text-red-800">{formatCurrency(paymentData.penaltyPaid)}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Alertas de Pagamento */}
              {showPaymentModal !== null && (() => {
                const remainingAmount = installmentBreakdown[showPaymentModal]?.remainingAmountForThisInstallment || 0;
                const isPartial = paymentData.totalPaid > 0 && paymentData.totalPaid < remainingAmount;
                const isOverpayment = paymentData.totalPaid > remainingAmount;
                
                if (isPartial) {
                  return (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-800 mb-2">
                        <AlertTriangle size={16} />
                        <span className="font-medium">Pagamento Parcial Detectado</span>
                      </div>
                      <p className="text-yellow-700 text-sm">
                        A parcela será marcada como <strong>parcialmente paga</strong>. 
                        Saldo remanescente: <strong>{formatCurrency(remainingAmount - paymentData.totalPaid)}</strong>
                      </p>
                    </div>
                  );
                } else if (isOverpayment) {
                  return (
                    <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center gap-2 text-purple-800 mb-2">
                        <TrendingUp size={16} />
                        <span className="font-medium">Pagamento a Maior Detectado</span>
                      </div>
                      <p className="text-purple-700 text-sm">
                        Valor excedente: <strong>{formatCurrency(paymentData.totalPaid - remainingAmount)}</strong>
                        <br />O excedente será registrado no histórico de pagamentos.
                      </p>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={isProcessingPayment}
              >
                Cancelar
              </button>
              <button
                onClick={handlePaymentSubmit}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={!paymentValidation.isValid || isProcessingPayment || paymentData.totalPaid <= 0}
              >
                {isProcessingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Processando...
                  </>
                ) : (
                  'Confirmar Pagamento'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDetails;