import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Save, Send, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface WhatsAppConfig {
  id: string;
  api_url: string;
  api_key: string;
  instance_name: string;
  is_active: boolean;
  welcome_message: string;
  order_confirmed_message: string;
  order_delivering_message: string;
  order_delivered_message: string;
  menu_message: string;
  menu_option_1_reply: string;
  menu_option_2_reply: string;
  menu_option_3_reply: string;
  menu_option_4_reply: string;
}

const DEFAULT_CONFIG: Omit<WhatsAppConfig, 'id'> = {
  api_url: '',
  api_key: '',
  instance_name: 'default',
  is_active: false,
  welcome_message: '',
  order_confirmed_message: '',
  order_delivering_message: '',
  order_delivered_message: '',
  menu_message: '',
  menu_option_1_reply: '',
  menu_option_2_reply: '',
  menu_option_3_reply: '',
  menu_option_4_reply: '',
};

const WhatsAppManager = () => {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [activeSection, setActiveSection] = useState<'config' | 'templates' | 'menu'>('config');

  const { data: config, isLoading } = useQuery({
    queryKey: ['whatsapp-config'],
    queryFn: async (): Promise<WhatsAppConfig | null> => {
      const { data, error } = await supabase
        .from('whatsapp_config')
        .select('*')
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data as WhatsAppConfig | null;
    },
  });

  const [form, setForm] = useState<Omit<WhatsAppConfig, 'id'>>(DEFAULT_CONFIG);

  // Sync form when data loads
  const [loaded, setLoaded] = useState(false);
  if (config && !loaded) {
    setForm({
      api_url: config.api_url,
      api_key: config.api_key,
      instance_name: config.instance_name,
      is_active: config.is_active,
      welcome_message: config.welcome_message,
      order_confirmed_message: config.order_confirmed_message,
      order_delivering_message: config.order_delivering_message,
      order_delivered_message: config.order_delivered_message,
      menu_message: config.menu_message,
      menu_option_1_reply: config.menu_option_1_reply,
      menu_option_2_reply: config.menu_option_2_reply,
      menu_option_3_reply: config.menu_option_3_reply,
      menu_option_4_reply: config.menu_option_4_reply,
    });
    setLoaded(true);
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      if (config?.id) {
        const { error } = await supabase
          .from('whatsapp_config')
          .update({ ...form, updated_at: new Date().toISOString() } as any)
          .eq('id', config.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_config')
          .insert(form as any);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ['whatsapp-config'] });
      toast.success('Configuração salva!');
    } catch (e) {
      toast.error('Erro ao salvar');
      console.error(e);
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      toast.error('Digite um número para teste');
      return;
    }
    setTesting(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/whatsapp-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'apikey': anonKey,
        },
        body: JSON.stringify({
          phone: testPhone,
          message: '🧪 Teste do WhatsApp Bot - Zebrai Drinks! Se você recebeu essa mensagem, a integração está funcionando! 🦓🍹',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro');
      toast.success('Mensagem de teste enviada!');
    } catch (e: any) {
      toast.error(e.message || 'Erro ao enviar teste');
    }
    setTesting(false);
  };

  const webhookUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`;

  if (isLoading) return <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando...</CardContent></Card>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-green-500" />
          WhatsApp Bot
          {form.is_active ? (
            <span className="ml-auto flex items-center gap-1 text-xs text-green-500 font-normal">
              <CheckCircle className="h-3.5 w-3.5" /> Ativo
            </span>
          ) : (
            <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground font-normal">
              <XCircle className="h-3.5 w-3.5" /> Inativo
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Section Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { key: 'config' as const, label: '⚙️ Configuração' },
            { key: 'templates' as const, label: '📋 Templates' },
            { key: 'menu' as const, label: '📱 Menu Interativo' },
          ].map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeSection === s.key ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === 'config' && (
          <div className="space-y-3 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-card-foreground mb-1 block">URL da Evolution API</label>
              <input
                value={form.api_url}
                onChange={e => setForm({ ...form, api_url: e.target.value })}
                placeholder="https://evo.seudominio.com"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-card-foreground mb-1 block">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={form.api_key}
                  onChange={e => setForm({ ...form, api_key: e.target.value })}
                  placeholder="Sua API Key da Evolution"
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                />
                <button
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-2 text-muted-foreground hover:text-foreground rounded-lg border border-input"
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-card-foreground mb-1 block">Nome da Instância</label>
              <input
                value={form.instance_name}
                onChange={e => setForm({ ...form, instance_name: e.target.value })}
                placeholder="default"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-card-foreground">Ativar Bot</label>
              <button
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`relative w-12 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-muted'}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
              </button>
            </div>

            {/* Webhook URL */}
            <div className="border border-border rounded-lg p-3 bg-muted/50">
              <p className="text-xs font-medium text-card-foreground mb-1">URL do Webhook (cole na Evolution API)</p>
              <div className="flex gap-2 items-center">
                <code className="text-xs text-muted-foreground break-all flex-1">{webhookUrl}</code>
                <button
                  onClick={() => { navigator.clipboard.writeText(webhookUrl); toast.success('URL copiada!'); }}
                  className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90 whitespace-nowrap"
                >
                  Copiar
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Configure este webhook na Evolution API em: Instância → Webhook → URL
              </p>
            </div>

            {/* Test */}
            <div className="border border-dashed border-green-500/30 rounded-lg p-3">
              <p className="text-xs font-medium text-card-foreground mb-2">🧪 Testar Envio</p>
              <div className="flex gap-2">
                <input
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value)}
                  placeholder="41999999999"
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
                />
                <button
                  onClick={handleTest}
                  disabled={testing}
                  className="flex items-center gap-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'templates' && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-xs text-muted-foreground">
              Use variáveis: <code className="bg-muted px-1 rounded">{'{customer_name}'}</code>, <code className="bg-muted px-1 rounded">{'{order_id}'}</code>, <code className="bg-muted px-1 rounded">{'{total}'}</code>, <code className="bg-muted px-1 rounded">{'{delivery_fee}'}</code>, <code className="bg-muted px-1 rounded">{'{order_items}'}</code>, <code className="bg-muted px-1 rounded">{'{site_url}'}</code>
            </p>

            {[
              { key: 'welcome_message' as const, label: '👋 Mensagem de Boas-Vindas', desc: 'Enviada quando alguém manda qualquer mensagem pela primeira vez' },
              { key: 'order_confirmed_message' as const, label: '🍹 Pedido Confirmado / Em Preparo', desc: 'Enviada quando o status muda para "Preparando"' },
              { key: 'order_delivering_message' as const, label: '🛵 Saiu para Entrega', desc: 'Enviada quando o status muda para "Saiu p/ Entrega"' },
              { key: 'order_delivered_message' as const, label: '✅ Pedido Entregue', desc: 'Enviada quando o status muda para "Entregue"' },
            ].map(t => (
              <div key={t.key}>
                <label className="text-xs font-medium text-card-foreground mb-1 block">{t.label}</label>
                <p className="text-[10px] text-muted-foreground mb-1">{t.desc}</p>
                <textarea
                  value={(form as any)[t.key]}
                  onChange={e => setForm({ ...form, [t.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm h-28 resize-none"
                  maxLength={1000}
                />
              </div>
            ))}
          </div>
        )}

        {activeSection === 'menu' && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-card-foreground mb-1 block">📱 Menu Principal</label>
              <p className="text-[10px] text-muted-foreground mb-1">Enviado quando o cliente manda qualquer mensagem que não é um número de opção</p>
              <textarea
                value={form.menu_message}
                onChange={e => setForm({ ...form, menu_message: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm h-28 resize-none"
                maxLength={1000}
              />
            </div>

            {[
              { key: 'menu_option_1_reply' as const, label: '1️⃣ Resposta Opção 1 (Ver Cardápio)' },
              { key: 'menu_option_2_reply' as const, label: '2️⃣ Resposta Opção 2 (Fazer Pedido)' },
              { key: 'menu_option_3_reply' as const, label: '3️⃣ Resposta Opção 3 (Acompanhar Pedido)' },
              { key: 'menu_option_4_reply' as const, label: '4️⃣ Resposta Opção 4 (Falar com Atendente)' },
            ].map(t => (
              <div key={t.key}>
                <label className="text-xs font-medium text-card-foreground mb-1 block">{t.label}</label>
                <textarea
                  value={(form as any)[t.key]}
                  onChange={e => setForm({ ...form, [t.key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm h-16 resize-none"
                  maxLength={500}
                />
              </div>
            ))}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-2.5 rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Salvando...' : 'Salvar Configurações'}
        </button>
      </CardContent>
    </Card>
  );
};

export default WhatsAppManager;
