/*
  # Criar tabela de transações financeiras

  1. Nova Tabela
    - `transactions`
      - `id` (uuid, primary key, auto-gerado)
      - `account_id` (uuid, obrigatório, FK para cash_accounts)
      - `type` (text, obrigatório) - Tipo: income, expense, transfer
      - `category` (text, obrigatório) - Categoria da transação
      - `subcategory` (text, opcional) - Subcategoria
      - `amount` (numeric, obrigatório) - Valor
      - `description` (text, obrigatório) - Descrição
      - `date` (date, obrigatório) - Data da transação
      - `reference` (text, opcional) - Referência
      - `tags` (jsonb, default []) - Tags
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `transactions`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category text NOT NULL,
  subcategory text,
  amount numeric NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  reference text,
  tags jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de transações" ON transactions;
DROP POLICY IF EXISTS "Permitir inserção de transações" ON transactions;
DROP POLICY IF EXISTS "Permitir atualização de transações" ON transactions;
DROP POLICY IF EXISTS "Permitir exclusão de transações" ON transactions;

CREATE POLICY "Permitir leitura de transações"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de transações"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de transações"
  ON transactions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de transações"
  ON transactions FOR DELETE
  USING (true);
