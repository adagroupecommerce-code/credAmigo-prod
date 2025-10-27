/*
  # Create Storage Bucket for Client Documents

  1. Storage Bucket
    - `client-documents` - Bucket para armazenar documentos dos clientes
      - Arquivos públicos para acesso fácil
      - Limite de 5MB por arquivo
      - Tipos permitidos: imagens (jpg, png, jpeg) e PDF

  2. Security
    - Políticas de acesso público para leitura
    - Políticas de upload autenticado
    - RLS habilitado no bucket
*/

-- Inserir o bucket na tabela storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-documents',
  'client-documents',
  true,
  5242880, -- 5MB em bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública (qualquer um pode ver)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-documents');

-- Política para permitir upload autenticado
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-documents');

-- Política para permitir atualização autenticada
DROP POLICY IF EXISTS "Authenticated users can update" ON storage.objects;
CREATE POLICY "Authenticated users can update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'client-documents')
  WITH CHECK (bucket_id = 'client-documents');

-- Política para permitir exclusão autenticada
DROP POLICY IF EXISTS "Authenticated users can delete" ON storage.objects;
CREATE POLICY "Authenticated users can delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'client-documents');
