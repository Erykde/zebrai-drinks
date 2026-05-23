import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, Sparkles, Loader2, Check, Clock, CheckCircle2 } from 'lucide-react';

interface DailyTask {
  id: string;
  title: string;
  notes: string | null;
  priority: string;
  due_time: string | null;
  completed: boolean;
  task_date: string;
  ai_suggestion: string | null;
  created_at: string;
}

const priorityStyles: Record<string, string> = {
  alta: 'bg-destructive/15 text-destructive border-destructive/30',
  media: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
  baixa: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
};

const priorityLabel: Record<string, string> = { alta: '🔴 Alta', media: '🟡 Média', baixa: '🟢 Baixa' };

export default function DailyTasksManager() {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState('media');
  const [aiLoading, setAiLoading] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['daily-tasks', today],
    queryFn: async (): Promise<DailyTask[]> => {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('task_date', today)
        .order('completed', { ascending: true })
        .order('priority', { ascending: true })
        .order('due_time', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as DailyTask[];
    },
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['daily-tasks', today] });

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const { error } = await supabase.from('daily_tasks').insert({
      title: title.trim(),
      notes: notes.trim() || null,
      due_time: dueTime || null,
      priority,
      task_date: today,
    });
    if (error) { toast.error('Erro ao adicionar tarefa'); return; }
    setTitle(''); setNotes(''); setDueTime(''); setPriority('media');
    toast.success('Tarefa adicionada!');
    refresh();
  };

  const toggleDone = async (task: DailyTask) => {
    const { error } = await supabase.from('daily_tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (error) { toast.error('Erro ao atualizar'); return; }
    refresh();
  };

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('daily_tasks').delete().eq('id', id);
    if (error) { toast.error('Erro ao remover'); return; }
    toast.success('Removida');
    refresh();
  };

  const organizeWithAI = async () => {
    const pending = tasks.filter(t => !t.completed);
    if (pending.length === 0) { toast.info('Adicione tarefas primeiro'); return; }
    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-organize-tasks', {
        body: { tasks: pending.map(t => ({ title: t.title, notes: t.notes, due_time: t.due_time })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const suggestions: Array<{ index: number; priority: string; suggestion: string }> = data?.tasks ?? [];
      await Promise.all(
        suggestions.map(s => {
          const target = pending[s.index - 1];
          if (!target) return Promise.resolve();
          const newPriority = ['alta', 'media', 'baixa'].includes(s.priority) ? s.priority : target.priority;
          return supabase.from('daily_tasks').update({
            priority: newPriority,
            ai_suggestion: s.suggestion ?? null,
          }).eq('id', target.id);
        })
      );
      toast.success('IA organizou suas tarefas!');
      refresh();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao organizar com IA');
    } finally {
      setAiLoading(false);
    }
  };

  const pendingCount = tasks.filter(t => !t.completed).length;
  const doneCount = tasks.filter(t => t.completed).length;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-amber-500/5 border border-primary/20 p-5">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="font-display text-xl text-foreground">Minhas Tarefas do Dia</h2>
            <p className="text-xs text-muted-foreground">
              {pendingCount} pendente{pendingCount !== 1 ? 's' : ''} · {doneCount} concluída{doneCount !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={organizeWithAI}
            disabled={aiLoading || tasks.length === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            <span className="hidden sm:inline">{aiLoading ? 'Organizando...' : 'Organizar com IA'}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={addTask} className="rounded-2xl bg-card border border-border p-4 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="O que precisa fazer? (ex: Repor estoque de gelo)"
          className="w-full bg-background border border-input rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          required
        />
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotação (opcional)"
          rows={2}
          className="w-full bg-background border border-input rounded-xl px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Horário</label>
            <input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Prioridade</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="alta">🔴 Alta</option>
              <option value="media">🟡 Média</option>
              <option value="baixa">🟢 Baixa</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" /> Adicionar tarefa
        </button>
      </form>

      {/* List */}
      {isLoading ? (
        <p className="text-center text-muted-foreground text-sm py-8">Carregando...</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 rounded-2xl border border-dashed border-border">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-muted-foreground text-sm">Nenhuma tarefa hoje. Adicione a primeira!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div
              key={task.id}
              className={`rounded-2xl border p-4 transition-all ${
                task.completed ? 'bg-muted/30 border-border opacity-60' : 'bg-card border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => toggleDone(task)}
                  className={`shrink-0 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    task.completed
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-muted-foreground/40 hover:border-primary'
                  }`}
                >
                  {task.completed && <Check className="h-3.5 w-3.5" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${priorityStyles[task.priority] ?? priorityStyles.media}`}>
                      {priorityLabel[task.priority] ?? task.priority}
                    </span>
                    {task.due_time && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" /> {task.due_time}
                      </span>
                    )}
                  </div>
                  <p className={`font-medium text-foreground mt-1 ${task.completed ? 'line-through' : ''}`}>
                    {task.title}
                  </p>
                  {task.notes && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{task.notes}</p>
                  )}
                  {task.ai_suggestion && (
                    <div className="mt-2 flex items-start gap-1.5 text-xs text-primary bg-primary/5 rounded-lg p-2 border border-primary/10">
                      <Sparkles className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{task.ai_suggestion}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeTask(task.id)}
                  className="shrink-0 p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
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
}
