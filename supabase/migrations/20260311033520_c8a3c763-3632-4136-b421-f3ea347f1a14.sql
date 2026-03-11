
-- Tabela de configuração do WhatsApp (Evolution API)
CREATE TABLE public.whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_url text NOT NULL DEFAULT '',
  api_key text NOT NULL DEFAULT '',
  instance_name text NOT NULL DEFAULT 'default',
  is_active boolean NOT NULL DEFAULT false,
  welcome_message text NOT NULL DEFAULT 'Olá! 👋 Seja bem-vindo(a) à *ZEBRAI DRINKS*! 🦓🍹

Segue o link do nosso cardápio:
{site_url}

Fique à vontade para fazer seu pedido! 😊',
  order_confirmed_message text NOT NULL DEFAULT '🍹 *{customer_name}*, boas notícias! Seu pedido foi confirmado e já está em preparo! 🚀

📋 *Pedido #{order_id}*
{order_items}

💲 *Valor total: R$ {total}*
Valor da entrega: R$ {delivery_fee}
Forma de pagamento: *{payment_method}*',
  order_delivering_message text NOT NULL DEFAULT '🛵 *{customer_name}*, seu pedido está a caminho! 🎉

Pedido #{order_id}
Em breve estará com você! 😊',
  order_delivered_message text NOT NULL DEFAULT '✅ *{customer_name}*, seu pedido foi entregue!

Obrigado por escolher a Zebrai Drinks! 🦓🍹
Esperamos que goste! 💛',
  menu_message text NOT NULL DEFAULT '*Olá! Como posso te ajudar?* 🦓

1️⃣ Ver Cardápio 🍹
2️⃣ Fazer Pedido 🛒
3️⃣ Acompanhar Pedido 📦
4️⃣ Falar com Atendente 💬

_Responda com o número da opção desejada._',
  menu_option_1_reply text NOT NULL DEFAULT 'Acesse nosso cardápio completo aqui: {site_url} 🍹',
  menu_option_2_reply text NOT NULL DEFAULT 'Faça seu pedido diretamente pelo nosso site: {site_url} 🛒',
  menu_option_3_reply text NOT NULL DEFAULT 'Acompanhe seu pedido aqui: {site_url}/pedido 📦',
  menu_option_4_reply text NOT NULL DEFAULT 'Um momento! Vou chamar um atendente para você. 💬',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp config" ON public.whatsapp_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "WhatsApp config readable by service role" ON public.whatsapp_config
  FOR SELECT TO anon
  USING (false);
