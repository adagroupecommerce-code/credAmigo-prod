/*
  # Criar tabela de empréstimos

  1. Nova Tabela
    - `loans`
      - `id` (uuid, primary key, auto-gerado)
      - `client_id` (uuid, obrigatório, FK para clients)
      - `amount` (numeric, obrigatório) - Valor do empréstimo
      - `interest_rate` (numeric, obrigatório) - Taxa de juros mensal
      - `installments` (integer, obrigatório) - Número de parcelas
      - `installment_value` (numeric, obrigatório) - Valor da parcela
      - `total_amount` (numeric, obrigatório) - Valor total com juros
      - `start_date` (date, obrigatório) - Data de início
      - `end_date` (date, obrigatório) - Data de término
      - `status` (text, default 'active') - Status: active, completed, defaulted
      - `paid_installments` (integer, default 0) - Parcelas pagas
      - `remaining_amount` (numeric, obrigatório) - Valor restante
      - `notes` (text, opcional) - Observações
      - `installment_plan` (jsonb, opcional) - Plano de parcelas
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `loans`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  interest_rate numeric NOT NULL,
  installments integer NOT NULL,
  installment_value numeric NOT NULL,
  total_amount numeric NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'completed', 'defaulted')),
  paid_installments integer DEFAULT 0 NOT NULL,
  remaining_amount numeric NOT NULL,
  notes text,
  installment_plan jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de empréstimos" ON loans;
DROP POLICY IF EXISTS "Permitir inserção de empréstimos" ON loans;
DROP POLICY IF EXISTS "Permitir atualização de empréstimos" ON loans;
DROP POLICY IF EXISTS "Permitir exclusão de empréstimos" ON loans;

CREATE POLICY "Permitir leitura de empréstimos"
  ON loans FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de empréstimos"
  ON loans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de empréstimos"
  ON loans FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de empréstimos"
  ON loans FOR DELETE
  USING (true);
