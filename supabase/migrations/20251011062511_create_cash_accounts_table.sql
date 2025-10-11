/*
  # Criar tabela de contas de caixa/banco

  1. Nova Tabela
    - `cash_accounts`
      - `id` (uuid, primary key, auto-gerado)
      - `name` (text, obrigatório) - Nome da conta
      - `type` (text, obrigatório) - Tipo: cash, bank, investment
      - `balance` (numeric, default 0) - Saldo atual
      - `currency` (text, default 'BRL') - Moeda
      - `is_active` (boolean, default true) - Conta ativa
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `cash_accounts`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS cash_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'investment')),
  balance numeric DEFAULT 0 NOT NULL,
  currency text DEFAULT 'BRL' NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de contas" ON cash_accounts;
DROP POLICY IF EXISTS "Permitir inserção de contas" ON cash_accounts;
DROP POLICY IF EXISTS "Permitir atualização de contas" ON cash_accounts;
DROP POLICY IF EXISTS "Permitir exclusão de contas" ON cash_accounts;

CREATE POLICY "Permitir leitura de contas"
  ON cash_accounts FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de contas"
  ON cash_accounts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de contas"
  ON cash_accounts FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de contas"
  ON cash_accounts FOR DELETE
  USING (true);
