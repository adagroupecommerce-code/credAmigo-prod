import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Client } from '../types';

export const useClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedClients: Client[] = data.map(client => ({
        id: client.id,
        name: client.name,
        cpf: client.cpf,
        email: client.email || '',
        phone: client.phone,
        residentialAddress: client.residential_address,
        workAddress: client.work_address,
        documents: client.documents,
        status: client.status,
        creditScore: client.credit_score,
        creditRating: client.credit_rating,
        totalLoans: client.total_loans,
        activeLoans: client.active_loans,
        completedLoans: client.completed_loans,
        defaultedLoans: client.defaulted_loans,
        totalBorrowed: client.total_borrowed,
        totalPaid: client.total_paid,
        onTimePayments: client.on_time_payments,
        latePayments: client.late_payments,
        averagePaymentDelay: client.average_payment_delay,
        createdAt: client.created_at,
        observations: [] // Será carregado separadamente
      }));

      setClients(formattedClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const createClient = async (clientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert({
          name: clientData.name!,
          cpf: clientData.cpf!,
          email: clientData.email,
          phone: clientData.phone!,
          residential_address: clientData.residentialAddress,
          work_address: clientData.workAddress,
          documents: clientData.documents,
          status: clientData.status || 'active',
          credit_score: clientData.creditScore || 400,
          credit_rating: clientData.creditRating || 'fair'
        })
        .select()
        .single();

      if (error) throw error;

      await fetchClients(); // Recarregar lista
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente');
      throw err;
    }
  };

  const updateClient = async (id: string, clientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: clientData.name,
          cpf: clientData.cpf,
          email: clientData.email,
          phone: clientData.phone,
          residential_address: clientData.residentialAddress,
          work_address: clientData.workAddress,
          documents: clientData.documents,
          status: clientData.status,
          credit_score: clientData.creditScore,
          credit_rating: clientData.creditRating,
          total_loans: clientData.totalLoans,
          active_loans: clientData.activeLoans,
          completed_loans: clientData.completedLoans,
          defaulted_loans: clientData.defaultedLoans,
          total_borrowed: clientData.totalBorrowed,
          total_paid: clientData.totalPaid,
          on_time_payments: clientData.onTimePayments,
          late_payments: clientData.latePayments,
          average_payment_delay: clientData.averagePaymentDelay,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchClients(); // Recarregar lista
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente');
      throw err;
    }
  };

  const deleteClient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchClients(); // Recarregar lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir cliente');
      throw err;
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    error,
    createClient,
    updateClient,
    deleteClient,
    refetch: fetchClients
  };
};