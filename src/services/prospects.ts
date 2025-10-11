import { supabase } from '@/lib/supabase';

export async function listProspects() {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getProspectById(id: string) {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createProspect(payload: {
  name: string;
  phone: string;
  email?: string | null;
  cpf?: string | null;
  requested_amount: number;
  stage?: string;
  priority?: string;
  source?: string;
  notes?: string | null;
  documents?: any;
  document_files?: any;
  address?: any;
  work_info?: any;
  assigned_to?: string | null;
  expected_close_date?: string | null;
}) {
  const { data, error } = await supabase
    .from('prospects')
    .insert({
      name: payload.name,
      phone: payload.phone,
      email: payload.email ?? null,
      cpf: payload.cpf ?? null,
      requested_amount: payload.requested_amount,
      stage: payload.stage ?? 'lead',
      priority: payload.priority ?? 'medium',
      source: payload.source ?? 'website',
      notes: payload.notes ?? null,
      documents: payload.documents ?? {},
      document_files: payload.document_files ?? {},
      address: payload.address ?? null,
      work_info: payload.work_info ?? null,
      assigned_to: payload.assigned_to ?? null,
      expected_close_date: payload.expected_close_date ?? null,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function updateProspect(id: string, patch: Partial<{
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  requested_amount: number;
  stage: string;
  priority: string;
  source: string;
  notes: string | null;
  documents: any;
  document_files: any;
  address: any;
  work_info: any;
  assigned_to: string | null;
  expected_close_date: string | null;
  rejection_reason: string | null;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
}>) {
  const { data, error } = await supabase
    .from('prospects')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteProspect(id: string) {
  const { error } = await supabase.from('prospects').delete().eq('id', id);
  if (error) throw error;
}

export async function archiveProspect(id: string, archivedBy: string) {
  const { data, error } = await supabase
    .from('prospects')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      archived_by: archivedBy,
    })
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}
