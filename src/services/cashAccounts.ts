import { supabase } from '@/lib/supabase';

export async function listCashAccounts() {
  const { data, error } = await supabase
    .from('cash_accounts')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getCashAccountById(id: string) {
  const { data, error } = await supabase
    .from('cash_accounts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createCashAccount(payload: {
  name: string;
  type: string;
  balance?: number;
  currency?: string;
  is_active?: boolean;
}) {
  const { data, error } = await supabase
    .from('cash_accounts')
    .insert({
      name: payload.name,
      type: payload.type,
      balance: payload.balance ?? 0,
      currency: payload.currency ?? 'BRL',
      is_active: payload.is_active ?? true,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function updateCashAccount(id: string, patch: Partial<{
  name: string;
  type: string;
  balance: number;
  currency: string;
  is_active: boolean;
}>) {
  const { data, error } = await supabase
    .from('cash_accounts')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCashAccount(id: string) {
  const { error } = await supabase.from('cash_accounts').delete().eq('id', id);
  if (error) throw error;
}
