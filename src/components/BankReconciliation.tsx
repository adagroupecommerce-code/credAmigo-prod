import React, { useState, useEffect } from 'react';
import { CheckCircle, X, RefreshCw, AlertTriangle, DollarSign, Calendar, FileText, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  reconciled: boolean;
  reconciled_date?: string;
  bank_reference?: string;
}

interface BankReconciliationProps {
  accountId: string;
  accountName: string;
  onClose: () => void;
}

const BankReconciliation: React.FC<BankReconciliationProps> = ({ accountId, accountName, onClose }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bankBalance, setBankBalance] = useState('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showOnlyUnreconciled, setShowOnlyUnreconciled] = useState(true);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchTransactions();
    }
  }, [startDate, endDate, accountId, showOnlyUnreconciled]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('account_id', accountId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

      if (showOnlyUnreconciled) {
        query = query.eq('reconciled', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTransaction = (id: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const reconcileSelected = async () => {
    if (selectedTransactions.size === 0) {
      alert('Selecione ao menos uma transação para conciliar');
      return;
    }

    const confirmReconcile = window.confirm(
      `Confirmar conciliação de ${selectedTransactions.size} transação(ões)?`
    );

    if (!confirmReconcile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: true,
          reconciled_date: new Date().toISOString().split('T')[0]
        })
        .in('id', Array.from(selectedTransactions));

      if (error) throw error;

      alert('Transações conciliadas com sucesso!');
      setSelectedTransactions(new Set());
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao conciliar transações:', error);
      alert('Erro ao conciliar transações');
    } finally {
      setLoading(false);
    }
  };

  const undoReconciliation = async (transactionId: string) => {
    const confirmUndo = window.confirm('Desfazer conciliação desta transação?');
    if (!confirmUndo) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          reconciled: false,
          reconciled_date: null
        })
        .eq('id', transactionId);

      if (error) throw error;

      alert('Conciliação desfeita com sucesso!');
      fetchTransactions();
    } catch (error) {
      console.error('Erro ao desfazer conciliação:', error);
      alert('Erro ao desfazer conciliação');
    } finally {
      setLoading(false);
    }
  };

  const systemBalance = transactions.reduce((acc, tx) => {
    const amount = Number(tx.amount);
    return acc + (tx.type === 'income' ? amount : -amount);
  }, 0);

  const selectedBalance = transactions
    .filter(tx => selectedTransactions.has(tx.id))
    .reduce((acc, tx) => {
      const amount = Number(tx.amount);
      return acc + (tx.type === 'income' ? amount : -amount);
    }, 0);

  const reconciledCount = transactions.filter(tx => tx.reconciled).length;
  const unreconciledCount = transactions.filter(tx => !tx.reconciled).length;

  const bankBalanceNum = bankBalance ? Number(bankBalance) : 0;
  const difference = bankBalanceNum - systemBalance;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Conciliação Bancária</h2>
              <p className="text-blue-100 mt-1">{accountName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 p-2 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Saldo do Extrato Bancário
              </label>
              <input
                type="number"
                step="0.01"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-700">Saldo Sistema</span>
                <DollarSign className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-blue-900 mt-2">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(systemBalance)}
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-700">Conciliadas</span>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-xl font-bold text-green-900 mt-2">{reconciledCount}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-700">Pendentes</span>
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <p className="text-xl font-bold text-orange-900 mt-2">{unreconciledCount}</p>
            </div>

            <div className={`p-4 rounded-lg border ${Math.abs(difference) < 0.01 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${Math.abs(difference) < 0.01 ? 'text-green-700' : 'text-red-700'}`}>
                  Diferença
                </span>
                <RefreshCw className={`w-4 h-4 ${Math.abs(difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
              <p className={`text-xl font-bold mt-2 ${Math.abs(difference) < 0.01 ? 'text-green-900' : 'text-red-900'}`}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(difference)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnlyUnreconciled}
                  onChange={(e) => setShowOnlyUnreconciled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Mostrar apenas não conciliadas
                </span>
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={fetchTransactions}
                disabled={loading}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={reconcileSelected}
                disabled={loading || selectedTransactions.size === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Conciliar Selecionadas ({selectedTransactions.size})
              </button>
            </div>
          </div>

          {selectedTransactions.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-blue-900">
                    {selectedTransactions.size} transação(ões) selecionada(s)
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Valor total: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedBalance)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTransactions(new Set())}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Limpar seleção
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTransactions(new Set(transactions.filter(tx => !tx.reconciled).map(tx => tx.id)));
                          } else {
                            setSelectedTransactions(new Set());
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Carregando transações...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Nenhuma transação encontrada para o período selecionado
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className={`hover:bg-gray-50 ${tx.reconciled ? 'bg-green-50' : ''} ${selectedTransactions.has(tx.id) ? 'bg-blue-50' : ''}`}
                      >
                        <td className="px-4 py-3">
                          {!tx.reconciled && (
                            <input
                              type="checkbox"
                              checked={selectedTransactions.has(tx.id)}
                              onChange={() => toggleTransaction(tx.id)}
                              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {new Date(tx.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">{tx.description}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{tx.category}</td>
                        <td className={`px-4 py-3 text-sm text-right font-medium ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.type === 'income' ? '+' : '-'}
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(tx.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.reconciled ? (
                            <div className="flex items-center justify-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-xs text-green-600 font-medium">Conciliada</span>
                            </div>
                          ) : (
                            <span className="text-xs text-orange-600 font-medium">Pendente</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {tx.reconciled && (
                            <button
                              onClick={() => undoReconciliation(tx.id)}
                              className="text-red-600 hover:text-red-800 text-xs font-medium"
                            >
                              Desfazer
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankReconciliation;
