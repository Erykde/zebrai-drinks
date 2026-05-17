import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ShoppingCart, Receipt, Truck, MoreHorizontal, Calendar } from 'lucide-react';

type Category = 'mercado' | 'conta' | 'fornecedor' | 'outros';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  expense_date: string;
  notes: string | null;
  created_at: string;
}

const CATEGORIES: { value: Category; label: string; icon: any; color: string }[] = [
  { value: 'mercado', label: 'Mercado', icon: ShoppingCart, color: 'text-green-500' },
  { value: 'fornecedor', label: 'Fornecedor', icon: Truck, color: 'text-blue-500' },
  { value: 'conta', label: 'Conta/Boleto', icon: Receipt, color: 'text-orange-500' },
  { value: 'outros', label: 'Outros', icon: MoreHorizontal, color: 'text-muted-foreground' },
];

const today = () => new Date().toISOString().slice(0, 10);

const ExpensesManager = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'mercado' as Category,
    expense_date: today(),
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<'all' | Category>('all');

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Expense[];
    },
  });

  const filtered = filter === 'all' ? expenses : expenses.filter(e => e.category === filter);
  const totalMonth = expenses
    .filter(e => e.expense_date.slice(0, 7) === today().slice(0, 7))
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalAll = expenses.reduce((s, e) => s + Number(e.amount), 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!form.description.trim() || !amount || amount <= 0) {
      toast.error('Preencha descrição e valor');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      description: form.description.trim(),
      amount,
      category: form.category,
      expense_date: form.expense_date,
      notes: form.notes.trim() || null,
    });
    setSaving(false);
    if (error) {
      toast.error('Erro ao salvar: ' + error.message);
      return;
    }
    toast.success('Despesa registrada!');
    setForm({ description: '', amount: '', category: form.category, expense_date: today(), notes: '' });
    qc.invalidateQueries({ queryKey: ['expenses'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Apagar essa despesa?')) return;
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
      toast.error('Erro ao apagar');
      return;
    }
    toast.success('Apagado');
    qc.invalidateQueries({ queryKey: ['expenses'] });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-foreground tracking-wider">DESPESAS</h2>
        <p className="text-sm text-muted-foreground">Registre tudo que gastou (mercado, contas, fornecedor...)</p>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Esse mês</p>
          <p className="text-2xl font-bold text-destructive mt-1">R$ {totalMonth.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Total geral</p>
          <p className="text-2xl font-bold text-foreground mt-1">R$ {totalAll.toFixed(2)}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="bg-card rounded-2xl border border-border p-5 space-y-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Plus className="h-3.5 w-3.5" /> Nova despesa
        </p>

        <div className="grid grid-cols-4 gap-2">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, category: value })}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-medium transition-all ${
                form.category === value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Descrição (ex: Compra no Atacadão)"
          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          maxLength={200}
        />

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: e.target.value })}
            placeholder="Valor R$"
            step="0.01"
            min="0"
            className="px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="date"
            value={form.expense_date}
            onChange={e => setForm({ ...form, expense_date: e.target.value })}
            className="px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <textarea
          value={form.notes}
          onChange={e => setForm({ ...form, notes: e.target.value })}
          placeholder="Observações (opcional)"
          rows={2}
          className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          maxLength={500}
        />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gradient-gold text-primary-foreground py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Salvando...' : 'Registrar despesa'}
        </button>
      </form>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
            filter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
          }`}
        >
          Todas ({expenses.length})
        </button>
        {CATEGORIES.map(({ value, label }) => {
          const count = expenses.filter(e => e.category === value).length;
          return (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border ${
                filter === value ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              }`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Carregando...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">Nenhuma despesa registrada</p>
        ) : (
          filtered.map(exp => {
            const cat = CATEGORIES.find(c => c.value === exp.category)!;
            const Icon = cat.icon;
            return (
              <div key={exp.id} className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center ${cat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{exp.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(exp.expense_date + 'T12:00:00').toLocaleDateString('pt-BR')} • {cat.label}
                  </p>
                  {exp.notes && <p className="text-xs text-muted-foreground mt-1 italic">{exp.notes}</p>}
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-destructive">- R$ {Number(exp.amount).toFixed(2)}</p>
                </div>
                <button
                  onClick={() => remove(exp.id)}
                  className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  title="Apagar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ExpensesManager;
