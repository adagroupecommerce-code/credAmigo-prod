import React from 'react';
import { ArrowLeft, Calendar, DollarSign, User, AlertTriangle, CheckCircle, Clock, CreditCard } from 'lucide-react';
import { Payment, Loan, Client } from '../types';
import { mockLoans, mockClients } from '../data/mockData';

interface PaymentDetailsProps {
  payment: Payment;
  onBack: () => void;
  onUpdatePayment: (paymentId: string, status: Payment['status'], paymentDate?: string) => void;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({ payment, onBack, onUpdatePayment }) => {
  const loan = mockLoans.find(l => l.id === payment.loanId);
  const client = mockClients.find(c => c.id === loan?.clientId);

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
        return <CheckCircle size={20} className="text-green-600" />;
      case 'overdue':
        return <AlertTriangle size={20} className="text-red-600" />;
      default:
        return <Clock size={20} className="text-yellow-600" />;
    }
  };

  const isOverdue = new Date(payment.dueDate) < new Date() && payment.status === 'pending';
  const daysOverdue = isOverdue ? Math.floor((new Date().getTime() - new Date(payment.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

  const handleMarkAsPaid = () => {
    const today = new Date().toISOString().split('T')[0];
    onUpdatePayment(payment.id, 'paid', today);
  };

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
        <h1 className="text-3xl font-bold text-gray-900">Detalhes da Parcela</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informações da Parcela */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações da Parcela</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CreditCard className="text-blue-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Número da Parcela</div>
                  <div className="font-medium">#{payment.installmentNumber}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="text-green-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                  <div className="font-medium">{formatCurrency(payment.amount)}</div>
                </div>
              </div>
              
              {payment.principalAmount && (
                <div className="flex items-center gap-3">
                  <DollarSign className="text-blue-600" size={20} />
                  <div>
                    <div className="text-sm text-gray-600">Capital</div>
                    <div className="font-medium text-blue-600">{formatCurrency(payment.principalAmount)}</div>
                  </div>
                </div>
              )}
              
              {payment.interestAmount && (
                <div className="flex items-center gap-3">
                  <DollarSign className="text-orange-600" size={20} />
                  <div>
                    <div className="text-sm text-gray-600">Juros</div>
                    <div className="font-medium text-orange-600">{formatCurrency(payment.interestAmount)}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="text-purple-600" size={20} />
                <div>
                  <div className="text-sm text-gray-600">Data de Vencimento</div>
                  <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatDate(payment.dueDate)}
                  </div>
                  {isOverdue && (
                    <div className="text-sm text-red-500">
                      {daysOverdue} dias em atraso
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {getStatusIcon(payment.status)}
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <span className={`inline-flex px-2 py-1 rounded-full text-sm font-medium border ${getStatusColor(payment.status)}`}>
                    {getStatusText(payment.status)}
                  </span>
                </div>
              </div>
              {payment.paymentDate && (
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-600" size={20} />
                  <div>
                    <div className="text-sm text-gray-600">Data do Pagamento</div>
                    <div className="font-medium">{formatDate(payment.paymentDate)}</div>
                  </div>
                </div>
              )}
              {payment.penalty && (
                <div className="flex items-center gap-3">
                  <AlertTriangle className="text-red-600" size={20} />
                  <div>
                    <div className="text-sm text-gray-600">Multa por Atraso</div>
                    <div className="font-medium text-red-600">{formatCurrency(payment.penalty)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Cliente */}
          {client && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Cliente</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="text-blue-600" size={20} />
                  <div>
                    <div className="text-sm text-gray-600">Nome</div>
                    <div className="font-medium">{client.name}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Telefone</div>
                  <div className="font-medium">{client.phone}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{client.email || 'Não informado'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Score de Crédito</div>
                  <div className="font-medium">{client.creditScore}</div>
                </div>
              </div>
            </div>
          )}

          {/* Informações do Empréstimo */}
          {loan && (
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações do Empréstimo</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">ID do Empréstimo</div>
                  <div className="font-medium">#{loan.id}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Valor Total</div>
                  <div className="font-medium">{formatCurrency(loan.totalAmount)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Taxa de Juros</div>
                  <div className="font-medium">{loan.interestRate}% a.m.</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Parcelas</div>
                  <div className="font-medium">{loan.paidInstallments}/{loan.installments}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar com Ações */}
        <div className="space-y-6">
          {/* Ações */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações</h2>
            <div className="space-y-3">
              {payment.status !== 'paid' && (
                <button
                  onClick={handleMarkAsPaid}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <CheckCircle size={20} className="mr-2" />
                  Marcar como Pago
                </button>
              )}
              
              <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <CreditCard size={20} className="mr-2" />
                Gerar Boleto
              </button>
              
              <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <User size={20} className="mr-2" />
                Contatar Cliente
              </button>
            </div>
          </div>

          {/* Resumo Financeiro */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resumo Financeiro</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Valor da Parcela</span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
              {payment.penalty && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Multa por Atraso</span>
                  <span className="font-medium text-red-600">{formatCurrency(payment.penalty)}</span>
                </div>
              )}
              <hr className="border-gray-200" />
              <div className="flex justify-between text-lg">
                <span className="text-gray-900 font-semibold">Total a Pagar</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(payment.amount + (payment.penalty || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Histórico */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Histórico</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">Parcela criada</div>
                  <div className="text-xs text-gray-500">{formatDate(loan?.startDate || payment.dueDate)}</div>
                </div>
              </div>
              {payment.status === 'paid' && payment.paymentDate && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Pagamento realizado</div>
                    <div className="text-xs text-gray-500">{formatDate(payment.paymentDate)}</div>
                  </div>
                </div>
              )}
              {payment.status === 'overdue' && (
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2"></div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">Parcela vencida</div>
                    <div className="text-xs text-gray-500">{formatDate(payment.dueDate)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;