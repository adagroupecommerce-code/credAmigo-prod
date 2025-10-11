/*
  # Sistema de Controle Financeiro - Schema Completo

  1. New Tables
    - `clients` - Dados dos clientes
    - `loans` - Empréstimos
    - `payments` - Parcelas dos empréstimos
    - `prospects` - Prospects do CRM
    - `client_observations` - Observações dos clientes
    - `cash_accounts` - Contas de caixa/banco
    - `transactions` - Transações financeiras

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users

  3. Features
    - UUID primary keys
    - Timestamps automáticos
    - Relacionamentos entre tabelas
    - Índices para performance
*/

-- Tabela de Clientes
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cpf text UNIQUE NOT NULL,
  email text,
  phone text NOT NULL,
  residential_address jsonb NOT NULL DEFAULT '{}',
  work_address jsonb NOT NULL DEFAULT '{}',
  documents jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
  credit_score integer NOT NULL DEFAULT 400,
  credit_rating text NOT NULL DEFAULT 'fair' CHECK (credit_rating IN ('excellent', 'good', 'fair', 'poor', 'very_poor')),
  total_loans integer NOT NULL DEFAULT 0,
  active_loans integer NOT NULL DEFAULT 0,
  completed_loans integer NOT NULL DEFAULT 0,
  defaulted_loans integer NOT NULL DEFAULT 0,
  total_borrowed decimal(15,2) NOT NULL DEFAULT 0,
  total_paid decimal(15,2) NOT NULL DEFAULT 0,
  on_time_payments integer NOT NULL DEFAULT 0,
  late_payments integer NOT NULL DEFAULT 0,
  average_payment_delay integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Empréstimos
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  amount decimal(15,2) NOT NULL,
  interest_rate decimal(5,2) NOT NULL,
  installments integer NOT NULL,
  installment_value decimal(15,2) NOT NULL,
  total_amount decimal(15,2) NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'defaulted')),
  paid_installments integer NOT NULL DEFAULT 0,
  remaining_amount decimal(15,2) NOT NULL,
  notes text,
  installment_plan jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL,
  amount decimal(15,2) NOT NULL,
  principal_amount decimal(15,2),
  interest_amount decimal(15,2),
  penalty decimal(15,2) DEFAULT 0,
  due_date date NOT NULL,
  payment_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Prospects (CRM)
CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  cpf text,
  requested_amount decimal(15,2) NOT NULL,
  stage text NOT NULL DEFAULT 'lead' CHECK (stage IN ('lead', 'documents', 'analysis', 'approved', 'rejected')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  source text NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'referral', 'social_media', 'phone', 'walk_in', 'other')),
  notes text,
  documents jsonb NOT NULL DEFAULT '{}',
  document_files jsonb NOT NULL DEFAULT '{}',
  address jsonb,
  work_info jsonb,
  assigned_to text,
  expected_close_date date,
  rejection_reason text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Observações dos Clientes
CREATE TABLE IF NOT EXISTS client_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text NOT NULL DEFAULT 'general' CHECK (type IN ('general', 'payment', 'contact', 'credit', 'warning')),
  is_important boolean NOT NULL DEFAULT false,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de Contas de Caixa/Banco
CREATE TABLE IF NOT EXISTS cash_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('cash', 'bank', 'investment')),
  balance decimal(15,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de Transações Financeiras
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES cash_accounts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  category text NOT NULL,
  subcategory text,
  amount decimal(15,2) NOT NULL,
  description text NOT NULL,
  date date NOT NULL,
  reference text,
  tags jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_loans_client_id ON loans(client_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_prospects_stage ON prospects(stage);
CREATE INDEX IF NOT EXISTS idx_prospects_assigned_to ON prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_client_observations_client_id ON client_observations(client_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permitir acesso para usuários autenticados)
CREATE POLICY "Users can manage clients" ON clients FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage loans" ON loans FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage payments" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage prospects" ON prospects FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage client observations" ON client_observations FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage cash accounts" ON cash_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage transactions" ON transactions FOR ALL TO authenticated USING (true);