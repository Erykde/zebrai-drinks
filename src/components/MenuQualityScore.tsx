import { useMemo } from 'react';
import { DbProduct } from '@/hooks/useProducts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertCircle, ImageIcon, FileText, Tag } from 'lucide-react';

interface MenuQualityScoreProps {
  products: DbProduct[];
}

const MenuQualityScore = ({ products }: MenuQualityScoreProps) => {
  const stats = useMemo(() => {
    const total = products.length;
    if (total === 0) return { score: 0, withPhoto: 0, withDescription: 0, withPromotion: 0, total: 0 };

    const withPhoto = products.filter(p => !!p.image_url).length;
    const withDescription = products.filter(p => !!p.description && p.description.trim().length > 5).length;
    const withPromotion = products.filter(p => p.is_promotion).length;

    // Score: 50% fotos, 40% descrições, 10% promoções ativas
    const photoScore = (withPhoto / total) * 50;
    const descScore = (withDescription / total) * 40;
    const promoScore = Math.min(withPromotion / Math.max(total * 0.1, 1), 1) * 10;
    const score = Math.round(photoScore + descScore + promoScore);

    return { score, withPhoto, withDescription, withPromotion, total };
  }, [products]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-destructive';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excelente! 🎉';
    if (score >= 50) return 'Bom, mas pode melhorar';
    return 'Precisa de atenção ⚠️';
  };

  const items = [
    {
      icon: <ImageIcon className="h-4 w-4" />,
      label: 'Com foto',
      value: stats.withPhoto,
      total: stats.total,
      pct: stats.total > 0 ? Math.round((stats.withPhoto / stats.total) * 100) : 0,
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Com descrição',
      value: stats.withDescription,
      total: stats.total,
      pct: stats.total > 0 ? Math.round((stats.withDescription / stats.total) * 100) : 0,
    },
    {
      icon: <Tag className="h-4 w-4" />,
      label: 'Em promoção',
      value: stats.withPromotion,
      total: stats.total,
      pct: stats.total > 0 ? Math.round((stats.withPromotion / stats.total) * 100) : 0,
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {stats.score >= 80 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-yellow-500" />
          )}
          Qualidade do Cardápio
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className={`text-4xl font-bold ${getScoreColor(stats.score)}`}>
            {stats.score}%
          </div>
          <div className="flex-1">
            <Progress value={stats.score} className="h-3" />
            <p className="text-xs text-muted-foreground mt-1">{getScoreLabel(stats.score)}</p>
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-muted-foreground">{item.icon}</span>
              <span className="text-sm flex-1">{item.label}</span>
              <span className="text-sm font-medium">
                {item.value}/{item.total}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                item.pct >= 80 ? 'bg-green-500/10 text-green-500' :
                item.pct >= 50 ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-destructive/10 text-destructive'
              }`}>
                {item.pct}%
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MenuQualityScore;
