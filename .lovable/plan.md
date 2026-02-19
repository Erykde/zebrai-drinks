
# Revisao de Seguranca - Zebrai Drinks

## Status: EM ANDAMENTO

### ✅ Concluído
1. ✅ Funcao `has_role()` — revogada execucao publica, codigo atualizado para query direta em `user_roles`
2. ✅ Leitura de pedidos — restrita a admins via RLS  
3. ✅ `cost_price` — removido da query publica em `useProducts.ts` e do checkout
4. ✅ Edge Function `create-order` — validacao server-side com rate limiting
5. ✅ Edge Function `get-order` — acesso publico seguro apenas ao pedido do cliente (sem dados sensíveis)
6. ✅ Validacao Zod no CheckoutForm

### ⏳ Pendente
- Ativar protecao de senhas vazadas (requer configuracao manual)
