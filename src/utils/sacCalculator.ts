// Sistema de Cálculo SAC (Sistema de Amortização Constante)
// com arredondamento comercial para múltiplos de R$ 5

export interface SACParams {
  principal: number;
  installments: number;
  interestRate: number; // taxa decimal (ex: 0.25 para 25%)
  discountCashPayment?: number; // desconto à vista (ex: 0.992 para 0.8% desconto)
}

export interface SACInstallment {
  installmentNumber: number;
  initialBalance: number;
  amortization: number;
  interest: number;
  grossInstallment: number;
  finalInstallment: number;
  finalBalance: number;
}

export interface SACResult {
  installments: SACInstallment[];
  totalGross: number;
  totalFinal: number;
  cashPayment30Days?: number;
}

// Função de arredondamento para múltiplos de 5
function roundToMultipleOf5(value: number, mode: 'nearest_up_if_half' | 'nearest' = 'nearest_up_if_half'): number {
  const remainder = value % 5;
  
  if (remainder === 0) {
    return value;
  }
  
  const lowerMultiple = value - remainder;
  const upperMultiple = lowerMultiple + 5;
  
  if (mode === 'nearest_up_if_half') {
    // Se a diferença for exatamente 2.5, arredonda para cima
    if (Math.abs(remainder - 2.5) < 0.01) {
      return upperMultiple;
    }
    // Caso contrário, arredonda para o mais próximo
    return remainder < 2.5 ? lowerMultiple : upperMultiple;
  }
  
  return remainder < 2.5 ? lowerMultiple : upperMultiple;
}

// Função principal de cálculo SAC
export function calculateSAC(params: SACParams): SACResult {
  const { principal, installments, interestRate, discountCashPayment = 1.0 } = params;
  
  // Cálculo da amortização constante
  const constantAmortization = principal / installments;
  
  const installmentsList: SACInstallment[] = [];
  let currentBalance = principal;
  
  // Calcular parcelas brutas
  for (let k = 1; k <= installments; k++) {
    const initialBalance = principal - (k - 1) * constantAmortization;
    const interest = interestRate * initialBalance;
    const grossInstallment = constantAmortization + interest;
    
    installmentsList.push({
      installmentNumber: k,
      initialBalance,
      amortization: constantAmortization,
      interest,
      grossInstallment,
      finalInstallment: 0, // Será calculado depois
      finalBalance: initialBalance - constantAmortization
    });
  }
  
  // Aplicar arredondamento nas primeiras N-1 parcelas
  let totalRoundedExceptLast = 0;
  const totalGross = installmentsList.reduce((sum, inst) => sum + inst.grossInstallment, 0);
  
  for (let i = 0; i < installments - 1; i++) {
    const rounded = roundToMultipleOf5(installmentsList[i].grossInstallment);
    installmentsList[i].finalInstallment = rounded;
    totalRoundedExceptLast += rounded;
  }
  
  // Calcular a última parcela para manter o total
  const lastInstallmentFinal = roundToMultipleOf5(totalGross - totalRoundedExceptLast);
  installmentsList[installments - 1].finalInstallment = lastInstallmentFinal;
  
  // Verificar e ajustar ordem decrescente se necessário
  adjustDescendingOrder(installmentsList);
  
  // Recalcular saldos finais e amortizações com base nas parcelas finais
  let remainingBalance = principal;
  for (let i = 0; i < installments; i++) {
    const installment = installmentsList[i];
    const interestPortion = interestRate * remainingBalance;
    const amortizationPortion = installment.finalInstallment - interestPortion;
    
    installment.interest = interestPortion;
    installment.amortization = amortizationPortion;
    installment.initialBalance = remainingBalance;
    remainingBalance -= amortizationPortion;
    installment.finalBalance = Math.max(0, remainingBalance);
  }
  
  const totalFinal = installmentsList.reduce((sum, inst) => sum + inst.finalInstallment, 0);
  
  // Cálculo à vista 30 dias
  const cashPayment30Days = discountCashPayment !== 1.0 
    ? roundToMultipleOf5(principal * (1 + interestRate) * discountCashPayment)
    : roundToMultipleOf5(principal * (1 + interestRate));
  
  return {
    installments: installmentsList,
    totalGross,
    totalFinal,
    cashPayment30Days
  };
}

// Função para ajustar ordem decrescente
function adjustDescendingOrder(installments: SACInstallment[]): void {
  for (let i = 0; i < installments.length - 1; i++) {
    if (installments[i].finalInstallment < installments[i + 1].finalInstallment) {
      // Violação da ordem decrescente - ajustar ±R$5
      const difference = installments[i + 1].finalInstallment - installments[i].finalInstallment;
      
      if (difference <= 10) { // Permitir ajuste de até R$10
        const adjustment = Math.ceil(difference / 10) * 5; // Arredondar para múltiplo de 5
        installments[i].finalInstallment += adjustment;
        installments[i + 1].finalInstallment -= adjustment;
      }
    }
  }
}

// Presets predefinidos baseados na tabela de referência
export const LOAN_PRESETS = {
  500: {
    cashPayment: 625,
    installments: {
      2: [375, 315]
    }
  },
  750: {
    cashPayment: 930,
    installments: {
      2: [560, 470],
      3: [440, 375, 315]
    }
  },
  1000: {
    cashPayment: 1250,
    installments: {
      2: [750, 625],
      3: [580, 500, 420],
      4: [500, 440, 375, 315]
    }
  }
};

// Função para obter preset ou calcular dinamicamente
export function getInstallmentPlan(principal: number, installments: number, interestRate: number = 0.25): number[] {
  // Verificar se existe preset
  const preset = LOAN_PRESETS[principal as keyof typeof LOAN_PRESETS];
  if (preset && preset.installments[installments as keyof typeof preset.installments]) {
    return preset.installments[installments as keyof typeof preset.installments];
  }
  
  // Calcular dinamicamente usando SAC
  const result = calculateSAC({
    principal,
    installments,
    interestRate
  });
  
  return result.installments.map(inst => inst.finalInstallment);
}

// Função para calcular breakdown de capital e juros
export function calculateCapitalInterestBreakdown(
  principal: number, 
  installmentValues: number[], 
  interestRate: number = 0.25
): Array<{ capital: number; interest: number; total: number }> {
  const breakdown: Array<{ capital: number; interest: number; total: number }> = [];
  let remainingBalance = principal;
  
  installmentValues.forEach((installmentValue, index) => {
    const interestPortion = remainingBalance * interestRate;
    const capitalPortion = installmentValue - interestPortion;
    
    breakdown.push({
      capital: Math.round(capitalPortion * 100) / 100,
      interest: Math.round(interestPortion * 100) / 100,
      total: installmentValue
    });
    
    remainingBalance -= capitalPortion;
  });
  
  return breakdown;
}