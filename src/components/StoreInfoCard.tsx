import { Info, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import StoreDetailsSheet from '@/components/StoreDetailsSheet';

interface StoreInfoCardProps {
  logoSrc: string;
  storeName: string;
}

const StoreInfoCard = ({ logoSrc, storeName }: StoreInfoCardProps) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: storeName,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado!');
      }
    } catch {
      // user cancelled share
    }
  };

  return (
    <>
      <div className="max-w-lg mx-auto px-4 -mt-12 relative z-10">
        <div className="bg-card rounded-2xl shadow-lg p-4 pt-0">
          <div className="flex items-start justify-between -mt-8">
            <button onClick={() => setDetailsOpen(true)} className="p-2 text-primary mt-10">
              <Info className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center -mt-8">
              <img
                src={logoSrc}
                alt={storeName}
                className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-md"
              />
              <h1 className="font-display text-2xl text-foreground mt-2 tracking-wide">{storeName}</h1>
              <span className="text-xs font-semibold text-green-500 bg-green-500/10 px-3 py-0.5 rounded-full mt-1">
                Loja aberta
              </span>
            </div>
            <button onClick={handleShare} className="p-2 text-primary mt-10">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 mt-4">
            <div className="flex-1 bg-muted rounded-xl py-2 px-3 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block">Mínimo</span>
              <span className="text-sm font-bold text-foreground">R$ 10,00</span>
            </div>
            <div className="flex-1 bg-muted rounded-xl py-2 px-3 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block">Abre às</span>
              <span className="text-sm font-bold text-foreground">18:00</span>
            </div>
            <div className="flex-1 bg-muted rounded-xl py-2 px-3 text-center">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide block">Entrega</span>
              <span className="text-sm font-bold text-foreground">30-50min</span>
            </div>
          </div>
        </div>
      </div>

      <StoreDetailsSheet open={detailsOpen} onOpenChange={setDetailsOpen} />
    </>
  );
};

export default StoreInfoCard;
