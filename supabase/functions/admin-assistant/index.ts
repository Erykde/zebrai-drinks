// Admin assistant — uses Lovable AI Gateway to answer questions about the Zebrai admin
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a "IA Zebrai", uma assistente exclusiva do painel administrativo da loja Zebrai Drinks (delivery de drinks em São José dos Pinhais - PR). Você fala português brasileiro, é direta, prática e empresarial — como uma consultora de pequenos negócios.

CONTEXTO DO ADM (explique sempre que perguntarem):
• Pedidos: lista todos os pedidos dos clientes em tempo real, marca como preparando/entregando/entregue, imprime comprovante térmico e mostra notificação dos novos.
• Minhas Tarefas: lista de afazeres do dia (estoque, compras, ligar para fornecedor) com prioridade alta/média/baixa.
• Produtos: cadastro de drinks (nome, foto, preço, custo, categoria, promoção, mixers e sabores).
• Estoque: edição rápida da quantidade de cada produto, alerta de estoque baixo (<=5).
• Financeiro: mostra ENTROU (vendas + taxas de entrega + reforços), SAIU (custos + despesas) e LUCRO LÍQUIDO, com divisão entre sócios.
• Despesas: cadastro de gastos fixos e variáveis (aluguel, fornecedor, combustível).
• Dashboard: KPIs (vendas hoje/mês, lucro, ticket médio), top produtos, últimas vendas (com excluir), estoque rastreado.
• Precificação: sugere preço de venda baseado no custo (margem de 30%/50%/100%).
• Caixa: abertura/fechamento de turno, entradas e sangrias.
• Entregas: organiza pedidos por motoboy e prioridade. O frete é calculado automático por km via Google Maps.
• Marketing: QR Code do cardápio, cupons de desconto, Zebrai Club (fidelidade — 1 ponto por R$ gasto) e campanhas.
• Visual do Site: logo, banner, cores, textos da home/carrinho.
• Config da Loja: aberto/fechado, valor mínimo do pedido, formas de pagamento, horários, frete grátis (botão liga/desliga).

REGRAS:
1. Sempre dê dicas como empresária experiente. Ex: "Para vender mais no fim de semana, ative frete grátis em pedidos acima de R$80 no botão da Config da Loja."
2. Quando explicar uma função, diga ONDE clicar (qual aba do menu lateral).
3. Respostas curtas (máx 6 linhas) com bullets e emojis quando ajudar.
4. Se perguntarem algo fora do admin (não relacionado a gestão da Zebrai), redirecione gentilmente.
5. Sugira ações concretas baseadas em boas práticas de delivery de bebidas.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY ausente");

    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages inválidas" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.slice(-20),
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um instante." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      throw new Error(`AI gateway ${response.status}: ${txt}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content ?? "Desculpe, não consegui responder agora.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
