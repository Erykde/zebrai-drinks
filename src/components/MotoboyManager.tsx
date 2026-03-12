import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Trash2, User, Phone, ToggleLeft, ToggleRight } from 'lucide-react';
import { toast } from 'sonner';

interface Motoboy {
  id: string;
  name: string;
  phone: string;
  is_active: boolean;
  created_at: string;
}

const MotoboyManager = () => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const { data: motoboys = [], isLoading } = useQuery({
    queryKey: ['motoboys'],
    queryFn: async (): Promise<Motoboy[]> => {
      const { data, error } = await supabase
        .from('motoboys')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMotoboy = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('motoboys').insert({
        name: name.trim(),
        phone: phone.trim(),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Motoboy cadastrado!');
      setName('');
      setPhone('');
      queryClient.invalidateQueries({ queryKey: ['motoboys'] });
    },
    onError: () => toast.error('Erro ao cadastrar motoboy'),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('motoboys').update({ is_active } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['motoboys'] }),
  });

  const deleteMotoboy = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('motoboys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Motoboy removido!');
      queryClient.invalidateQueries({ queryKey: ['motoboys'] });
    },
    onError: () => toast.error('Erro ao remover motoboy'),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    addMotoboy.mutate();
  };

  if (isLoading) return <p className="text-muted-foreground text-center py-4">Carregando...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-display text-lg text-foreground">🏍️ Motoboys</h3>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 flex-wrap">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nome do motoboy"
          className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
        />
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="Telefone (WhatsApp)"
          className="flex-1 min-w-[150px] px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm"
        />
        <button
          type="submit"
          disabled={addMotoboy.isPending}
          className="flex items-center gap-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </form>

      {/* List */}
      {motoboys.length === 0 ? (
        <p className="text-muted-foreground text-center py-6 text-sm">Nenhum motoboy cadastrado.</p>
      ) : (
        <div className="space-y-2">
          {motoboys.map(m => (
            <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${m.is_active ? 'border-border bg-card' : 'border-border/50 bg-muted/50 opacity-60'}`}>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-card-foreground text-sm">{m.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {m.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive.mutate({ id: m.id, is_active: !m.is_active })}
                  className="text-muted-foreground hover:text-foreground"
                  title={m.is_active ? 'Desativar' : 'Ativar'}
                >
                  {m.is_active ? <ToggleRight className="h-5 w-5 text-green-500" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => deleteMotoboy.mutate(m.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MotoboyManager;
