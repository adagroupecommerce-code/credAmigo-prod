import React, { useState } from 'react';
import { Calculator, DollarSign, Clock, Percent } from 'lucide-react';

const LoanCalculator = () => {
  const [amount, setAmount] = useState(10000);
  const [interestRate, setInterestRate] = useState(2.5);
  const [installments, setInstallments] = useState(12);
  const [result, setResult] = useState<{
    installmentValue: number;
    totalAmount: number;
    totalInterest: number;
  } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateLoan = () => {
    const monthlyRate = interestRate / 100;
    const installmentValue = (amount * monthlyRate * Math.pow(1 + monthlyRate, installments)) / 
                            (Math.pow(1 + monthlyRate, installments) - 1);
    const totalAmount = installmentValue * installments;
    const totalInterest = totalAmount - amount;

    setResult({
      installmentValue,
      totalAmount,
      totalInterest
    });
  };

  React.useEffect(() => {
    calculateLoan();
  }, [amount, interestRate, installments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <Calculator className="text-blue-600" size={28} />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Simulador de Empréstimos</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Dados do Empréstimo</h2>
          
          <div className="space-y-4 sm:space-y-6">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline mr-2" size={16} />
                Valor do Empréstimo
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="Ex: 10000"
                min="100"
              />
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                Valor: {formatCurrency(amount)}
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Percent className="inline mr-2" size={16} />
                Taxa de Juros (% ao mês)
              </label>
              <input
                type="number"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                step="0.1"
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="Ex: 2.5"
                min="0.1"
                max="20"
              />
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                Taxa anual equivalente: {(((1 + interestRate/100) ** 12 - 1) * 100).toFixed(2)}%
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <Clock className="inline mr-2" size={16} />
                Número de Parcelas
              </label>
              <input
                type="number"
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
                placeholder="Ex: 12"
                min="1"
                max="60"
              />
              <div className="text-xs sm:text-sm text-gray-500 mt-1">
                Prazo: {installments} meses ({Math.round(installments/12 * 10)/10} anos)
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Resultado da Simulação</h2>
          
          {result && (
            <div className="space-y-4 sm:space-y-6">
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-xs sm:text-sm text-blue-600 font-medium mb-1">Valor da Parcela</div>
                <div className="text-xl sm:text-2xl font-bold text-blue-800">
                  {formatCurrency(result.installmentValue)}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div className="flex justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-600">Valor Emprestado</span>
                  <span className="text-xs sm:text-sm font-medium">{formatCurrency(amount)}</span>
                </div>
                <div className="flex justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-600">Total de Juros</span>
                  <span className="text-xs sm:text-sm font-medium text-orange-600">{formatCurrency(result.totalInterest)}</span>
                </div>
                <div className="flex justify-between p-2 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                  <span className="text-xs sm:text-sm text-green-700 font-medium">Valor Total</span>
                  <span className="text-xs sm:text-sm font-bold text-green-800">{formatCurrency(result.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <h3 className="text-sm sm:text-base font-medium text-gray-900 mb-2 sm:mb-3">Resumo do Empréstimo</h3>
                <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                  <div>• Valor da parcela: {formatCurrency(result.installmentValue)}</div>
                  <div>• Número de parcelas: {installments} meses</div>
                  <div>• Taxa de juros: {interestRate}% ao mês</div>
                  <div>• Total de juros pagos: {formatCurrency(result.totalInterest)}</div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                <div className="text-xs sm:text-sm text-yellow-800">
                  <strong>Observação:</strong> Esta é uma simulação. Os valores podem variar de acordo com a análise de crédito e condições específicas.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoanCalculator;