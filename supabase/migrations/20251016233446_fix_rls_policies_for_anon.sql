/*
  # Fix RLS Policies for Anonymous Access
  
  1. Changes
    - Drop existing restrictive RLS policies
    - Create new permissive policies for anon and authenticated roles
    - Allow full CRUD operations for testing and development
  
  2. Security
    - Policies allow access for anon role (development/testing)
    - In production, these should be restricted based on auth.uid()
    
  3. Important Notes
    - This configuration is suitable for development
    - For production, implement proper user authentication
    - Add ownership checks using auth.uid() when auth is implemented
*/

-- Drop existing policies and recreate with anon role support

-- CLIENTS TABLE
DROP POLICY IF EXISTS "Permitir leitura de clientes" ON clients;
DROP POLICY IF EXISTS "Permitir inserção de clientes" ON clients;
DROP POLICY IF EXISTS "Permitir atualização de clientes" ON clients;
DROP POLICY IF EXISTS "Permitir exclusão de clientes" ON clients;

CREATE POLICY "Enable read access for all users" ON clients
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON clients
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON clients
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON clients
  FOR DELETE TO anon, authenticated
  USING (true);

-- LOANS TABLE
DROP POLICY IF EXISTS "Permitir leitura de empréstimos" ON loans;
DROP POLICY IF EXISTS "Permitir inserção de empréstimos" ON loans;
DROP POLICY IF EXISTS "Permitir atualização de empréstimos" ON loans;
DROP POLICY IF EXISTS "Permitir exclusão de empréstimos" ON loans;

CREATE POLICY "Enable read access for all users" ON loans
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON loans
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON loans
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON loans
  FOR DELETE TO anon, authenticated
  USING (true);

-- PAYMENTS TABLE
DROP POLICY IF EXISTS "Permitir leitura de pagamentos" ON payments;
DROP POLICY IF EXISTS "Permitir inserção de pagamentos" ON payments;
DROP POLICY IF EXISTS "Permitir atualização de pagamentos" ON payments;
DROP POLICY IF EXISTS "Permitir exclusão de pagamentos" ON payments;

CREATE POLICY "Enable read access for all users" ON payments
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON payments
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON payments
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON payments
  FOR DELETE TO anon, authenticated
  USING (true);

-- PROSPECTS TABLE
DROP POLICY IF EXISTS "Permitir leitura de prospects" ON prospects;
DROP POLICY IF EXISTS "Permitir inserção de prospects" ON prospects;
DROP POLICY IF EXISTS "Permitir atualização de prospects" ON prospects;
DROP POLICY IF EXISTS "Permitir exclusão de prospects" ON prospects;

CREATE POLICY "Enable read access for all users" ON prospects
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON prospects
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON prospects
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON prospects
  FOR DELETE TO anon, authenticated
  USING (true);

-- CASH_ACCOUNTS TABLE
DROP POLICY IF EXISTS "Permitir leitura de contas" ON cash_accounts;
DROP POLICY IF EXISTS "Permitir inserção de contas" ON cash_accounts;
DROP POLICY IF EXISTS "Permitir atualização de contas" ON cash_accounts;
DROP POLICY IF EXISTS "Permitir exclusão de contas" ON cash_accounts;

CREATE POLICY "Enable read access for all users" ON cash_accounts
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON cash_accounts
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON cash_accounts
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON cash_accounts
  FOR DELETE TO anon, authenticated
  USING (true);

-- TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Permitir leitura de transações" ON transactions;
DROP POLICY IF EXISTS "Permitir inserção de transações" ON transactions;
DROP POLICY IF EXISTS "Permitir atualização de transações" ON transactions;
DROP POLICY IF EXISTS "Permitir exclusão de transações" ON transactions;

CREATE POLICY "Enable read access for all users" ON transactions
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON transactions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON transactions
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON transactions
  FOR DELETE TO anon, authenticated
  USING (true);

-- CLIENT_OBSERVATIONS TABLE
DROP POLICY IF EXISTS "Permitir leitura de observações" ON client_observations;
DROP POLICY IF EXISTS "Permitir inserção de observações" ON client_observations;
DROP POLICY IF EXISTS "Permitir atualização de observações" ON client_observations;
DROP POLICY IF EXISTS "Permitir exclusão de observações" ON client_observations;

CREATE POLICY "Enable read access for all users" ON client_observations
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Enable insert for all users" ON client_observations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON client_observations
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON client_observations
  FOR DELETE TO anon, authenticated
  USING (true);
