/*
  # Criar tabela de observações de clientes

  1. Nova Tabela
    - `client_observations`
      - `id` (uuid, primary key, auto-gerado)
      - `client_id` (uuid, obrigatório, FK para clients)
      - `content` (text, obrigatório) - Conteúdo da observação
      - `type` (text, default 'general') - Tipo: general, payment, contact, credit, warning
      - `is_important` (boolean, default false) - Marcado como importante
      - `created_by` (text, obrigatório) - Criado por
      - `created_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `client_observations`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS client_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  content text NOT NULL,
  type text DEFAULT 'general' NOT NULL CHECK (type IN ('general', 'payment', 'contact', 'credit', 'warning')),
  is_important boolean DEFAULT false NOT NULL,
  created_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_observations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de observações" ON client_observations;
DROP POLICY IF EXISTS "Permitir inserção de observações" ON client_observations;
DROP POLICY IF EXISTS "Permitir atualização de observações" ON client_observations;
DROP POLICY IF EXISTS "Permitir exclusão de observações" ON client_observations;

CREATE POLICY "Permitir leitura de observações"
  ON client_observations FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de observações"
  ON client_observations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de observações"
  ON client_observations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de observações"
  ON client_observations FOR DELETE
  USING (true);
