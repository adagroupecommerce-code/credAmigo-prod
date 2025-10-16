# 🚀 Quick Start - credAmigo-prod

## ⚡ Início Rápido (2 minutos)

### 1️⃣ Instalar Dependências
```bash
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente
Arquivo `.env` já está configurado com:
```env
VITE_SUPABASE_URL=https://pafbydmrhfaiaokadlot.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3️⃣ Rodar o Projeto
```bash
npm run dev
```
Acesse: http://localhost:5173

---

## 🔧 Resolver Bloqueio de RLS (IMPORTANTE!)

### Problema
Operações de INSERT/UPDATE/DELETE estão bloqueadas por RLS.

### Solução Rápida (Desenvolvimento)
Execute no **SQL Editor do Supabase Dashboard**:

```sql
-- DESABILITAR RLS PARA DESENVOLVIMENTO
ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE prospects DISABLE ROW LEVEL SECURITY;
ALTER TABLE cash_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_observations DISABLE ROW LEVEL SECURITY;
```

**⚠️ ATENÇÃO:** Isso é apenas para desenvolvimento! Em produção, use autenticação.

### Testar Se Funcionou
```bash
npm run test:supabase
```

Deve exibir: **✅ Taxa de sucesso: 100%**

---

## 📋 Funcionalidades Disponíveis

### ✅ Gestão de Clientes
- Cadastrar novos clientes
- Visualizar lista completa
- Editar informações
- Excluir clientes (só sem empréstimos ativos)
- Sistema de score de crédito (1-5 estrelas)

### ✅ Gestão de Empréstimos
- Criar empréstimos vinculados a clientes
- Sistema SAC de amortização
- Cronograma de parcelas
- Acompanhamento de pagamentos
- Cálculo automático de juros

### ✅ CRM / Prospects
- Pipeline Kanban (Lead → Documentos → Análise → Aprovado/Rejeitado)
- Upload de documentos
- Conversão automática para cliente
- Filtros e busca avançada

### ✅ Dashboard Financeiro
- Visão geral de empréstimos
- Total emprestado vs. recebido
- Taxa de inadimplência
- Métricas de performance

### ✅ Gestão de Caixa
- Contas de caixa múltiplas
- Transações financeiras
- Fluxo de caixa
- Relatório DRE

---

## 🧪 Executar Testes

### Teste Completo de CRUD
```bash
npm run test:supabase
```

### O Que é Testado
- ✅ Conexão com Supabase
- ✅ CREATE: Criar registros
- ✅ READ: Listar registros
- ✅ UPDATE: Atualizar dados
- ✅ DELETE: Excluir registros
- ✅ Validações e constraints
- ✅ Fluxo end-to-end completo

---

## 🔐 Usuários de Teste (RBAC)

O sistema já vem com usuários pré-configurados:

| Usuário | Senha | Permissões |
|---------|-------|------------|
| admin | admin123 | Todas |
| gerente | gerente123 | Gerenciais |
| analista | analista123 | Leitura + Análise |
| operador | operador123 | Apenas Leitura |

---

## 📚 Estrutura do Projeto

```
credAmigo-prod/
├── src/
│   ├── components/        # Componentes React
│   │   ├── Dashboard.tsx
│   │   ├── ClientList.tsx
│   │   ├── LoanForm.tsx
│   │   └── ...
│   ├── hooks/             # Custom Hooks
│   │   ├── useClients.ts  # 🔗 Supabase
│   │   ├── useLoans.ts    # 🔗 Supabase
│   │   └── useProspects.ts
│   ├── services/          # Lógica de negócio
│   ├── types/             # TypeScript types
│   ├── utils/             # Utilidades
│   └── lib/
│       └── supabase.ts    # 🔗 Client Supabase
├── supabase/
│   └── migrations/        # Migrations SQL
├── .env                   # Configuração
└── verifySupabaseCRUD.js  # 🧪 Testes
```

---

## 🎯 Próximos Passos

### Para Desenvolvimento
1. ✅ Desabilitar RLS (comando acima)
2. ✅ Testar CRUD funcionando
3. ✅ Cadastrar clientes de teste
4. ✅ Criar empréstimos
5. ✅ Registrar pagamentos

### Para Produção
1. ⚠️ Implementar Supabase Auth
2. ⚠️ Reabilitar RLS com auth.uid()
3. ⚠️ Adicionar coluna user_id nas tabelas
4. ⚠️ Testar isolamento de dados
5. ⚠️ Deploy no Vercel

---

## 🐛 Troubleshooting

### Erro: "Row violates row-level security policy"
**Causa:** RLS está bloqueando operações
**Solução:** Execute o comando SQL acima para desabilitar RLS

### Erro: "Cannot find package"
**Causa:** Dependências não instaladas
**Solução:** `npm install`

### Erro: "Supabase connection failed"
**Causa:** Credenciais inválidas
**Solução:** Verifique o arquivo `.env`

### Interface vazia / "Nenhum registro"
**Causa:** Banco está vazio (esperado)
**Solução:** Cadastre seus primeiros registros!

---

## 📞 Suporte

- 📖 Documentação completa: `TEST_RESULTS.md`
- 🧪 Rodar testes: `npm run test:supabase`
- 🗄️ Dashboard Supabase: https://pafbydmrhfaiaokadlot.supabase.co
- 📊 SQL Editor: Use para queries diretas

---

## ✨ Recursos Adicionais

### Build para Produção
```bash
npm run build
```

### Preview do Build
```bash
npm run preview
```

### Lint do Código
```bash
npm run lint
```

---

**🎉 Pronto! Seu sistema está configurado e funcionando!**

Em caso de dúvidas, consulte `TEST_RESULTS.md` para documentação técnica completa.
