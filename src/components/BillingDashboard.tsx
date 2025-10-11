import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, AlertTriangle, CheckCircle, Clock, Filter, Search, Download, Eye, CreditCard, TrendingUp, TrendingDown, Users, FileText, X, Trash2 } from 'lucide-react';
import { Loan, Payment, Client } from '../types';
import { mockLoans, mockClients } from '../data/mockData';
import { generatePaymentsFromLoan } from '../utils/paymentUtils';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

interface BillingDashboardProps {
  onViewPayment?: (payment: Payment) => void;
  onDeletePayment?: (paymentId: string) => void;
}

const BillingDashboard: React.FC<BillingDashboardProps> = ({ onViewPayment, onDeletePayment }) => {
  const { isAdmin } = useRBAC();
  
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState<Payment | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Payment | null>(null);
  const [paymentData, setPaymentData] = useState({
    paymentDate: new Date().toISOString().split('T')[0],
    capitalPaid: 0,
    interestPaid: 0,
    totalPaid: 0
  });

  useEffect(() => {
    // Gerar pagamentos a partir dos empréstimos
    const allPayments: Payment[] = [];
    mockLoans.forEach(loan => {
      const loanPayments = generatePaymentsFromLoan(loan);
      allPayments.push(...loanPayments);
    });
    setPayments(allPayments);
  }, []);

  useEffect(() => {
    let filtered = payments;

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(payment => payment.status === statusFilter);
    }

    // Filtro por data
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(payment => {
        const dueDate = new Date(payment.dueDate);
        
        switch (dateFilter) {
          case 'today':
            return dueDate.toDateString() === today.toDateString();
          case 'week':
            const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            return dueDate >= today && dueDate <= weekFromNow;
          case 'month':
            const monthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
            return dueDate >= today && dueDate <= monthFromNow;
          case 'custom':
            if (customDateRange.start && customDateRange.end) {
              const startDate = new Date(customDateRange.start);
              const endDate = new Date(customDateRange.end);
              return dueDate >= startDate && dueDate <= endDate;
            }
            return true;
          default:
            return true;
        }
      });
    }

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(payment => {
        const loan = mockLoans.find(l => l.id === payment.loanId);
        const client = mockClients.find(c => c.id === loan?.clientId);
        return (
          client?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          loan?.id.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    setFilteredPayments(filtered);
  }, [payments, statusFilter, dateFilter, customDateRange, searchTerm]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusText = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'Pago';
      case 'overdue':
        return 'Vencido';
      default:
        return 'Pendente';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle size={16} className="text-green-600" />;
      case 'overdue':
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Clock size={16} className="text-yellow-600" />;
    }
  };

  const handlePaymentUpdate = (paymentId: string, status: Payment['status'], paymentDate?: string) => {
    setPayments(prev => prev.map(payment => 
      payment.id === paymentId 
        ? { ...payment, status, paymentDate: paymentDate || new Date().toISOString().split('T')[0] }
        : payment
    ));
  };

  const handleOpenPaymentModal = (payment: Payment) => {
    setShowPaymentModal(payment);
    // Pré-preencher com valores estimados baseados na parcela
    const estimatedCapital = payment.principalAmount || (payment.amount * 0.7);
    const estimatedInterest = payment.interestAmount || (payment.amount * 0.3);
    
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      capitalPaid: estimatedCapital,
      interestPaid: estimatedInterest,
      totalPaid: payment.amount
    });
  };

  const handleConfirmPayment = () => {
    if (!showPaymentModal) return;

    // Registrar o pagamento com detalhamento de capital e juros
    const paymentRecord = {
      paymentId: showPaymentModal.id,
      loanId: showPaymentModal.loanId,
      installmentNumber: showPaymentModal.installmentNumber,
      paymentDate: paymentData.paymentDate,
      capitalPaid: paymentData.capitalPaid,
      interestPaid: paymentData.interestPaid,
      totalPaid: paymentData.totalPaid,
      originalAmount: showPaymentModal.amount,
      isPartialPayment: paymentData.totalPaid < showPaymentModal.amount,
      timestamp: new Date().toISOString()
    };

    // Salvar no localStorage para tracking (em produção seria banco de dados)
    const existingRecords = JSON.parse(localStorage.getItem('payment_records') || '[]');
    existingRecords.push(paymentRecord);
    localStorage.setItem('payment_records', JSON.stringify(existingRecords));

    // Atualizar status da parcela
    handlePaymentUpdate(showPaymentModal.id, 'paid', paymentData.paymentDate);

    // Fechar modal e limpar dados
    setShowPaymentModal(null);
    setPaymentData({
      paymentDate: new Date().toISOString().split('T')[0],
      capitalPaid: 0,
      interestPaid: 0,
      totalPaid: 0
    });

    // Feedback para o usuário
    alert(`Pagamento registrado com sucesso!\nCapital: ${formatCurrency(paymentData.capitalPaid)}\nJuros: ${formatCurrency(paymentData.interestPaid)}\nTotal: ${formatCurrency(paymentData.totalPaid)}`);
  };

  const handleBulkPayment = () => {
    const today = new Date().toISOString().split('T')[0];
    setPayments(prev => prev.map(payment => 
      selectedPayments.includes(payment.id)
        ? { ...payment, status: 'paid' as const, paymentDate: today }
        : payment
    ));
    setSelectedPayments([]);
    setShowBulkActions(false);
  };

  const handleDeletePayment = (payment: Payment) => {
    setShowDeleteModal(payment);
  };

  const confirmDeletePayment = () => {
    if (showDeleteModal) {
      // Remover pagamento da lista local
      setPayments(prev => prev.filter(p => p.id !== showDeleteModal.id));
      
      // Chamar callback se fornecido
      if (onDeletePayment) {
        onDeletePayment(showDeleteModal.id);
      }
      
      setShowDeleteModal(null);
    }
  };

  const togglePaymentSelection = (paymentId: string) => {
    setSelectedPayments(prev => 
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  };

  const getStats = () => {
    const total = filteredPayments.length;
    const pending = filteredPayments.filter(p => p.status === 'pending').length;
    const overdue = filteredPayments.filter(p => p.status === 'overdue').length;
    const paid = filteredPayments.filter(p => p.status === 'paid').length;
    
    const totalAmount = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = filteredPayments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    const overdueAmount = filteredPayments.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = filteredPayments.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);

    return { total, pending, overdue, paid, totalAmount, pendingAmount, overdueAmount, paidAmount };
  };

  const stats = getStats();

  const StatCard = ({ 
    title, 
    value, 
    amount, 
    icon: Icon, 
    color = 'blue',
    onClick 
  }: {
    title: string;
    value: number;
    amount: number;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'red' | 'yellow';
    onClick?: () => void;
  }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      red: 'bg-red-50 text-red-600 border-red-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200'
    };

    return (
      <div 
        className={`bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer ${onClick ? 'hover:bg-gray-50' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{formatCurrency(amount)}</p>
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <CreditCard className="text-blue-600" size={28} />
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel de Cobrança</h1>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <Download size={20} className="mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Total de Parcelas"
          value={stats.total}
          amount={stats.totalAmount}
          icon={FileText}
          color="blue"
          onClick={() => setStatusFilter('all')}
        />
        <StatCard
          title="Pendentes"
          value={stats.pending}
          amount={stats.pendingAmount}
          icon={Clock}
          color="yellow"
          onClick={() => setStatusFilter('pending')}
        />
        <StatCard
          title="Vencidas"
          value={stats.overdue}
          amount={stats.overdueAmount}
          icon={AlertTriangle}
          color="red"
          onClick={() => setStatusFilter('overdue')}
        />
        <StatCard
          title="Pagas"
          value={stats.paid}
          amount={stats.paidAmount}
          icon={CheckCircle}
          color="green"
          onClick={() => setStatusFilter('paid')}
        />
      </div>

      {/* Filtros */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="overdue">Vencidas</option>
            <option value="paid">Pagas</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
          >
            <option value="all">Todas as Datas</option>
            <option value="today">Hoje</option>
            <option value="week">Próximos 7 dias</option>
            <option value="month">Próximos 30 dias</option>
            <option value="custom">Período Personalizado</option>
          </select>

          {dateFilter === 'custom' && (
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center col-span-1 sm:col-span-2 lg:col-span-1">
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
              />
              <span className="text-gray-500 text-center sm:text-left">até</span>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
              />
            </div>
          )}
        </div>

        {selectedPayments.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-blue-800">
              {selectedPayments.length} parcela(s) selecionada(s)
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={handleBulkPayment}
                className="flex-1 sm:flex-none px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm touch-manipulation"
              >
                Marcar como Pagas
              </button>
              <button
                onClick={() => setSelectedPayments([])}
                className="flex-1 sm:flex-none px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm touch-manipulation"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lista de Pagamentos */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 min-w-[40px]">
                  <input
                    type="checkbox"
                    checked={selectedPayments.length === filteredPayments.length && filteredPayments.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPayments(filteredPayments.map(p => p.id));
                      } else {
                        setSelectedPayments([]);
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[120px]">Cliente</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[60px]">Parcela</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Capital</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Juros</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Total</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">Vencimento</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Status</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[90px]">Pagamento</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-gray-900 min-w-[120px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayments.map((payment) => {
                const loan = mockLoans.find(l => l.id === payment.loanId);
                const client = mockClients.find(c => c.id === loan?.clientId);
                const isOverdue = new Date(payment.dueDate) < new Date() && payment.status === 'pending';
                
                return (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <input
                        type="checkbox"
                        checked={selectedPayments.includes(payment.id)}
                        onChange={() => togglePaymentSelection(payment.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div>
                        <div className="text-sm sm:text-base font-medium text-gray-900 truncate">{client?.name || 'Cliente não encontrado'}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Emp. #{loan?.id}</div>
                      </div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className="text-sm sm:text-base font-medium">#{payment.installmentNumber}</span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="text-sm sm:text-base font-medium text-blue-600">{formatCurrency(payment.principalAmount || 0)}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="text-sm sm:text-base font-medium text-orange-600">{formatCurrency(payment.interestAmount || 0)}</div>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="text-sm sm:text-base font-medium text-gray-900">{formatCurrency(payment.amount)}</div>
                      {payment.penalty && (
                        <div className="text-xs sm:text-sm text-red-600">+ {formatCurrency(payment.penalty)} multa</div>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        <div className="text-sm sm:text-base">{formatDate(payment.dueDate)}</div>
                      </div>
                      {isOverdue && (
                        <div className="text-xs text-red-500">
                          {Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24))} dias em atraso
                        </div>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(payment.status)}`}>
                        {getStatusIcon(payment.status)}
                        <span className="hidden sm:inline">{getStatusText(payment.status)}</span>
                      </span>
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      {payment.paymentDate ? (
                        <div className="text-xs sm:text-sm text-gray-900">{formatDate(payment.paymentDate)}</div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3">
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 sm:gap-2">
                        {payment.status !== 'paid' && (
                          <>
                            <RBACButton
                              resource={RBAC_RESOURCES.COLLECTIONS}
                              action={RBAC_ACTIONS.UPDATE}
                              onClick={() => handleOpenPaymentModal(payment)}
                              className="px-2 py-1 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition-colors touch-manipulation text-center"
                            >
                              Baixar
                            </RBACButton>
                            <RBACButton
                              resource={RBAC_RESOURCES.COLLECTIONS}
                              action={RBAC_ACTIONS.UPDATE}
                              onClick={() => handlePaymentUpdate(payment.id, 'paid')}
                              className="px-2 py-1 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors touch-manipulation text-center"
                              title="Baixa rápida"
                            >
                              Rápida
                            </RBACButton>
                            <RBACButton
                              resource={RBAC_RESOURCES.COLLECTIONS}
                              action={RBAC_ACTIONS.DELETE}
                              onClick={() => handleDeletePayment(payment)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs sm:text-sm hover:bg-red-700 transition-colors touch-manipulation text-center"
                              title="Excluir parcela"
                            >
                              Excluir
                            </RBACButton>
                          </>
                        )}
                        {payment.status === 'paid' && isAdmin && (
                          <RBACButton
                            resource={RBAC_RESOURCES.COLLECTIONS}
                            action={RBAC_ACTIONS.DELETE}
                            onClick={() => handleDeletePayment(payment)}
                            className="px-2 py-1 bg-red-700 text-white rounded text-xs sm:text-sm hover:bg-red-800 transition-colors touch-manipulation text-center"
                            title="Excluir parcela paga (Admin)"
                          >
                            <Trash2 size={12} className="inline mr-1" />
                            Admin
                          </RBACButton>
                        )}
                        <button
                          onClick={() => onViewPayment?.(payment)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors touch-manipulation"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayments.length === 0 && (
        <div className="text-center py-12">
          <CreditCard className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma parcela encontrada</h3>
          <p className="text-gray-600">Tente ajustar os filtros de busca</p>
        </div>
      )}

      {/* Modal de Baixa de Parcela */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  Baixar Parcela #{showPaymentModal.installmentNumber}
                </h2>
                <button
                  onClick={() => setShowPaymentModal(null)}
                  className="text-gray-400 hover:text-gray-600"
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
                    <div className="font-medium">
                      {(() => {
                        const loan = mockLoans.find(l => l.id === showPaymentModal.loanId);
                        const client = mockClients.find(c => c.id === loan?.clientId);
                        return client?.name || 'Cliente não encontrado';
                      })()}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Valor Original:</span>
                    <div className="font-medium">{formatCurrency(showPaymentModal.amount)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Vencimento:</span>
                    <div className="font-medium">{formatDate(showPaymentModal.dueDate)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Empréstimo:</span>
                    <div className="font-medium">#{showPaymentModal.loanId}</div>
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
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Total Pago *
                  </label>
                  <input
                    type="number"
                    value={paymentData.totalPaid}
                    onChange={(e) => {
                      const total = Number(e.target.value);
                      setPaymentData(prev => ({ ...prev, totalPaid: total }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Valor total efetivamente pago
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capital Pago (R$) *
                  </label>
                  <input
                    type="number"
                    value={paymentData.capitalPaid}
                    onChange={(e) => {
                      const capital = Number(e.target.value);
                      setPaymentData(prev => ({ 
                        ...prev, 
                        capitalPaid: capital,
                        totalPaid: capital + prev.interestPaid
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                  <div className="text-xs text-blue-600 mt-1">
                    Valor do capital retornado
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
                        totalPaid: prev.capitalPaid + interest
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                  />
                  <div className="text-xs text-orange-600 mt-1">
                    Valor dos juros recebidos
                  </div>
                </div>
              </div>

              {/* Resumo do Pagamento */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Resumo do Pagamento</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">Capital:</span>
                    <div className="font-bold text-blue-800">{formatCurrency(paymentData.capitalPaid)}</div>
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
                
                {paymentData.totalPaid !== (paymentData.capitalPaid + paymentData.interestPaid) && (
                  <div className="mt-2 text-xs text-red-600">
                    ⚠️ Atenção: Total não confere com a soma de Capital + Juros
                  </div>
                )}
                
                {paymentData.totalPaid < showPaymentModal.amount && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs text-yellow-800">
                      <strong>Pagamento Parcial:</strong> Faltam {formatCurrency(showPaymentModal.amount - paymentData.totalPaid)} para quitar a parcela
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPayment}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                disabled={!paymentData.paymentDate || paymentData.totalPaid <= 0}
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão de Parcela */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                  <p className="text-gray-600">Esta ação não pode ser desfeita</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Tem certeza que deseja excluir a parcela <strong>#{showDeleteModal.installmentNumber}</strong>?
                </p>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div><strong>Cliente:</strong> {(() => {
                      const loan = mockLoans.find(l => l.id === showDeleteModal.loanId);
                      const client = mockClients.find(c => c.id === loan?.clientId);
                      return client?.name || 'Cliente não encontrado';
                    })()}</div>
                    <div><strong>Valor:</strong> {formatCurrency(showDeleteModal.amount)}</div>
                    <div><strong>Vencimento:</strong> {formatDate(showDeleteModal.dueDate)}</div>
                    <div><strong>Status:</strong> {getStatusText(showDeleteModal.status)}</div>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Atenção</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    A exclusão da parcela afetará o cronograma de pagamentos do empréstimo. 
                    Esta ação deve ser usada apenas em casos excepcionais.
                  </p>
                </div>
                
                {showDeleteModal.status === 'paid' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <AlertTriangle size={16} />
                      <span className="font-medium">⚠️ ATENÇÃO - Parcela Paga</span>
                    </div>
                    <p className="text-red-700 text-sm mt-1">
                      Esta parcela já foi paga em {showDeleteModal.paymentDate ? formatDate(showDeleteModal.paymentDate) : 'data não informada'}. 
                      A exclusão afetará permanentemente:
                    </p>
                    <ul className="text-red-700 text-sm mt-2 ml-4 list-disc">
                      <li>Registros financeiros e relatórios</li>
                      <li>Histórico de pagamentos do cliente</li>
                      <li>Cálculos de rentabilidade</li>
                      <li>Métricas de performance</li>
                    </ul>
                    <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                      <div className="text-xs text-red-800 font-medium">
                        🔒 FUNÇÃO RESTRITA: Apenas administradores podem excluir parcelas pagas
                      </div>
                    </div>
                  </div>
                )}
                
                {!isAdmin && showDeleteModal.status === 'paid' && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-800">
                      <AlertTriangle size={16} />
                      <span className="font-medium">Acesso Negado</span>
                    </div>
                    <p className="text-gray-700 text-sm mt-1">
                      Apenas administradores podem excluir parcelas que já foram pagas.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <RBACButton
                  resource={RBAC_RESOURCES.COLLECTIONS}
                  action={RBAC_ACTIONS.DELETE}
                  onClick={confirmDeletePayment}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  fallback={
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                    >
                      Sem Permissão
                    </button>
                  }
                >
                  {showDeleteModal.status === 'paid' 
                    ? 'Excluir Parcela Paga (Admin)' 
                    : 'Excluir Parcela'
                  }
                </RBACButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingDashboard;