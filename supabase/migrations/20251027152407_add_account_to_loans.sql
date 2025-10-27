/*
  # Adicionar Conta Bancária aos Empréstimos
  
  ## Alterações
  
  1. Tabela `loans`
    - Adiciona coluna `account_id` (uuid, foreign key para cash_accounts)
    - Permite vincular cada empréstimo a uma conta específica
  
  ## Descrição
  
  Esta migração permite que cada empréstimo seja vinculado a uma conta bancária.
  Quando uma parcela é paga, o valor entra automaticamente na conta vinculada.
  
  ## Notas Importantes
  
  - Campo é opcional para empréstimos antigos
  - Novos empréstimos devem ter conta vinculada
*/

-- Adicionar coluna account_id à tabela loans
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES cash_accounts(id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_loans_account_id ON loans(account_id);

-- Comentário na coluna
COMMENT ON COLUMN loans.account_id IS 'Conta bancária vinculada ao empréstimo';
