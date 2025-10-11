/*
  # Criar tabela de pagamentos

  1. Nova Tabela
    - `payments`
      - `id` (uuid, primary key, auto-gerado)
      - `loan_id` (uuid, obrigatório, FK para loans)
      - `installment_number` (integer, obrigatório) - Número da parcela
      - `amount` (numeric, obrigatório) - Valor da parcela
      - `principal_amount` (numeric, opcional) - Valor do principal
      - `interest_amount` (numeric, opcional) - Valor dos juros
      - `penalty` (numeric, default 0) - Multa
      - `due_date` (date, obrigatório) - Data de vencimento
      - `payment_date` (date, opcional) - Data do pagamento
      - `status` (text, default 'pending') - Status: pending, paid, overdue
      - `original_amount` (numeric, default 0) - Valor original
      - `payment_type` (text, default 'full') - Tipo: full, partial, overpayment
      - `excess_amount` (numeric, default 0) - Valor excedente
      - `notes` (text, opcional) - Observações
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `payments`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount numeric NOT NULL,
  principal_amount numeric,
  interest_amount numeric,
  penalty numeric DEFAULT 0 CHECK (penalty >= 0),
  due_date date NOT NULL,
  payment_date date,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'paid', 'overdue')),
  original_amount numeric DEFAULT 0 CHECK (original_amount >= 0),
  payment_type text DEFAULT 'full' CHECK (payment_type IN ('full', 'partial', 'overpayment')),
  excess_amount numeric DEFAULT 0 CHECK (excess_amount >= 0),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de pagamentos" ON payments;
DROP POLICY IF EXISTS "Permitir inserção de pagamentos" ON payments;
DROP POLICY IF EXISTS "Permitir atualização de pagamentos" ON payments;
DROP POLICY IF EXISTS "Permitir exclusão de pagamentos" ON payments;

CREATE POLICY "Permitir leitura de pagamentos"
  ON payments FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de pagamentos"
  ON payments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de pagamentos"
  ON payments FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de pagamentos"
  ON payments FOR DELETE
  USING (true);
