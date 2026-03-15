import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MapPin, Clock, CreditCard, Timer, ExternalLink } from 'lucide-react';

interface StoreDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoreDetailsSheet = ({ open, onOpenChange }: StoreDetailsSheetProps) => {
  const storeAddress = 'Rua Monte Sinai, 38 - Costeira, São José dos Pinhais - PR';
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storeAddress)}`;

  const sections = [
    {
      icon: Clock,
      title: 'Horário de Atendimento',
      content: (
        <div className="space-y-1">
          <p className="text-sm text-foreground">Segunda a Sábado: <span className="font-semibold">18:00 às 23:00</span></p>
          <p className="text-sm text-foreground">Domingo: <span className="font-semibold">18:00 às 22:00</span></p>
        </div>
      ),
    },
    {
      icon: Timer,
      title: 'Tempo de Preparo',
      content: (
        <p className="text-sm text-foreground">Tempo médio: <span className="font-semibold">10 a 20 minutos</span></p>
      ),
    },
    {
      icon: CreditCard,
      title: 'Formas de Pagamento',
      content: (
        <div className="flex flex-wrap gap-2">
          {['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'].map(method => (
            <span key={method} className="bg-muted text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
              {method}
            </span>
          ))}
        </div>
      ),
    },
    {
      icon: MapPin,
      title: 'Endereço',
      content: (
        <div>
          <p className="text-sm text-foreground mb-2">{storeAddress}</p>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
          >
            <ExternalLink className="h-4 w-4" />
            Ver no Google Maps
          </a>
        </div>
      ),
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-xl text-foreground">Detalhes da Loja</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 pb-6">
          {sections.map(({ icon: Icon, title, content }) => (
            <div key={title} className="flex gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm text-foreground mb-1">{title}</h3>
                {content}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoreDetailsSheet;
