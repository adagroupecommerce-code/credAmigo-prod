import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Filter, Search, Calendar } from 'lucide-react';
import { CashAccount, Transaction } from '../types/financial';
import { TRANSACTION_CATEGORIES } from '../types/financial';
import { listCashAccounts, createCashAccount, updateCashAccount, deleteCashAccount } from '@/services/cashAccounts';
import { listTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/services/transactions';
import { useRBAC } from '../hooks/useRBAC';
import { RBAC_RESOURCES, RBAC_ACTIONS } from '../types/rbac';

const CashBankManagement = () => {
  const { hasPermission } = useRBAC();
  const canEditAccounts = hasPermission(RBAC_RESOURCES.SETTINGS, RBAC_ACTIONS.UPDATE);

  const [accounts, setAccounts] = useState<CashAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [showNewTransactionForm, setShowNewTransactionForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<CashAccount | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [transactionFilter, setTransactionFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, transactionsData] = await Promise.all([
        listCashAccounts(),
        listTransactions()
      ]);
      setAccounts(accountsData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      alert('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank' as CashAccount['type'],
    balance: 0
  });

  const [newTransaction, setNewTransaction] = useState({
    accountId: '',
    type: 'income' as Transaction['type'],
    category: '',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getAccountTypeIcon = (type: CashAccount['type']) => {
    switch (type) {
      case 'cash':
        return <DollarSign size={20} className="text-green-600" />;
      case 'bank':
        return <DollarSign size={20} className="text-blue-600" />;
      case 'investment':
        return <TrendingUp size={20} className="text-purple-600" />;
      default:
        return <DollarSign size={20} className="text-gray-600" />;
    }
  };

  const getAccountTypeText = (type: CashAccount['type']) => {
    switch (type) {
      case 'cash': return 'Caixa';
      case 'bank': return 'Banco';
      case 'investment': return 'Investimento';
      default: return type;
    }
  };

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'income':
        return <ArrowUpRight size={16} className="text-green-600" />;
      case 'expense':
        return <ArrowDownLeft size={16} className="text-red-600" />;
      default:
        return <ArrowUpRight size={16} className="text-blue-600" />;
    }
  };

  const handleCreateAccount = async () => {
    if (!newAccount.name) {
      alert('Por favor, preencha o nome da conta');
      return;
    }

    try {
      await createCashAccount({
        name: newAccount.name,
        type: newAccount.type,
        balance: newAccount.balance,
        currency: 'BRL',
        is_active: true
      });
      await loadData();
      setNewAccount({ name: '', type: 'bank', balance: 0 });
      setShowNewAccountForm(false);
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      alert('Erro ao criar conta');
    }
  };

  const handleEditAccount = (account: CashAccount) => {
    if (!canEditAccounts) {
      alert('Você não tem permissão para editar contas. Apenas administradores podem realizar esta ação.');
      return;
    }
    setEditingAccount(account);
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    if (!editingAccount.name) {
      alert('Por favor, preencha o nome da conta');
      return;
    }

    try {
      console.log('🔄 Atualizando conta:', editingAccount.id);
      await updateCashAccount(editingAccount.id, {
        name: editingAccount.name,
        type: editingAccount.type,
        balance: editingAccount.balance,
        currency: editingAccount.currency || 'BRL',
        is_active: editingAccount.isActive
      });
      console.log('✅ Conta atualizada com sucesso');
      await loadData();
      setEditingAccount(null);
      alert('Conta atualizada com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao atualizar conta:', error);
      alert('Erro ao atualizar conta');
    }
  };

  const handleCancelEdit = () => {
    setEditingAccount(null);
  };

  const handleCreateTransaction = async () => {
    if (!newTransaction.accountId || !newTransaction.category || !newTransaction.description || newTransaction.amount <= 0) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      await createTransaction({
        account_id: newTransaction.accountId,
        type: newTransaction.type,
        category: newTransaction.category,
        amount: newTransaction.amount,
        description: newTransaction.description,
        date: newTransaction.date
      });

      const account = accounts.find(a => a.id === newTransaction.accountId);
      if (account) {
        const newBalance = newTransaction.type === 'income'
          ? account.balance + newTransaction.amount
          : account.balance - newTransaction.amount;
        await updateCashAccount(account.id, { balance: newBalance });
      }

      await loadData();
      setNewTransaction({
        accountId: '',
        type: 'income',
        category: '',
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowNewTransactionForm(false);
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      alert('Erro ao criar transação');
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const accountMatch = selectedAccount === 'all' || transaction.accountId === selectedAccount;
    const typeMatch = transactionFilter === 'all' || transaction.type === transactionFilter;
    const dateMatch = !dateFilter || transaction.date.includes(dateFilter);
    return accountMatch && typeMatch && dateMatch;
  });

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Saldo Total</p>
              <p className="text-2xl font-bold text-blue-800">{formatCurrency(totalBalance)}</p>
            </div>
            <DollarSign className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Total Entradas</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(totalIncome)}</p>
            </div>
            <ArrowUpRight className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Total Saídas</p>
              <p className="text-2xl font-bold text-red-800">{formatCurrency(totalExpense)}</p>
            </div>
            <ArrowDownLeft className="text-red-600" size={24} />
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Saldo Líquido</p>
              <p className="text-2xl font-bold text-purple-800">{formatCurrency(totalIncome - totalExpense)}</p>
            </div>
            <TrendingUp className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      {/* Contas */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Contas</h2>
          <button
            onClick={() => setShowNewAccountForm(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Nova Conta
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                {getAccountTypeIcon(account.type)}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  account.type === 'cash' ? 'bg-green-100 text-green-800' :
                  account.type === 'bank' ? 'bg-blue-100 text-blue-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {getAccountTypeText(account.type)}
                </span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">{account.name}</h3>
              <div className="text-xl font-bold text-gray-900 mb-2">
                {formatCurrency(account.balance)}
              </div>
              <div className="text-xs text-gray-500">
                Atualizado em {formatDate(account.updatedAt)}
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => handleEditAccount(account)}
                  disabled={!canEditAccounts}
                  className={`flex-1 px-2 py-1 border rounded text-sm transition-colors ${
                    canEditAccounts
                      ? 'text-blue-600 border-blue-200 hover:bg-blue-50'
                      : 'text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                  title={!canEditAccounts ? 'Apenas administradores podem editar contas' : 'Editar conta'}
                >
                  <Edit size={12} className="inline mr-1" />
                  Editar
                </button>
                <button
                  disabled={!canEditAccounts}
                  className={`px-2 py-1 border rounded text-sm transition-colors ${
                    canEditAccounts
                      ? 'text-red-600 border-red-200 hover:bg-red-50'
                      : 'text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                  }`}
                  title={!canEditAccounts ? 'Apenas administradores podem excluir contas' : 'Excluir conta'}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Formulário Nova Conta */}
        {showNewAccountForm && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Nova Conta</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Conta</label>
                <input
                  type="text"
                  value={newAccount.name}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Banco do Brasil - CC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={newAccount.type}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, type: e.target.value as CashAccount['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Caixa</option>
                  <option value="bank">Banco</option>
                  <option value="investment">Investimento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Saldo Inicial</label>
                <input
                  type="number"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount(prev => ({ ...prev, balance: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Conta
              </button>
              <button
                onClick={() => setShowNewAccountForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Formulário Editar Conta */}
        {editingAccount && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-300 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center">
              <Edit size={16} className="mr-2 text-blue-600" />
              Editar Conta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Conta</label>
                <input
                  type="text"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Banco do Brasil - CC"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={editingAccount.type}
                  onChange={(e) => setEditingAccount(prev => prev ? { ...prev, type: e.target.value as CashAccount['type'] } : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="cash">Caixa</option>
                  <option value="bank">Banco</option>
                  <option value="investment">Investimento</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Atual
                  <span className="ml-2 text-xs text-amber-600 font-normal">
                    ⚠️ Cuidado ao alterar
                  </span>
                </label>
                <input
                  type="number"
                  value={editingAccount.balance}
                  onChange={(e) => setEditingAccount(prev => prev ? { ...prev, balance: Number(e.target.value) } : null)}
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent bg-amber-50"
                  placeholder="0.00"
                  step="0.01"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Altere o saldo apenas se houver um erro. Use transações para movimentar valores.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleUpdateAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar Alterações
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transações */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Transações</h2>
          <button
            onClick={() => setShowNewTransactionForm(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Nova Transação
          </button>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as Contas</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>{account.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
            <select
              value={transactionFilter}
              onChange={(e) => setTransactionFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos os Tipos</option>
              <option value="income">Entradas</option>
              <option value="expense">Saídas</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
            <input
              type="month"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedAccount('all');
                setTransactionFilter('all');
                setDateFilter('');
              }}
              className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>

        {/* Lista de Transações */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Data</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Descrição</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Categoria</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Conta</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Valor</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => {
                const account = accounts.find(a => a.id === transaction.accountId);
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getTransactionIcon(transaction.type)}
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.description}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {transaction.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {account?.name || 'Conta não encontrada'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                          <Edit size={16} />
                        </button>
                        <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Formulário Nova Transação */}
        {showNewTransactionForm && (
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Nova Transação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Conta</label>
                <select
                  value={newTransaction.accountId}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma conta</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction(prev => ({ 
                    ...prev, 
                    type: e.target.value as Transaction['type'],
                    category: '' // Reset category when type changes
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="income">Entrada</option>
                  <option value="expense">Saída</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  {TRANSACTION_CATEGORIES[newTransaction.type].map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Valor</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Data</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição da transação"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateTransaction}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Criar Transação
              </button>
              <button
                onClick={() => setShowNewTransactionForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CashBankManagement;