import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MapPin, Clock, CreditCard, Timer, ExternalLink, Truck, Store } from 'lucide-react';
import { useSiteSettings } from '@/hooks/useSiteSettings';

interface StoreDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoreDetailsSheet = ({ open, onOpenChange }: StoreDetailsSheetProps) => {
  const { data: settings } = useSiteSettings();

  const address = settings?.store_address || 'Rua Monte Sinai, 38 - Costeira, São José dos Pinhais - PR';
  const hours = settings?.opening_hours || { weekdays: '18:00 às 23:00', weekend: '18:00 às 22:00' };
  const prepTime = settings?.prep_time || '10 a 20 minutos';
  const paymentMethods = settings?.payment_methods || ['PIX', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito'];
  const deliveryEnabled = settings?.delivery_enabled ?? true;
  const pickupEnabled = settings?.pickup_enabled ?? false;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="font-display text-xl text-foreground">Detalhes da Loja</SheetTitle>
        </SheetHeader>
        <div className="space-y-5 pb-6">
          {/* Hours */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">Horário de Atendimento</h3>
              <p className="text-sm text-foreground">Seg a Sáb: <span className="font-semibold">{hours.weekdays}</span></p>
              <p className="text-sm text-foreground">Domingo: <span className="font-semibold">{hours.weekend}</span></p>
            </div>
          </div>

          {/* Prep time */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Timer className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">Tempo de Preparo</h3>
              <p className="text-sm text-foreground">Tempo médio: <span className="font-semibold">{prepTime}</span></p>
            </div>
          </div>

          {/* Delivery/Pickup */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">Modalidade</h3>
              <div className="flex gap-2 flex-wrap">
                {deliveryEnabled && (
                  <span className="bg-muted text-foreground text-xs font-medium px-3 py-1.5 rounded-full">🛵 Entrega</span>
                )}
                {pickupEnabled && (
                  <span className="bg-muted text-foreground text-xs font-medium px-3 py-1.5 rounded-full">🏪 Retirada</span>
                )}
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">Formas de Pagamento</h3>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method: string) => (
                  <span key={method} className="bg-muted text-foreground text-xs font-medium px-3 py-1.5 rounded-full">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-sm text-foreground mb-1">Endereço</h3>
              <p className="text-sm text-foreground mb-2">{address}</p>
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default StoreDetailsSheet;
