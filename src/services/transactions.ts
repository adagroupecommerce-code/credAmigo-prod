import { supabase } from '@/lib/supabase';

export async function listTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, cash_accounts(name, type)')
    .order('date', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getTransactionById(id: string) {
  const { data, error } = await supabase
    .from('transactions')
    .select('*, cash_accounts(name, type)')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createTransaction(payload: {
  account_id: string;
  type: string;
  category: string;
  subcategory?: string | null;
  amount: number;
  description: string;
  date: string;
  reference?: string | null;
  tags?: any;
}) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      account_id: payload.account_id,
      type: payload.type,
      category: payload.category,
      subcategory: payload.subcategory ?? null,
      amount: payload.amount,
      description: payload.description,
      date: payload.date,
      reference: payload.reference ?? null,
      tags: payload.tags ?? [],
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function updateTransaction(id: string, patch: Partial<{
  account_id: string;
  type: string;
  category: string;
  subcategory: string | null;
  amount: number;
  description: string;
  date: string;
  reference: string | null;
  tags: any;
}>) {
  const { data, error } = await supabase
    .from('transactions')
    .update(patch)
    .eq('id', id)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTransaction(id: string) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw error;
}
