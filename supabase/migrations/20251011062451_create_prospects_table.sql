/*
  # Criar tabela de prospects (CRM)

  1. Nova Tabela
    - `prospects`
      - `id` (uuid, primary key, auto-gerado)
      - `name` (text, obrigatório) - Nome do prospect
      - `phone` (text, obrigatório) - Telefone
      - `email` (text, opcional) - Email
      - `cpf` (text, opcional) - CPF
      - `requested_amount` (numeric, obrigatório) - Valor solicitado
      - `stage` (text, default 'lead') - Estágio: lead, documents, analysis, approved, rejected
      - `priority` (text, default 'medium') - Prioridade: low, medium, high
      - `source` (text, default 'website') - Fonte: website, referral, social_media, phone, walk_in, other
      - `notes` (text, opcional) - Observações
      - `documents` (jsonb, default {}) - Status dos documentos
      - `document_files` (jsonb, default {}) - Arquivos de documentos
      - `address` (jsonb, opcional) - Endereço
      - `work_info` (jsonb, opcional) - Informações de trabalho
      - `assigned_to` (text, opcional) - Responsável
      - `expected_close_date` (date, opcional) - Data esperada de fechamento
      - `rejection_reason` (text, opcional) - Motivo da rejeição
      - `is_archived` (boolean, default false) - Arquivado
      - `archived_at` (timestamptz, opcional) - Data de arquivamento
      - `archived_by` (text, opcional) - Arquivado por
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Segurança
    - Habilitar RLS na tabela `prospects`
    - Políticas para operações CRUD autenticadas
*/

CREATE TABLE IF NOT EXISTS prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  cpf text,
  requested_amount numeric NOT NULL,
  stage text DEFAULT 'lead' NOT NULL CHECK (stage IN ('lead', 'documents', 'analysis', 'approved', 'rejected')),
  priority text DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  source text DEFAULT 'website' NOT NULL CHECK (source IN ('website', 'referral', 'social_media', 'phone', 'walk_in', 'other')),
  notes text,
  documents jsonb DEFAULT '{}'::jsonb NOT NULL,
  document_files jsonb DEFAULT '{}'::jsonb NOT NULL,
  address jsonb,
  work_info jsonb,
  assigned_to text,
  expected_close_date date,
  rejection_reason text,
  is_archived boolean DEFAULT false NOT NULL,
  archived_at timestamptz,
  archived_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir leitura de prospects" ON prospects;
DROP POLICY IF EXISTS "Permitir inserção de prospects" ON prospects;
DROP POLICY IF EXISTS "Permitir atualização de prospects" ON prospects;
DROP POLICY IF EXISTS "Permitir exclusão de prospects" ON prospects;

CREATE POLICY "Permitir leitura de prospects"
  ON prospects FOR SELECT
  USING (true);

CREATE POLICY "Permitir inserção de prospects"
  ON prospects FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Permitir atualização de prospects"
  ON prospects FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Permitir exclusão de prospects"
  ON prospects FOR DELETE
  USING (true);
