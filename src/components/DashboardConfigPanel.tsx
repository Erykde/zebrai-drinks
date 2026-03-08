import { useState } from 'react';
import { Settings, Eye, EyeOff, GripVertical, Save, X, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface DashboardSection {
  id: string;
  label: string;
  visible: boolean;
  order: number;
}

export interface DashboardConfig {
  sections: DashboardSection[];
  labels: Record<string, string>;
}

const DEFAULT_SECTIONS: DashboardSection[] = [
  { id: 'kpis', label: 'KPIs Principais', visible: true, order: 0 },
  { id: 'motoboy', label: 'Taxa do Motoboy', visible: true, order: 1 },
  { id: 'profit', label: 'Lucro Detalhado', visible: true, order: 2 },
  { id: 'growth', label: 'Crescimento', visible: true, order: 3 },
  { id: 'tracked-stock', label: 'Estoque Monitorado', visible: true, order: 4 },
  { id: 'low-stock', label: 'Alerta de Estoque Baixo', visible: true, order: 5 },
  { id: 'top-products', label: 'Top Produtos', visible: true, order: 6 },
  { id: 'delivery', label: 'Regiões de Entrega', visible: true, order: 7 },
  { id: 'recent-sales', label: 'Últimas Vendas', visible: true, order: 8 },
];

const DEFAULT_LABELS: Record<string, string> = {
  'kpi-sales-today': 'Vendas Hoje',
  'kpi-sales-month': 'Vendas no Mês',
  'kpi-profit': 'Lucro Real (Mês)',
  'kpi-ticket': 'Ticket Médio',
  'motoboy-title': 'Taxa do Motoboy',
  'profit-today': 'Lucro Hoje',
  'profit-month': 'Lucro no Mês',
  'profit-margin': 'Margem de Lucro',
  'growth-title': 'Crescimento',
  'tracked-stock-title': 'Estoque Monitorado',
  'low-stock-title': 'Alerta de Estoque Baixo',
  'top-products-title': 'Top 10 Produtos Mais Vendidos',
  'delivery-title': 'Regiões de Entrega',
  'recent-sales-title': 'Últimas Vendas',
};

const STORAGE_KEY = 'zebrai-dashboard-config';
const CUSTOM_SECTIONS_KEY = 'zebrai-custom-sections';

export interface CustomSection {
  id: string;
  title: string;
  content: string;
}

export const loadCustomSections = (): CustomSection[] => {
  try {
    const saved = localStorage.getItem(CUSTOM_SECTIONS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

export const saveCustomSections = (sections: CustomSection[]) => {
  localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(sections));
};

export const loadDashboardConfig = (): DashboardConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as DashboardConfig;
      const existingIds = new Set(parsed.sections.map(s => s.id));
      const merged = [...parsed.sections];
      DEFAULT_SECTIONS.forEach(ds => {
        if (!existingIds.has(ds.id)) merged.push(ds);
      });
      return { sections: merged, labels: { ...DEFAULT_LABELS, ...parsed.labels } };
    }
  } catch {}
  return { sections: [...DEFAULT_SECTIONS], labels: { ...DEFAULT_LABELS } };
};

export const saveDashboardConfig = (config: DashboardConfig) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
};

export const getLabel = (config: DashboardConfig, key: string): string => {
  return config.labels[key] ?? DEFAULT_LABELS[key] ?? key;
};

interface Props {
  config: DashboardConfig;
  onChange: (config: DashboardConfig) => void;
  onClose: () => void;
}

const DashboardConfigPanel = ({ config, onChange, onClose }: Props) => {
  const [draft, setDraft] = useState<DashboardConfig>(JSON.parse(JSON.stringify(config)));
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [customSections, setCustomSections] = useState<CustomSection[]>(loadCustomSections);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const sortedSections = [...draft.sections].sort((a, b) => a.order - b.order);

  const toggleVisibility = (id: string) => {
    setDraft(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s),
    }));
  };

  const updateLabel = (key: string, value: string) => {
    setDraft(prev => ({ ...prev, labels: { ...prev.labels, [key]: value } }));
  };

  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === targetIndex) return;
    const sorted = [...draft.sections].sort((a, b) => a.order - b.order);
    const [moved] = sorted.splice(dragIndex, 1);
    sorted.splice(targetIndex, 0, moved);
    const reordered = sorted.map((s, i) => ({ ...s, order: i }));
    setDraft(prev => ({ ...prev, sections: reordered }));
    setDragIndex(targetIndex);
  };

  const addCustomSection = () => {
    if (!newTitle.trim()) { toast.error('Informe um título para a seção'); return; }
    const id = `custom-${Date.now()}`;
    const newCustom: CustomSection = { id, title: newTitle.trim(), content: newContent.trim() };
    const updatedCustom = [...customSections, newCustom];
    setCustomSections(updatedCustom);
    saveCustomSections(updatedCustom);

    const newSection: DashboardSection = {
      id,
      label: newTitle.trim(),
      visible: true,
      order: draft.sections.length,
    };
    setDraft(prev => ({ ...prev, sections: [...prev.sections, newSection] }));
    setNewTitle('');
    setNewContent('');
    toast.success('Seção criada!');
  };

  const removeCustomSection = (id: string) => {
    const updatedCustom = customSections.filter(s => s.id !== id);
    setCustomSections(updatedCustom);
    saveCustomSections(updatedCustom);
    setDraft(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id),
    }));
    toast.success('Seção removida!');
  };

  const updateCustomContent = (id: string, field: 'title' | 'content', value: string) => {
    const updated = customSections.map(s => s.id === id ? { ...s, [field]: value } : s);
    setCustomSections(updated);
    saveCustomSections(updated);
    if (field === 'title') {
      setDraft(prev => ({
        ...prev,
        sections: prev.sections.map(s => s.id === id ? { ...s, label: value } : s),
      }));
    }
  };

  const handleSave = () => {
    saveDashboardConfig(draft);
    onChange(draft);
    toast.success('Dashboard atualizado!');
    onClose();
  };

  const handleReset = () => {
    const defaults = { sections: [...DEFAULT_SECTIONS], labels: { ...DEFAULT_LABELS } };
    setDraft(defaults);
    saveDashboardConfig(defaults);
    saveCustomSections([]);
    setCustomSections([]);
    onChange(defaults);
    toast.success('Dashboard restaurado ao padrão!');
  };

  const labelEntries = Object.entries(draft.labels);

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" /> Personalizar Dashboard
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Section visibility & order */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Seções (arraste para reordenar)</p>
          <div className="space-y-2">
            {sortedSections.map((section, i) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={() => setDragIndex(null)}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-move ${
                  dragIndex === i ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm text-card-foreground">{section.label}</span>
                {section.id.startsWith('custom-') && (
                  <button onClick={() => removeCustomSection(section.id)} className="p-1 text-destructive hover:bg-destructive/10 rounded" title="Remover seção">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <button
                  onClick={() => toggleVisibility(section.id)}
                  className="p-1 rounded hover:bg-muted transition-colors"
                >
                  {section.visible
                    ? <Eye className="h-4 w-4 text-primary" />
                    : <EyeOff className="h-4 w-4 text-muted-foreground" />
                  }
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add new custom section */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Adicionar Nova Seção
          </p>
          <div className="space-y-2 rounded-lg border border-dashed border-primary/30 p-3">
            <Input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Título da seção"
              className="h-8 text-sm"
            />
            <textarea
              value={newContent}
              onChange={e => setNewContent(e.target.value)}
              placeholder="Conteúdo / anotações (opcional)"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px] resize-y"
            />
            <Button size="sm" onClick={addCustomSection} className="w-full">
              <Plus className="h-4 w-4 mr-1" /> Criar Seção
            </Button>
          </div>
        </div>

        {/* Edit custom sections content */}
        {customSections.length > 0 && (
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Editar Seções Personalizadas</p>
            <div className="space-y-3">
              {customSections.map(cs => (
                <div key={cs.id} className="rounded-lg border border-border p-3 space-y-2">
                  <Input
                    value={cs.title}
                    onChange={e => updateCustomContent(cs.id, 'title', e.target.value)}
                    className="h-8 text-sm font-medium"
                  />
                  <textarea
                    value={cs.content}
                    onChange={e => updateCustomContent(cs.id, 'content', e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[50px] resize-y"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Label editing */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Textos e Títulos</p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {labelEntries.map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-32 shrink-0 truncate" title={key}>
                  {key.replace(/-/g, ' ')}
                </span>
                <Input
                  value={value}
                  onChange={e => updateLabel(key, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} className="flex-1">
            <Save className="h-4 w-4 mr-1" /> Salvar
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-1" /> Resetar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardConfigPanel;
