import { supabase } from '@/lib/supabase';

export async function listClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getClientById(id: string) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createClient(payload: {
  name: string;
  cpf: string;
  phone: string;
  email?: string | null;
  status?: string;
  residential_address?: any;
  work_address?: any;
  documents?: any;
  credit_score?: number;
  credit_rating?: string;
}) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      name: payload.name,
      cpf: payload.cpf,
      phone: payload.phone,
      email: payload.email ?? null,
      status: payload.status ?? 'active',
      residential_address: payload.residential_address ?? {},
      work_address: payload.work_address ?? {},
      documents: payload.documents ?? {},
      credit_score: payload.credit_score ?? 400,
      credit_rating: payload.credit_rating ?? 'fair',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function updateClient(id: string, patch: Partial<{
  name: string;
  cpf: string;
  phone: string;
  email: string | null;
  status: string;
  credit_score: number;
  credit_rating: string;
  residential_address: any;
  work_address: any;
  documents: any;
  total_loans: number;
  active_loans: number;
  completed_loans: number;
  defaulted_loans: number;
  total_borrowed: number;
  total_paid: number;
  on_time_payments: number;
  late_payments: number;
  average_payment_delay: number;
}>) {
  const { data, error } = await supabase
    .from('clients')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteClient(id: string) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) throw error;
}

export async function listClientObservations(clientId: string) {
  const { data, error } = await supabase
    .from('client_observations')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createClientObservation(payload: {
  client_id: string;
  content: string;
  type?: string;
  is_important?: boolean;
  created_by: string;
}) {
  const { data, error } = await supabase
    .from('client_observations')
    .insert({
      client_id: payload.client_id,
      content: payload.content,
      type: payload.type ?? 'general',
      is_important: payload.is_important ?? false,
      created_by: payload.created_by,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}
