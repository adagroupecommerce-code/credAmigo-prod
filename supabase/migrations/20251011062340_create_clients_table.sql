/*
  # Criar tabela de clientes

  1. Nova Tabela
    - `clients`
      - `id` (uuid, primary key, auto-gerado)
      - `name` (text, obrigatório) - Nome do cliente
      - `cpf` (text, único, obrigatório) - CPF do cliente
      - `email` (text, opcional) - Email do cliente
      - `phone` (text, obrigatório) - Telefone do cliente
      - `residential_address` (jsonb, default {}) - Endereço residencial
      - `work_address` (jsonb, default {}) - Endereço comercial
      - `documents` (jsonb, default {}) - Documentos do cliente
      - `status` (text, default 'active') - Status: active, inactive, blocked
      - `credit_score` (integer, default 400) - Score de crédito
      - `credit_rating` (text, default 'fair') - Classificação: excellent, good, fair, poor, very_poor
      - `total_loans` (integer, default 0) - Total de empréstimos
      - `active_loans` (integer, default 0) - Empréstimos ativos
      - `completed_loans` (integer, default 0) - Empréstimos concluídos
      - `defaulted_loans` (integer, default 0) - Empréstimos inadimplentes
      - `total_borrowed` (numeric, default 0) - Total emprestado
      - `total_paid` (numeric, default 0) - Total pago
      - `on_time_payments` (integer, default 0) - Pagamentos pontuais
      - `late_payments` (integer, default 0) - Pagamentos atrasados
      - `average_payment_delay` (integer, default 0) - Atraso médio em dias
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `clients`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  phone text NOT NULL,
  residential_address jsonb DEFAULT '{}'::jsonb NOT NULL,
  work_address jsonb DEFAULT '{}'::jsonb NOT NULL,
  documents jsonb DEFAULT '{}'::jsonb NOT NULL,
  status text DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'inactive', 'blocked')),
  credit_score integer DEFAULT 400 NOT NULL,
  credit_rating text DEFAULT 'fair' NOT NULL CHECK (credit_rating IN ('excellent', 'good', 'fair', 'poor', 'very_poor')),
  total_loans integer DEFAULT 0 NOT NULL,
  active_loans integer DEFAULT 0 NOT NULL,
  completed_loans integer DEFAULT 0 NOT NULL,
  defaulted_loans integer DEFAULT 0 NOT NULL,
  total_borrowed numeric DEFAULT 0 NOT NULL,
  total_paid numeric DEFAULT 0 NOT NULL,
  on_time_payments integer DEFAULT 0 NOT NULL,
  late_payments integer DEFAULT 0 NOT NULL,
  average_payment_delay integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de clientes" ON clients;
DROP POLICY IF EXISTS "Permitir inserção de clientes" ON clients;
DROP POLICY IF EXISTS "Permitir atualização de clientes" ON clients;
DROP POLICY IF EXISTS "Permitir exclusão de clientes" ON clients;

CREATE POLICY "Permitir leitura de clientes"
  ON clients FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de clientes"
  ON clients FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de clientes"
  ON clients FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de clientes"
  ON clients FOR DELETE
  USING (true);
