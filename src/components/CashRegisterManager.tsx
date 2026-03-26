import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, Minus, Lock, Unlock, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface CashRegister {
  id: string;
  opened_at: string;
  closed_at: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: string;
  notes: string | null;
}

interface CashTransaction {
  id: string;
  register_id: string;
  type: string;
  amount: number;
  description: string;
  category: string;
  created_at: string;
}

const CATEGORIES = [
  { value: 'venda', label: '💰 Venda' },
  { value: 'sangria', label: '🔻 Sangria' },
  { value: 'reforco', label: '🔺 Reforço' },
  { value: 'despesa', label: '📦 Despesa' },
  { value: 'troco', label: '💵 Troco' },
  { value: 'outro', label: '📝 Outro' },
];

const CashRegisterManager = () => {
  const queryClient = useQueryClient();
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [txForm, setTxForm] = useState({ type: 'entry' as 'entry' | 'exit', amount: '', description: '', category: 'venda' });

  // Get current open register
  const { data: openRegister, isLoading: loadingRegister } = useQuery({
    queryKey: ['cash-register-open'],
    queryFn: async (): Promise<CashRegister | null> => {
      const { data, error } = await supabase
        .from('cash_register')
        .select('*')
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as CashRegister | null;
    },
  });

  // Get transactions for open register
  const { data: transactions = [] } = useQuery({
    queryKey: ['cash-transactions', openRegister?.id],
    queryFn: async (): Promise<CashTransaction[]> => {
      if (!openRegister) return [];
      const { data, error } = await supabase
        .from('cash_transactions')
        .select('*')
        .eq('register_id', openRegister.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as CashTransaction[];
    },
    enabled: !!openRegister,
  });

  // Get closed registers (history)
  const { data: history = [] } = useQuery({
    queryKey: ['cash-register-history'],
    queryFn: async (): Promise<CashRegister[]> => {
      const { data, error } = await supabase
        .from('cash_register')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as unknown as CashRegister[];
    },
  });

  const totalEntries = transactions.filter(t => t.type === 'entry').reduce((s, t) => s + Number(t.amount), 0);
  const totalExits = transactions.filter(t => t.type === 'exit').reduce((s, t) => s + Number(t.amount), 0);
  const currentBalance = (openRegister?.opening_balance ?? 0) + totalEntries - totalExits;

  const handleOpenRegister = async () => {
    const balance = parseFloat(openingBalance) || 0;
    const { error } = await supabase.from('cash_register').insert({
      opening_balance: balance,
      status: 'open',
    } as any);
    if (error) { toast.error('Erro ao abrir caixa'); return; }
    toast.success('Caixa aberto!');
    setOpeningBalance('');
    queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
  };

  const handleCloseRegister = async () => {
    if (!openRegister) return;
    const { error } = await supabase.from('cash_register')
      .update({
        status: 'closed',
        closed_at: new Date().toISOString(),
        closing_balance: currentBalance,
        notes: closingNotes || null,
      } as any)
      .eq('id', openRegister.id);
    if (error) { toast.error('Erro ao fechar caixa'); return; }
    toast.success('Caixa fechado!');
    setClosingNotes('');
    queryClient.invalidateQueries({ queryKey: ['cash-register-open'] });
    queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
  };

  const handleAddTransaction = async () => {
    if (!openRegister || !txForm.amount) return;
    const { error } = await supabase.from('cash_transactions').insert({
      register_id: openRegister.id,
      type: txForm.type,
      amount: parseFloat(txForm.amount),
      description: txForm.description || (txForm.type === 'entry' ? 'Entrada' : 'Saída'),
      category: txForm.category,
    } as any);
    if (error) { toast.error('Erro ao registrar'); return; }
    toast.success(txForm.type === 'entry' ? 'Entrada registrada!' : 'Saída registrada!');
    setTxForm({ type: 'entry', amount: '', description: '', category: 'venda' });
    queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('cash_transactions').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    toast.success('Removido!');
    queryClient.invalidateQueries({ queryKey: ['cash-transactions'] });
  };

  const handleDeleteRegister = async (id: string) => {
    // Transactions are cascade-deleted
    const { error } = await supabase.from('cash_register').delete().eq('id', id);
    if (error) { toast.error('Erro ao excluir caixa'); return; }
    toast.success('Caixa excluído!');
    queryClient.invalidateQueries({ queryKey: ['cash-register-history'] });
  };

  const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
  const fmtTime = (d: string) => new Date(d).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  if (loadingRegister) return <p className="text-muted-foreground">Carregando caixa...</p>;

  // Caixa fechado — abrir novo
  if (!openRegister) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4 text-destructive" /> Caixa Fechado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Informe o saldo inicial para abrir o caixa.</p>
            <div>
              <label className="text-xs text-muted-foreground">Saldo inicial (R$)</label>
              <Input
                type="number"
                value={openingBalance}
                onChange={e => setOpeningBalance(e.target.value)}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="mt-1"
              />
            </div>
            <Button onClick={handleOpenRegister} className="w-full">
              <Unlock className="h-4 w-4 mr-2" /> Abrir Caixa
            </Button>
          </CardContent>
        </Card>

        {/* Histórico */}
        {history.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">📋 Histórico de Caixas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {history.map(h => (
                  <div key={h.id} className="flex items-center justify-between bg-muted rounded-lg p-3 text-sm">
                    <div>
                      <p className="font-medium text-foreground">{fmtDate(h.opened_at)} — {fmtTime(h.opened_at)} a {h.closed_at ? fmtTime(h.closed_at) : '?'}</p>
                      {h.notes && <p className="text-xs text-muted-foreground">{h.notes}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Abertura: {fmt(h.opening_balance)}</p>
                      <p className="font-bold text-foreground">{fmt(h.closing_balance ?? 0)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Caixa aberto
  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-3 text-center">
            <TrendingUp className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Entradas</p>
            <p className="text-sm font-bold text-green-600">{fmt(totalEntries)}</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-3 text-center">
            <TrendingDown className="h-4 w-4 text-red-600 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Saídas</p>
            <p className="text-sm font-bold text-red-600">{fmt(totalExits)}</p>
          </CardContent>
        </Card>
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-3 text-center">
            <Wallet className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground font-semibold uppercase">Saldo</p>
            <p className="text-sm font-bold text-primary">{fmt(currentBalance)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Info do caixa */}
      <Card>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Unlock className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-foreground">Caixa aberto às {fmtTime(openRegister.opened_at)}</span>
          </div>
          <span className="text-xs text-muted-foreground">Abertura: {fmt(openRegister.opening_balance)}</span>
        </CardContent>
      </Card>

      {/* Adicionar movimentação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" /> Nova Movimentação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant={txForm.type === 'entry' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTxForm(f => ({ ...f, type: 'entry' }))}
            >
              <Plus className="h-3 w-3 mr-1" /> Entrada
            </Button>
            <Button
              variant={txForm.type === 'exit' ? 'destructive' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setTxForm(f => ({ ...f, type: 'exit' }))}
            >
              <Minus className="h-3 w-3 mr-1" /> Saída
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Valor (R$)</label>
              <Input
                type="number"
                value={txForm.amount}
                onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="0,00"
                step="0.01"
                min="0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Categoria</label>
              <select
                value={txForm.category}
                onChange={e => setTxForm(f => ({ ...f, category: e.target.value }))}
                className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground">Descrição</label>
            <Input
              value={txForm.description}
              onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ex: Venda mesa 3"
              className="mt-1"
            />
          </div>

          <Button onClick={handleAddTransaction} className="w-full" disabled={!txForm.amount}>
            <Plus className="h-4 w-4 mr-2" /> Registrar
          </Button>
        </CardContent>
      </Card>

      {/* Lista de movimentações */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📋 Movimentações ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-80 overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 bg-muted rounded-lg p-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  tx.type === 'entry' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                }`}>
                  {tx.type === 'entry' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {CATEGORIES.find(c => c.value === tx.category)?.label || tx.category} · {fmtTime(tx.created_at)}
                  </p>
                </div>
                <span className={`text-sm font-bold shrink-0 ${tx.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'entry' ? '+' : '-'}{fmt(tx.amount)}
                </span>
                <button onClick={() => handleDeleteTransaction(tx.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Fechar caixa */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-destructive">
            <Lock className="h-4 w-4" /> Fechar Caixa
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Saldo de fechamento: <strong className="text-foreground">{fmt(currentBalance)}</strong></p>
          <div>
            <label className="text-xs text-muted-foreground">Observações (opcional)</label>
            <Input
              value={closingNotes}
              onChange={e => setClosingNotes(e.target.value)}
              placeholder="Ex: Dia tranquilo, sem problemas"
              className="mt-1"
            />
          </div>
          <Button variant="destructive" onClick={handleCloseRegister} className="w-full">
            <Lock className="h-4 w-4 mr-2" /> Fechar Caixa
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CashRegisterManager;
