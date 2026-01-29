/*
  # Adicionar Conciliação Bancária

  1. Alterações na Tabela transactions
    - Adiciona coluna `reconciled` (boolean) - indica se transação foi conciliada
    - Adiciona coluna `reconciled_date` (date) - data da conciliação
    - Adiciona coluna `reconciled_by` (text) - usuário que fez a conciliação
    - Adiciona coluna `bank_reference` (text) - referência do extrato bancário

  2. Índices
    - Cria índice em `reconciled` para filtros rápidos
    - Cria índice em `reconciled_date` para relatórios

  3. Notas
    - Permite rastrear quais transações foram conferidas com extrato
    - Facilita identificação de discrepâncias
    - Mantém histórico de conciliações
*/

-- Adicionar colunas de conciliação
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS reconciled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reconciled_date date,
ADD COLUMN IF NOT EXISTS reconciled_by text,
ADD COLUMN IF NOT EXISTS bank_reference text;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled ON transactions(reconciled);
CREATE INDEX IF NOT EXISTS idx_transactions_reconciled_date ON transactions(reconciled_date);
CREATE INDEX IF NOT EXISTS idx_transactions_account_reconciled ON transactions(account_id, reconciled);

-- Comentários
COMMENT ON COLUMN transactions.reconciled IS 'Indica se a transação foi conciliada com extrato bancário';
COMMENT ON COLUMN transactions.reconciled_date IS 'Data em que a conciliação foi realizada';
COMMENT ON COLUMN transactions.reconciled_by IS 'Usuário que realizou a conciliação';
COMMENT ON COLUMN transactions.bank_reference IS 'Referência/ID da transação no extrato bancário';
