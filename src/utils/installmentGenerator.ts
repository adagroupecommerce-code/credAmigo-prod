/**
 * Gerador de Parcelas para Empréstimos
 * Implementa o Sistema de Amortização Constante (SAC)
 */

interface LoanData {
  id: string;
  amount: number;
  interestRate: number;
  installments: number;
  startDate: string; // ISO date
}

export interface InstallmentData {
  loan_id: string;
  installment_number: number;
  amount: number;
  principal_amount: number;
  interest_amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue';
}

/**
 * Gera todas as parcelas de um empréstimo usando SAC
 */
export function generateInstallments(loan: LoanData): InstallmentData[] {
  const { id, amount, interestRate, installments, startDate } = loan;

  // Amortização constante = Principal / Número de parcelas
  const principalPerInstallment = amount / installments;

  // Taxa de juros mensal (assume que vem em % ao mês)
  const monthlyRate = interestRate / 100;

  const installmentsData: InstallmentData[] = [];
  let remainingPrincipal = amount;

  for (let i = 1; i <= installments; i++) {
    // Juros sobre o saldo devedor
    const interestAmount = remainingPrincipal * monthlyRate;

    // Valor da parcela = Amortização + Juros
    const installmentAmount = principalPerInstallment + interestAmount;

    // Calcular data de vencimento (adiciona meses à data inicial)
    const dueDate = addMonths(startDate, i);

    installmentsData.push({
      loan_id: id,
      installment_number: i,
      amount: Number(installmentAmount.toFixed(2)),
      principal_amount: Number(principalPerInstallment.toFixed(2)),
      interest_amount: Number(interestAmount.toFixed(2)),
      due_date: dueDate,
      status: 'pending'
    });

    // Reduz o saldo devedor
    remainingPrincipal -= principalPerInstallment;
  }

  return installmentsData;
}

/**
 * Adiciona meses a uma data ISO
 */
function addMonths(dateStr: string, months: number): string {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0]; // Retorna apenas YYYY-MM-DD
}

/**
 * Calcula o status da parcela baseado na data de vencimento
 */
export function calculatePaymentStatus(dueDate: string, paymentDate: string | null): 'pending' | 'paid' | 'overdue' {
  if (paymentDate) {
    return 'paid';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  return due < today ? 'overdue' : 'pending';
}
