## 1. Taxa de entrega por km (R$ 1/km, mínimo R$ 7)

**Regra**: `taxa = max(7, arredondar(km))` → 6km=R$7, 7km=R$7, 20km=R$20.

**Cálculo de distância (Google Maps Distance Matrix API)**:
- Origem fixa: Rua Monte Sinai, 38 – Costeira, São José dos Pinhais (já em `site_settings.store_address`).
- Destino: endereço digitado pelo cliente no checkout.
- Vou precisar da sua **chave de API do Google Maps** (com Distance Matrix API ativada). Vou pedir via secret antes de implementar essa parte.

**Onde será usada**:
- No `CheckoutForm`: ao digitar/confirmar o endereço, chama uma Edge Function nova `calc-delivery-fee` que consulta o Google Maps no servidor (chave protegida) e retorna `{ km, fee }`.
- A taxa aparece automaticamente no resumo do carrinho e vai junto com o pedido.
- Fallback: se a API falhar ou o endereço for inválido, usa R$ 7 (mínimo) e mostra aviso.

## 2. Ordem de Compra — 3 seções no admin

Cada uma com seu próprio card e título claro:

### 2.1 "📋 Pedidos do Cliente" (já existe)
- Renomeio o card atual em **OrderManager** para deixar explícito.
- Botão "Imprimir comprovante" já existe (impressora térmica).

### 2.2 "🛒 Compras de Fornecedor" (novo)
- Nova aba/seção no admin: cadastrar **fornecedores** (nome, telefone, categoria) e gerar **pedidos de compra** (lista de ingredientes a comprar, quantidade, custo estimado, status: rascunho/enviado/recebido).
- Tabelas novas: `suppliers`, `purchase_orders`, `purchase_order_items`.
- Botão "Gerar automático de ingredientes em falta" (usa `product_ingredients.stock` baixo).

### 2.3 "📜 Histórico do Cliente" (novo)
- Já temos `loyalty_points` e `customer_orders`. Nova aba "Clientes" lista cada cliente (por telefone) com:
  - Total de pedidos, total gasto, pontos
  - Lista expandível dos pedidos antigos com itens

## 3. Arquivos a criar/editar

**Banco (migration)**:
- `suppliers (id, name, phone, category, notes)`
- `purchase_orders (id, supplier_id, status, total, notes, created_at)`
- `purchase_order_items (id, purchase_order_id, ingredient_name, quantity, unit_cost, total)`
- RLS: somente admins.

**Edge Function nova**:
- `supabase/functions/calc-delivery-fee/index.ts` — recebe `{ address }`, chama Google Distance Matrix, retorna `{ km, fee }`.

**Frontend**:
- `src/components/CheckoutForm.tsx` — ao mudar endereço, chama a function e atualiza `delivery_fee`.
- `src/components/SuppliersManager.tsx` (novo) — CRUD fornecedores + pedidos de compra.
- `src/components/CustomerHistoryManager.tsx` (novo) — lista clientes e pedidos.
- `src/pages/Admin.tsx` — adicionar duas novas abas: "Fornecedores" e "Clientes".

## 4. O que preciso de você

1. **Chave da API do Google Maps** (Distance Matrix API ativada) — vou pedir via secret seguro depois que aprovar o plano.
2. Confirmar: posso prosseguir com `R$ 1/km com mínimo R$ 7`?

Aprovar para eu começar?