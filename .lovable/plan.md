

# Revisao de Seguranca - Zebrai Drinks

## Resumo

A analise encontrou **4 problemas criticos**, **5 alertas medios** e **1 item informativo**. Abaixo estao organizados por prioridade.

---

## CRITICOS (corrigir imediatamente)

### 1. Dados de clientes expostos publicamente
As tabelas `customer_orders` e `customer_order_items` tem politica SELECT com `USING (true)`, ou seja, **qualquer pessoa na internet** pode ver nomes, telefones, enderecos e pedidos de todos os clientes.

**Correcao:** Trocar a politica SELECT dessas tabelas para permitir leitura apenas por admins.

### 2. Precos de custo visiveis ao publico
A tabela `products` expoe a coluna `cost_price` publicamente, revelando margens de lucro para concorrentes.

**Correcao:** Criar uma VIEW publica que exclui `cost_price`, ou usar politica RLS mais restritiva.

### 3. Funcao `has_role()` acessivel como RPC publica
Qualquer pessoa pode chamar `supabase.rpc('has_role', ...)` para descobrir quais usuarios sao admins, sem estar autenticado.

**Correcao:** Revogar permissao de execucao publica da funcao e alterar o codigo para consultar a tabela `user_roles` diretamente (protegida por RLS).

### 4. Pedidos podem ser criados sem limite por qualquer pessoa
As tabelas `orders`, `customer_orders` e `customer_order_items` permitem INSERT com `WITH CHECK (true)` — qualquer bot pode inundar o sistema com pedidos falsos.

**Correcao:** Criar uma Edge Function para criacao de pedidos com validacao server-side e rate limiting basico.

---

## ALERTAS (corrigir em breve)

### 5. Protecao contra senhas vazadas desativada
O sistema de autenticacao nao verifica se senhas usadas ja foram comprometidas em vazamentos conhecidos.

**Correcao:** Ativar a protecao de senhas vazadas nas configuracoes de autenticacao.

### 6. Validacao de inputs insuficiente no checkout
O formulario de checkout nao valida formato de telefone, comprimento maximo dos campos adequadamente, nem sanitiza entradas antes de enviar ao banco.

**Correcao:** Adicionar validacao com Zod no CheckoutForm antes do envio.

---

## Detalhes Tecnicos

### Migracoes SQL necessarias

**Restringir leitura de pedidos apenas para admins:**
```sql
-- Remover politicas publicas de leitura
DROP POLICY "Orders are publicly readable" ON customer_orders;
DROP POLICY "Order items are publicly readable" ON customer_order_items;

-- Criar politicas restritas
CREATE POLICY "Admins can read orders" ON customer_orders
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Order owners can read own order" ON customer_orders
  FOR SELECT USING (id = current_setting('app.current_order_id', true)::uuid);

CREATE POLICY "Admins can read order items" ON customer_order_items
  FOR SELECT USING (has_role(auth.uid(), 'admin'));
```

**Proteger cost_price dos produtos:**
Criar uma View ou ajustar a query no frontend para nao expor `cost_price` ao publico (a coluna so deve ser usada no Admin).

**Restringir funcao has_role:**
```sql
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM authenticated;
```
E alterar o codigo em `AuthContext.tsx` e `Auth.tsx` para consultar `user_roles` diretamente via query com RLS.

**Restringir inserts de pedidos:**
Trocar `WITH CHECK (true)` por uma Edge Function que valida os dados antes de inserir.

### Alteracoes no codigo

1. **AuthContext.tsx / Auth.tsx** — substituir `supabase.rpc('has_role', ...)` por query direta a `user_roles`
2. **CheckoutForm.tsx** — adicionar validacao com Zod (nome, telefone, endereco)
3. **useProducts.ts** — remover `cost_price` da query publica (usar `.select('id, name, description, price, ...')` sem cost_price)
4. **Nova Edge Function** `create-order` — validar e inserir pedidos server-side
5. **OrderTracking.tsx** — ajustar para funcionar com a nova politica de leitura (o cliente precisa de uma forma de ler seu proprio pedido, possivelmente via Edge Function)

### Ordem de implementacao

1. Restringir funcao `has_role` + atualizar codigo de auth
2. Restringir leitura de pedidos (SQL + ajustar OrderTracking)
3. Esconder `cost_price` da query publica
4. Criar Edge Function para criacao de pedidos
5. Adicionar validacao Zod no checkout
6. Ativar protecao de senhas vazadas

