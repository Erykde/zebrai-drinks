import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, User, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  'Como uso a aba Financeiro?',
  'Como criar um cupom de desconto?',
  'Dicas para vender mais no fim de semana',
  'Como funciona o frete e quando ativar o grátis?',
  'O que é o Zebrai Club?',
  'Quais drinks dão mais lucro?',
];

const STORAGE_KEY = 'zebrai-assistant-history-v1';

export default function AdminAssistant() {
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [
      {
        role: 'assistant',
        content: 'Oi! 👋 Sou a **IA Zebrai**, sua consultora de negócios.\n\nMe pergunte qualquer coisa sobre o seu painel administrativo — como usar cada aba, dicas de gestão, marketing ou como aumentar suas vendas. 🚀',
      },
    ];
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-assistant', {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, { role: 'assistant', content: data?.reply || '...' }]);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao falar com a IA');
      setMessages(next);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100dvh-10rem)]">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-amber-500/5 border border-primary/20 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg text-foreground">Assistente IA Zebrai</h2>
            <p className="text-xs text-muted-foreground">Sua consultora 24/7 do painel</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground'}`}>
              {m.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-foreground'}`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <Bot className="h-4 w-4 text-foreground" />
            </div>
            <div className="bg-card border border-border rounded-2xl px-4 py-2.5 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Pensando...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-primary/15 hover:text-primary border border-border transition-colors text-muted-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-2xl bg-card border border-border p-2 flex items-end gap-2">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          onFocus={e => setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250)}
          placeholder="Pergunte qualquer coisa sobre o ADM..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none px-2 py-2 max-h-32"
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          className="shrink-0 h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
