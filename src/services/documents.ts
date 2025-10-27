import { supabase } from '@/lib/supabase';

const BUCKET_NAME = 'client-documents';

/**
 * Faz upload de um documento para o Supabase Storage
 * @param file - Arquivo a ser enviado
 * @param clientId - ID do cliente
 * @param documentType - Tipo do documento (selfie, cnh, etc)
 * @returns URL pública do arquivo ou null em caso de erro
 */
export async function uploadDocument(
  file: File,
  clientId: string,
  documentType: string
): Promise<string | null> {
  try {
    console.log(`📤 [UPLOAD] Iniciando upload: ${documentType} para cliente ${clientId}`);
    console.log(`   Arquivo: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Validar tamanho (5MB máximo)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_SIZE) {
      console.error('❌ [UPLOAD] Arquivo muito grande:', file.size);
      throw new Error('Arquivo muito grande. Máximo: 5MB');
    }

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ [UPLOAD] Tipo não permitido:', file.type);
      throw new Error('Tipo de arquivo não permitido. Use JPG, PNG ou PDF');
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const fileExt = file.name.split('.').pop();
    const fileName = `${clientId}/${documentType}_${timestamp}.${fileExt}`;

    console.log(`   Salvando como: ${fileName}`);

    // Fazer upload
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('❌ [UPLOAD] Erro no upload:', error);
      throw error;
    }

    console.log('✅ [UPLOAD] Arquivo enviado:', data.path);

    // Obter URL pública
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('✅ [UPLOAD] URL pública:', urlData.publicUrl);

    return urlData.publicUrl;
  } catch (error) {
    console.error('❌ [UPLOAD] Erro ao fazer upload:', error);
    return null;
  }
}

/**
 * Remove um documento do Supabase Storage
 * @param documentUrl - URL pública do documento
 * @returns true se removido com sucesso
 */
export async function deleteDocument(documentUrl: string): Promise<boolean> {
  try {
    console.log('🗑️ [DELETE] Removendo documento:', documentUrl);

    // Extrair o path do arquivo da URL
    const url = new URL(documentUrl);
    const pathParts = url.pathname.split(`${BUCKET_NAME}/`);
    if (pathParts.length < 2) {
      console.error('❌ [DELETE] URL inválida:', documentUrl);
      return false;
    }

    const filePath = pathParts[1];
    console.log('   Path:', filePath);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('❌ [DELETE] Erro ao remover:', error);
      return false;
    }

    console.log('✅ [DELETE] Documento removido com sucesso');
    return true;
  } catch (error) {
    console.error('❌ [DELETE] Erro ao remover documento:', error);
    return false;
  }
}

/**
 * Lista todos os documentos de um cliente
 * @param clientId - ID do cliente
 * @returns Array de arquivos
 */
export async function listClientDocuments(clientId: string) {
  try {
    console.log(`📋 [LIST] Listando documentos do cliente ${clientId}`);

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(clientId);

    if (error) {
      console.error('❌ [LIST] Erro ao listar:', error);
      return [];
    }

    console.log(`✅ [LIST] Encontrados ${data.length} documentos`);
    return data;
  } catch (error) {
    console.error('❌ [LIST] Erro ao listar documentos:', error);
    return [];
  }
}
