import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Loan } from '../types';

export const useLoans = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          clients!inner(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedLoans: Loan[] = data.map(loan => ({
        id: loan.id,
        clientId: loan.client_id,
        clientName: loan.clients.name,
        amount: loan.amount,
        interestRate: loan.interest_rate,
        installments: loan.installments,
        installmentValue: loan.installment_value,
        totalAmount: loan.total_amount,
        startDate: loan.start_date,
        endDate: loan.end_date,
        status: loan.status,
        paidInstallments: loan.paid_installments,
        remainingAmount: loan.remaining_amount,
        notes: loan.notes,
        createdAt: loan.created_at,
        updatedAt: loan.updated_at
      }));

      setLoans(formattedLoans);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar empréstimos');
    } finally {
      setLoading(false);
    }
  };

  const createLoan = async (loanData: Partial<Loan>) => {
    try {
      // Usar o serviço que cria empréstimo + parcelas + transações automaticamente
      const { createLoan: createLoanService } = await import('../services/loans');

      const result = await createLoanService({
        client_id: loanData.clientId!,
        amount: loanData.amount!,
        interest_rate: loanData.interestRate!,
        installments: loanData.installments!,
        installment_value: loanData.installmentValue!,
        total_amount: loanData.totalAmount!,
        start_date: loanData.startDate!,
        end_date: loanData.endDate!,
        remaining_amount: loanData.remainingAmount!,
        account_id: (loanData as any).accountId,
        status: loanData.status || 'active',
        paid_installments: loanData.paidInstallments || 0,
        notes: loanData.notes || null,
        installment_plan: loanData.installmentPlan || null
      });

      console.log('✅ [HOOK] Empréstimo criado com sucesso:', result);

      // Recarregar lista de empréstimos
      await fetchLoans();

      // Disparar evento para notificar outros componentes
      console.log('📢 [HOOK] Disparando evento loan-created para:', result.id);
      const event = new CustomEvent('loan-created', {
        detail: { loanId: result.id }
      });
      window.dispatchEvent(event);
      console.log('✅ [HOOK] Evento loan-created disparado com sucesso');

      return result;
    } catch (err) {
      console.error('❌ Erro ao criar empréstimo:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar empréstimo');
      throw err;
    }
  };

  const updateLoan = async (id: string, loanData: Partial<Loan>) => {
    try {
      const { data, error } = await supabase
        .from('loans')
        .update({
          amount: loanData.amount,
          interest_rate: loanData.interestRate,
          installments: loanData.installments,
          installment_value: loanData.installmentValue,
          total_amount: loanData.totalAmount,
          start_date: loanData.startDate,
          end_date: loanData.endDate,
          status: loanData.status,
          paid_installments: loanData.paidInstallments,
          remaining_amount: loanData.remainingAmount,
          notes: loanData.notes,
          installment_plan: loanData.installmentPlan,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchLoans(); // Recarregar lista
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar empréstimo');
      throw err;
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return {
    loans,
    loading,
    error,
    createLoan,
    updateLoan,
    refetch: fetchLoans
  };
};