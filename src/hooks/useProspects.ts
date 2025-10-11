import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Prospect } from '../types';

export const useProspects = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProspects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedProspects: Prospect[] = data.map(prospect => ({
        id: prospect.id,
        name: prospect.name,
        phone: prospect.phone,
        email: prospect.email,
        cpf: prospect.cpf,
        requestedAmount: prospect.requested_amount,
        stage: prospect.stage,
        priority: prospect.priority,
        source: prospect.source,
        notes: prospect.notes || '',
        documents: prospect.documents,
        documentFiles: prospect.document_files,
        address: prospect.address,
        workInfo: prospect.work_info,
        assignedTo: prospect.assigned_to,
        expectedCloseDate: prospect.expected_close_date,
        rejectionReason: prospect.rejection_reason,
        isArchived: prospect.is_archived,
        archivedAt: prospect.archived_at,
        archivedBy: prospect.archived_by,
        createdAt: prospect.created_at,
        updatedAt: prospect.updated_at
      }));

      setProspects(formattedProspects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar prospects');
    } finally {
      setLoading(false);
    }
  };

  const createProspect = async (prospectData: Partial<Prospect>) => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .insert({
          name: prospectData.name!,
          phone: prospectData.phone!,
          email: prospectData.email,
          cpf: prospectData.cpf,
          requested_amount: prospectData.requestedAmount!,
          stage: prospectData.stage || 'lead',
          priority: prospectData.priority || 'medium',
          source: prospectData.source || 'website',
          notes: prospectData.notes || '',
          documents: prospectData.documents || {},
          document_files: prospectData.documentFiles || {},
          address: prospectData.address,
          work_info: prospectData.workInfo,
          assigned_to: prospectData.assignedTo,
          expected_close_date: prospectData.expectedCloseDate
        })
        .select()
        .single();

      if (error) throw error;

      await fetchProspects(); // Recarregar lista
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar prospect');
      throw err;
    }
  };

  const updateProspect = async (id: string, prospectData: Partial<Prospect>) => {
    try {
      const { data, error } = await supabase
        .from('prospects')
        .update({
          name: prospectData.name,
          phone: prospectData.phone,
          email: prospectData.email,
          cpf: prospectData.cpf,
          requested_amount: prospectData.requestedAmount,
          stage: prospectData.stage,
          priority: prospectData.priority,
          source: prospectData.source,
          notes: prospectData.notes,
          documents: prospectData.documents,
          document_files: prospectData.documentFiles,
          address: prospectData.address,
          work_info: prospectData.workInfo,
          assigned_to: prospectData.assignedTo,
          expected_close_date: prospectData.expectedCloseDate,
          rejection_reason: prospectData.rejectionReason,
          is_archived: prospectData.isArchived,
          archived_at: prospectData.archivedAt,
          archived_by: prospectData.archivedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await fetchProspects(); // Recarregar lista
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar prospect');
      throw err;
    }
  };

  useEffect(() => {
    fetchProspects();
  }, []);

  return {
    prospects,
    loading,
    error,
    createProspect,
    updateProspect,
    refetch: fetchProspects
  };
};