import React, { useState } from 'react';
import { Eye, Plus, Search, Filter, CreditCard as Edit, Trash2, DollarSign, Calendar, User, TrendingUp, AlertTriangle } from 'lucide-react';
import { Loan, Client } from '../types';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';
import RBACButton from './RBACButton';

interface LoanListProps {
  onViewLoan: (loan: Loan) => void;
  onNewLoan: () => void;
  onEditLoan: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  loans: Loan[];
  clients: Client[];
}

const LoanList: React.FC<LoanListProps> = ({ onViewLoan, onNewLoan, onEditLoan, onDeleteLoan, loans, clients }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'defaulted'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'week' | 'month' | 'quarter' | 'semester' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'client'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showDeleteModal, setShowDeleteModal] = useState<Loan | null>(null);
  
  const { } = useRBAC();

  const handleDeleteClick = (loan: Loan) => {
    setShowDeleteModal(loan);
  };

  const confirmDelete = () => {
    if (showDeleteModal) {
      onDeleteLoan(showDeleteModal.id);
      setShowDeleteModal(null);
    }
  };
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'defaulted':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Finalizado';
      case 'defaulted':
        return 'Inadimplente';
      default:
        return 'Desconhecido';
    }
  };

  const getClientById = (clientId: string) => {
    return clients.find(c => c.id === clientId);
  };

  const filterLoansByDate = (loans: Loan[]) => {
    if (dateFilter === 'all') return loans;
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    
    switch (dateFilter) {
      case 'week':
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        break;
      case 'quarter':
        startDate = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
        break;
      case 'semester':
        startDate = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
        break;
      case 'year':
        startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        break;
      default:
        return loans;
    }
    
    return loans.filter(loan => {
      const loanDate = new Date(loan.startDate);
      return loanDate >= startDate;
    });
  };

  const filteredAndSortedLoans = loans
    .filter(loan => {
      const matchesSearch = loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           loan.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || loan.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .filter(loan => filterLoansByDate([loan]).length > 0)
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'client':
          comparison = a.clientName.localeCompare(b.clientName);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getTotalStats = () => {
    const filteredLoans = filterLoansByDate(loans);
    const total = filteredLoans.length;
    const active = filteredLoans.filter(l => l.status === 'active').length;
    const completed = filteredLoans.filter(l => l.status === 'completed').length;
    const defaulted = filteredLoans.filter(l => l.status === 'defaulted').length;
    const totalLent = filteredLoans.reduce((sum, l) => sum + l.amount, 0);
    const totalReceivable = filteredLoans.reduce((sum, l) => sum + l.totalAmount, 0);
    
    return { total, active, completed, defaulted, totalLent, totalReceivable };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Empréstimos</h1>
        <button
          onClick={onNewLoan}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
        >
          <Plus size={20} className="mr-2" />
          Novo Empréstimo
        </button>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-xs sm:text-xs text-gray-600">Contratos</div>
            </div>
            <DollarSign className="text-blue-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-xl font-bold text-blue-600">{stats.active}</div>
              <div className="text-xs sm:text-xs text-gray-600">Ativos</div>
            </div>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-xs sm:text-xs text-gray-600">Finalizados</div>
            </div>
            <Calendar className="text-green-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg sm:text-xl font-bold text-red-600">{stats.defaulted}</div>
              <div className="text-xs sm:text-xs text-gray-600">Inadimplentes</div>
            </div>
            <AlertTriangle className="text-red-600" size={20} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm font-bold text-blue-700">{formatCurrency(stats.totalLent)}</div>
              <div className="text-xs text-gray-600">💰 Capital</div>
            </div>
            <DollarSign className="text-gray-600" size={18} />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs sm:text-sm font-bold text-orange-600">{formatCurrency(stats.totalReceivable - stats.totalLent)}</div>
              <div className="text-xs text-gray-600">📈 Juros</div>
            </div>
            <TrendingUp className="text-orange-600" size={18} />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por cliente ou ID do empréstimo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm touch-manipulation"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Filter className="text-gray-400" size={16} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full sm:w-auto px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[120px] touch-manipulation"
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="completed">Finalizados</option>
              <option value="defaulted">Inadimplentes</option>
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-gray-600 text-sm hidden sm:inline">Período:</span>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="w-full sm:w-auto px-2 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm min-w-[140px] touch-manipulation"
            >
              <option value="all">Todos os Períodos</option>
              <option value="week">Última Semana</option>
              <option value="month">Último Mês</option>
              <option value="quarter">Último Trimestre</option>
              <option value="semester">Último Semestre</option>
              <option value="year">Último Ano</option>
            </select>
          </div>
        </div>
        
        {/* Ordenação */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="text-xs text-gray-600">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs touch-manipulation"
            >
              <option value="date">Data</option>
              <option value="amount">Valor</option>
              <option value="client">Cliente</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-50 transition-colors text-xs touch-manipulation"
            >
              {sortOrder === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
            </button>
          </div>
          
          <div className="text-xs text-gray-600 w-full sm:w-auto text-left sm:text-right">
            {filteredAndSortedLoans.length} de {loans.length} empréstimos
            {dateFilter !== 'all' && (
              <span className="text-blue-600 ml-2">
                • Filtro: {
                  dateFilter === 'week' ? 'Última Semana' :
                  dateFilter === 'month' ? 'Último Mês' :
                  dateFilter === 'quarter' ? 'Último Trimestre' :
                  dateFilter === 'semester' ? 'Último Semestre' :
                  dateFilter === 'year' ? 'Último Ano' : ''
                }
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[120px]">Cliente</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[80px]">Score</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[120px]">Valores</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">Data</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">Parcelas</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[90px]">Status</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">Progresso</th>
                <th className="text-left px-3 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold text-gray-900 min-w-[100px]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAndSortedLoans.map((loan) => {
                const client = getClientById(loan.clientId);
                const progress = (loan.paidInstallments / loan.installments) * 100;
                
                return (
                  <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-sm sm:text-base font-medium text-gray-900 flex items-center gap-2">
                          <User size={16} className="text-gray-400" />
                          {loan.clientName}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">ID: {loan.id}</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {client ? (
                        <div>
                          <div className="text-sm sm:text-base font-medium text-gray-900">{client.creditScore}</div>
                          <div className={`text-xs ${
                            client.creditScore >= 700 ? 'text-green-600' :
                            client.creditScore >= 500 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {client.creditScore >= 700 ? 'Baixo Risco' :
                             client.creditScore >= 500 ? 'Médio Risco' : 'Alto Risco'}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-sm sm:text-base font-medium text-gray-900">{formatCurrency(loan.amount)}</div>
                        <div className="text-xs text-blue-600">Capital: {formatCurrency(loan.amount)}</div>
                        <div className="text-xs text-orange-600">Juros: {formatCurrency(loan.totalAmount - loan.amount)}</div>
                        <div className="text-xs text-gray-500">{loan.interestRate.toFixed(1)}% a.m.</div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-sm sm:text-base font-medium text-gray-900">
                        {new Date(loan.startDate).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">
                        até {new Date(loan.endDate).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-sm sm:text-base font-medium text-gray-900">
                        {loan.paidInstallments}/{loan.installments}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2 mt-1">
                        <div 
                          className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                            loan.status === 'completed' ? 'bg-green-600' :
                            loan.status === 'defaulted' ? 'bg-red-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(loan.installmentValue)}/mês
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(loan.status)}`}>
                        {getStatusText(loan.status)}
                      </span>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div>
                        <div className="text-sm sm:text-base font-medium text-gray-900">{formatCurrency(loan.remainingAmount)}</div>
                        <div className="text-xs text-gray-500">
                          {Math.round((loan.paidInstallments / loan.installments) * 100)}% pago
                        </div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => onViewLoan(loan)}
                          className="flex items-center px-1 sm:px-2 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                        <RBACButton
                          resource={RBAC_RESOURCES.LOANS}
                          action={RBAC_ACTIONS.UPDATE}
                          onClick={() => onEditLoan(loan)}
                          className="flex items-center px-1 sm:px-2 py-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors touch-manipulation"
                          title="Editar empréstimo"
                        >
                          <Edit size={14} />
                        </RBACButton>
                        <RBACButton
                          resource={RBAC_RESOURCES.LOANS}
                          action={RBAC_ACTIONS.DELETE}
                          onClick={() => handleDeleteClick(loan)}
                          className="flex items-center px-1 sm:px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                          title="Excluir empréstimo"
                        >
                          <Trash2 size={14} />
                        </RBACButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedLoans.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">Nenhum empréstimo encontrado</div>
          <p className="text-gray-400 mt-2">Tente ajustar os filtros de busca</p>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
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
                  Tem certeza que deseja excluir o empréstimo <strong>#{showDeleteModal.id}</strong> do cliente <strong>{showDeleteModal.clientName}</strong>?
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle size={16} />
                    <span className="font-medium">Atenção</span>
                  </div>
                  <p className="text-yellow-700 text-sm mt-1">
                    Todas as parcelas e histórico de pagamentos também serão excluídos permanentemente.
                  </p>
                </div>
                
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <div><strong>Valor:</strong> {formatCurrency(showDeleteModal.amount)}</div>
                    <div><strong>Status:</strong> {getStatusText(showDeleteModal.status)}</div>
                    <div><strong>Parcelas:</strong> {showDeleteModal.paidInstallments}/{showDeleteModal.installments}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <RBACButton
                  resource={RBAC_RESOURCES.LOANS}
                  action={RBAC_ACTIONS.DELETE}
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  fallback={
                    <button
                      disabled
                      className="flex-1 px-4 py-2 bg-gray-400 text-white rounded-lg cursor-not-allowed"
                    >
                      Sem Permissão
                    </button>
                  }
                >
                  Excluir Empréstimo
                </RBACButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanList;