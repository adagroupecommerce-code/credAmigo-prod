import { Loan, Payment } from '../types';
import { supabase } from '../lib/supabase';

// Interface para dados de pagamento
export interface PaymentData {
  paymentDate: string;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  penaltyPaid?: number;
}

// Interface para resultado de processamento de pagamento
export interface PaymentProcessResult {
  success: boolean;
  error?: string;
  updatedLoan?: Loan;
  paymentId?: string;
  isPartialPayment?: boolean;
  isOverpayment?: boolean;
  excessAmount?: number;
}

// Função para validar dados de pagamento
export const validatePaymentData = (paymentData: PaymentData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Validar data de pagamento
  if (!paymentData.paymentDate) {
    errors.push('Data de pagamento é obrigatória');
  } else {
    const paymentDate = new Date(paymentData.paymentDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Permitir pagamentos até o final do dia atual
    if (paymentDate > today) {
      errors.push('Data de pagamento não pode ser futura');
    }
  }
  
  // Validar valores
  if (paymentData.totalPaid <= 0) {
    errors.push('Valor total pago deve ser maior que zero');
  }
  
  if (paymentData.principalPaid < 0) {
    errors.push('Valor do capital não pode ser negativo');
  }
  
  if (paymentData.interestPaid < 0) {
    errors.push('Valor dos juros não pode ser negativo');
  }
  
  if (paymentData.penaltyPaid && paymentData.penaltyPaid < 0) {
    errors.push('Valor da multa não pode ser negativo');
  }
  
  // Verificar se a soma confere (com tolerância de 1 centavo para arredondamentos)
  const calculatedTotal = paymentData.principalPaid + paymentData.interestPaid + (paymentData.penaltyPaid || 0);
  if (Math.abs(calculatedTotal - paymentData.totalPaid) > 0.01) {
    errors.push('Total pago deve ser igual à soma de capital + juros + multa');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Função para registrar pagamento no Supabase
export const registerPayment = async (
  loanId: string,
  installmentNumber: number,
  paymentData: PaymentData
): Promise<{ success: boolean; error?: string; paymentId?: string }> => {
  try {
    // Validar dados antes de registrar
    const validation = validatePaymentData(paymentData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.errors.join(', ')}`
      };
    }

    // Buscar a parcela existente
    const { data: existingPayment, error: searchError } = await supabase
      .from('payments')
      .select('*')
      .eq('loan_id', loanId)
      .eq('installment_number', installmentNumber)
      .maybeSingle();

    if (searchError) {
      throw searchError;
    }

    let paymentRecord;

    if (existingPayment) {
      // Atualizar pagamento existente (para pagamentos parciais subsequentes)
      const newTotalAmount = existingPayment.amount + paymentData.totalPaid;
      const newPrincipalAmount = (existingPayment.principal_amount || 0) + paymentData.principalPaid;
      const newInterestAmount = (existingPayment.interest_amount || 0) + paymentData.interestPaid;
      const newPenalty = (existingPayment.penalty || 0) + (paymentData.penaltyPaid || 0);

      const { data, error } = await supabase
        .from('payments')
        .update({
          amount: newTotalAmount,
          principal_amount: newPrincipalAmount,
          interest_amount: newInterestAmount,
          penalty: newPenalty,
          payment_date: paymentData.paymentDate,
          status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPayment.id)
        .select()
        .single();

      if (error) throw error;
      paymentRecord = data;
    } else {
      // Criar novo registro de pagamento
      const { data, error } = await supabase
        .from('payments')
        .insert({
          loan_id: loanId,
          installment_number: installmentNumber,
          amount: paymentData.totalPaid,
          principal_amount: paymentData.principalPaid,
          interest_amount: paymentData.interestPaid,
          penalty: paymentData.penaltyPaid || 0,
          due_date: new Date().toISOString().split('T')[0], // Será atualizado com a data correta
          payment_date: paymentData.paymentDate,
          status: 'paid'
        })
        .select()
        .single();

      if (error) throw error;
      paymentRecord = data;
    }

    return {
      success: true,
      paymentId: paymentRecord.id
    };
  } catch (error) {
    console.error('Erro ao registrar pagamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao registrar pagamento'
    };
  }
};

// Função para atualizar empréstimo no Supabase
export const updateLoanInDatabase = async (loan: Loan): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('loans')
      .update({
        amount: loan.amount,
        interest_rate: loan.interestRate,
        installments: loan.installments,
        installment_value: loan.installmentValue,
        total_amount: loan.totalAmount,
        start_date: loan.startDate,
        end_date: loan.endDate,
        status: loan.status,
        paid_installments: loan.paidInstallments,
        remaining_amount: loan.remainingAmount,
        notes: loan.notes,
        installment_plan: loan.installmentPlan,
        updated_at: new Date().toISOString()
      })
      .eq('id', loan.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar empréstimo:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar empréstimo'
    };
  }
};

// Função principal para processar pagamento (corrigida)
export const processPayment = async (
  loan: Loan,
  installmentNumber: number,
  paymentData: PaymentData
): Promise<PaymentProcessResult> => {
  try {
    // 1. Validar dados de pagamento
    const validation = validatePaymentData(paymentData);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Dados inválidos: ${validation.errors.join(', ')}`
      };
    }

    // 2. Garantir que installmentPlan existe
    const updatedLoan = { ...loan };
    if (!updatedLoan.installmentPlan) {
      updatedLoan.installmentPlan = generateDefaultInstallmentPlan(loan);
    }

    // 3. Encontrar a parcela específica
    const installmentIndex = updatedLoan.installmentPlan.findIndex(
      inst => inst.installmentNumber === installmentNumber
    );

    if (installmentIndex === -1) {
      return {
        success: false,
        error: 'Parcela não encontrada no plano de pagamentos'
      };
    }

    const installment = updatedLoan.installmentPlan[installmentIndex];
    const expectedAmount = installment.totalAmount;
    const alreadyPaid = installment.paidAmountForThisInstallment || 0;
    const remainingForThisInstallment = expectedAmount - alreadyPaid;

    // 4. Determinar tipo de pagamento
    const isPartialPayment = paymentData.totalPaid < remainingForThisInstallment;
    const isOverpayment = paymentData.totalPaid > remainingForThisInstallment;
    const excessAmount = isOverpayment ? paymentData.totalPaid - remainingForThisInstallment : 0;

    // 5. Registrar pagamento na tabela payments
    const paymentResult = await registerPayment(loan.id, installmentNumber, paymentData);
    if (!paymentResult.success) {
      return {
        success: false,
        error: paymentResult.error
      };
    }

    // 6. Atualizar a parcela no installmentPlan
    const newPaidAmount = alreadyPaid + paymentData.totalPaid;
    const newRemainingAmount = Math.max(0, expectedAmount - newPaidAmount);

    updatedLoan.installmentPlan[installmentIndex] = {
      ...installment,
      status: newRemainingAmount <= 0.01 ? 'paid' : 'partially_paid', // Tolerância de 1 centavo
      paymentDate: paymentData.paymentDate,
      paidAmountForThisInstallment: newPaidAmount,
      remainingAmountForThisInstallment: newRemainingAmount
    };

    // 7. Recalcular métricas do empréstimo
    const fullyPaidInstallments = updatedLoan.installmentPlan.filter(inst => 
      inst.status === 'paid'
    ).length;
    
    const totalRemainingAmount = updatedLoan.installmentPlan.reduce((sum, inst) => 
      sum + (inst.remainingAmountForThisInstallment || 0), 0
    );

    updatedLoan.paidInstallments = fullyPaidInstallments;
    updatedLoan.remainingAmount = Math.round(totalRemainingAmount * 100) / 100;

    // Verificar se empréstimo foi completamente pago
    if (totalRemainingAmount <= 0.01) {
      updatedLoan.status = 'completed';
    }

    // 8. Atualizar empréstimo no banco
    const loanUpdateResult = await updateLoanInDatabase(updatedLoan);
    if (!loanUpdateResult.success) {
      return {
        success: false,
        error: loanUpdateResult.error
      };
    }

    return {
      success: true,
      updatedLoan,
      paymentId: paymentResult.paymentId,
      isPartialPayment,
      isOverpayment,
      excessAmount
    };
  } catch (error) {
    console.error('Erro no processamento do pagamento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido no processamento'
    };
  }
};

// Função para gerar plano de parcelas padrão se não existir
const generateDefaultInstallmentPlan = (loan: Loan) => {
  const startDate = new Date(loan.startDate);
  const monthlyRate = loan.interestRate / 100;
  let remainingBalance = loan.amount;
  const installmentPlan = [];

  for (let i = 1; i <= loan.installments; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    
    const interestAmount = remainingBalance * monthlyRate;
    const principalAmount = loan.installmentValue - interestAmount;
    remainingBalance -= principalAmount;

    // Determinar status baseado em paidInstallments
    let status: 'pending' | 'paid' | 'overdue' = 'pending';
    if (i <= loan.paidInstallments) {
      status = 'paid';
    } else if (dueDate < new Date()) {
      status = 'overdue';
    }

    installmentPlan.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().split('T')[0],
      principalAmount: Math.round(principalAmount * 100) / 100,
      interestAmount: Math.round(interestAmount * 100) / 100,
      totalAmount: loan.installmentValue,
      remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
      status,
      paymentDate: status === 'paid' ? dueDate.toISOString().split('T')[0] : undefined,
      paidAmountForThisInstallment: status === 'paid' ? loan.installmentValue : 0,
      remainingAmountForThisInstallment: status === 'paid' ? 0 : loan.installmentValue
    });
  }

  return installmentPlan;
};

// Função atualizada para gerar pagamentos a partir do empréstimo
export const generatePaymentsFromLoan = (loan: Loan): Payment[] => {
  const payments: Payment[] = [];
  
  // Priorizar o plano de parcelas customizado se existir
  if (loan.installmentPlan && loan.installmentPlan.length > 0) {
    loan.installmentPlan.forEach((installment) => {
      // Calcular multa para parcelas vencidas
      let penalty: number | undefined;
      if (installment.status === 'overdue' || 
          (installment.status === 'partially_paid' && new Date(installment.dueDate) < new Date())) {
        const daysOverdue = Math.floor((new Date().getTime() - new Date(installment.dueDate).getTime()) / (1000 * 60 * 60 * 24));
        if (daysOverdue > 0) {
          const baseAmount = installment.remainingAmountForThisInstallment || installment.totalAmount;
          penalty = baseAmount * 0.02 + (daysOverdue * baseAmount * 0.001); // 2% + 0.1% por dia
        }
      }
      
      payments.push({
        id: `${loan.id}-${installment.installmentNumber}`,
        loanId: loan.id,
        installmentNumber: installment.installmentNumber,
        amount: installment.remainingAmountForThisInstallment || installment.totalAmount,
        principalAmount: installment.principalAmount,
        interestAmount: installment.interestAmount,
        dueDate: installment.dueDate,
        status: installment.status === 'partially_paid' ? 'pending' : installment.status || 'pending',
        paymentDate: installment.paymentDate,
        penalty
      });
    });
  } else {
    // Fallback: usar cálculo automático se não houver plano customizado
    const startDate = new Date(loan.startDate);
    const monthlyRate = loan.interestRate / 100;
    let remainingBalance = loan.amount;
    
    for (let i = 1; i <= loan.installments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      
      const interestAmount = remainingBalance * monthlyRate;
      const principalAmount = loan.installmentValue - interestAmount;
      remainingBalance -= principalAmount;
      
      let status: Payment['status'] = 'pending';
      let paymentDate: string | undefined;
      
      if (i <= loan.paidInstallments) {
        status = 'paid';
        const paidDate = new Date(dueDate);
        paidDate.setDate(paidDate.getDate() - Math.floor(Math.random() * 5));
        paymentDate = paidDate.toISOString().split('T')[0];
      } else if (dueDate < new Date()) {
        status = 'overdue';
      }
      
      let penalty: number | undefined;
      if (status === 'overdue') {
        const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        penalty = loan.installmentValue * 0.02 + (daysOverdue * loan.installmentValue * 0.001);
      }
      
      payments.push({
        id: `${loan.id}-${i}`,
        loanId: loan.id,
        installmentNumber: i,
        amount: loan.installmentValue,
        principalAmount: Math.round(principalAmount * 100) / 100,
        interestAmount: Math.round(interestAmount * 100) / 100,
        dueDate: dueDate.toISOString().split('T')[0],
        status,
        paymentDate,
        penalty
      });
    }
  }
  
  return payments;
};

// Função para calcular métricas de capital e juros (atualizada)
export const calculateCapitalInterestMetrics = (loan: Loan) => {
  let totalCapital = 0;
  let totalInterest = 0;
  let paidCapital = 0;
  let paidInterest = 0;
  
  if (loan.installmentPlan && loan.installmentPlan.length > 0) {
    loan.installmentPlan.forEach(installment => {
      totalCapital += installment.principalAmount;
      totalInterest += installment.interestAmount;
      
      // Calcular valores pagos baseado no status e valor pago
      if (installment.status === 'paid') {
        paidCapital += installment.principalAmount;
        paidInterest += installment.interestAmount;
      } else if (installment.status === 'partially_paid' && installment.paidAmountForThisInstallment) {
        // Para pagamentos parciais, distribuir proporcionalmente
        const paymentRatio = installment.paidAmountForThisInstallment / installment.totalAmount;
        paidCapital += installment.principalAmount * paymentRatio;
        paidInterest += installment.interestAmount * paymentRatio;
      }
    });
  } else {
    // Fallback para empréstimos sem installmentPlan
    const monthlyRate = loan.interestRate / 100;
    let remainingBalance = loan.amount;
    
    for (let i = 1; i <= loan.installments; i++) {
      const interestAmount = remainingBalance * monthlyRate;
      const principalAmount = loan.installmentValue - interestAmount;
      remainingBalance -= principalAmount;
      
      totalCapital += principalAmount;
      totalInterest += interestAmount;
      
      if (i <= loan.paidInstallments) {
        paidCapital += principalAmount;
        paidInterest += interestAmount;
      }
    }
  }
  
  return {
    totalCapital: Math.round(totalCapital * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    paidCapital: Math.round(paidCapital * 100) / 100,
    paidInterest: Math.round(paidInterest * 100) / 100,
    pendingCapital: Math.round((totalCapital - paidCapital) * 100) / 100,
    pendingInterest: Math.round((totalInterest - paidInterest) * 100) / 100,
    capitalReturnRate: totalCapital > 0 ? (paidCapital / totalCapital) * 100 : 0,
    interestEarnRate: totalInterest > 0 ? (paidInterest / totalInterest) * 100 : 0
  };
};

// Função para calcular métricas do cliente (atualizada)
export const calculateClientMetrics = (clientId: string, loans: Loan[]) => {
  const clientLoans = loans.filter(loan => loan.clientId === clientId);
  
  let totalBorrowed = 0;
  let totalPaid = 0;
  let onTimePayments = 0;
  let latePayments = 0;
  let totalDelayDays = 0;
  let activeLoans = 0;
  let completedLoans = 0;
  let defaultedLoans = 0;
  
  clientLoans.forEach(loan => {
    totalBorrowed += loan.amount;
    
    // Contar status dos empréstimos
    if (loan.status === 'active') activeLoans++;
    else if (loan.status === 'completed') completedLoans++;
    else if (loan.status === 'defaulted') defaultedLoans++;
    
    // Calcular métricas de pagamento baseado no installmentPlan
    if (loan.installmentPlan && loan.installmentPlan.length > 0) {
      loan.installmentPlan.forEach(installment => {
        const paidAmount = installment.paidAmountForThisInstallment || 0;
        totalPaid += paidAmount;
        
        // Verificar se foi pago em dia ou atrasado
        if (installment.status === 'paid' || installment.status === 'partially_paid') {
          if (installment.paymentDate) {
            const dueDate = new Date(installment.dueDate);
            const paymentDate = new Date(installment.paymentDate);
            const delayDays = Math.floor((paymentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (delayDays <= 0) {
              onTimePayments++;
            } else {
              latePayments++;
              totalDelayDays += delayDays;
            }
          } else {
            onTimePayments++; // Assumir em dia se não há data específica
          }
        }
      });
    } else {
      // Fallback para empréstimos sem installmentPlan
      const paidAmount = (loan.paidInstallments / loan.installments) * loan.totalAmount;
      totalPaid += paidAmount;
      onTimePayments += loan.paidInstallments;
    }
  });
  
  const averagePaymentDelay = latePayments > 0 ? Math.round(totalDelayDays / latePayments) : 0;
  
  return {
    totalLoans: clientLoans.length,
    activeLoans,
    completedLoans,
    defaultedLoans,
    totalBorrowed: Math.round(totalBorrowed * 100) / 100,
    totalPaid: Math.round(totalPaid * 100) / 100,
    onTimePayments,
    latePayments,
    averagePaymentDelay
  };
};

// Função para atualizar métricas do cliente no Supabase
export const updateClientMetricsInDatabase = async (
  clientId: string,
  metrics: {
    totalLoans: number;
    activeLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    totalBorrowed: number;
    totalPaid: number;
    onTimePayments: number;
    latePayments: number;
    averagePaymentDelay: number;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('clients')
      .update({
        total_loans: metrics.totalLoans,
        active_loans: metrics.activeLoans,
        completed_loans: metrics.completedLoans,
        defaulted_loans: metrics.defaultedLoans,
        total_borrowed: metrics.totalBorrowed,
        total_paid: metrics.totalPaid,
        on_time_payments: metrics.onTimePayments,
        late_payments: metrics.latePayments,
        average_payment_delay: metrics.averagePaymentDelay,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar métricas do cliente:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido ao atualizar cliente'
    };
  }
};

// Função para obter métricas consolidadas para dashboard
export const getDashboardMetrics = () => {
  const paymentRecords = JSON.parse(localStorage.getItem('payment_records') || '[]');
  
  const totalCapitalReturned = paymentRecords.reduce((sum: number, record: any) => sum + (record.capitalPaid || 0), 0);
  const totalInterestEarned = paymentRecords.reduce((sum: number, record: any) => sum + (record.interestPaid || 0), 0);
  const totalPaymentsReceived = paymentRecords.reduce((sum: number, record: any) => sum + (record.totalPaid || 0), 0);
  
  return {
    totalCapitalReturned: Math.round(totalCapitalReturned * 100) / 100,
    totalInterestEarned: Math.round(totalInterestEarned * 100) / 100,
    totalPaymentsReceived: Math.round(totalPaymentsReceived * 100) / 100,
    paymentCount: paymentRecords.length,
    partialPaymentCount: paymentRecords.filter((r: any) => r.isPartial).length
  };
};