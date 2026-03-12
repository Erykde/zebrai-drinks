import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, Truck, AlertCircle, Loader2 } from 'lucide-react';

const Entrega = () => {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'ready' | 'delivered' | 'error' | 'already'>('loading');
  const [order, setOrder] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Link inválido');
      return;
    }
    // Fetch order info
    fetch(`${supabaseUrl}/functions/v1/motoboy-deliver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: anonKey },
      body: JSON.stringify({ token, action: 'get' }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setStatus('error');
          setErrorMsg(data.error);
        } else {
          setOrder(data.order);
          if (data.order.status === 'delivered') {
            setStatus('already');
          } else {
            setStatus('ready');
          }
        }
      })
      .catch(() => {
        setStatus('error');
        setErrorMsg('Erro ao carregar pedido');
      });
  }, [token]);

  const handleDeliver = async () => {
    setConfirming(true);
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/motoboy-deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus('delivered');
      } else {
        setErrorMsg(data.error || 'Erro ao confirmar');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Erro de conexão');
      setStatus('error');
    }
    setConfirming(false);
  };

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? '';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {status === 'loading' && (
          <div className="text-center space-y-3">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Carregando pedido...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-6 text-center space-y-3">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-destructive font-medium">{errorMsg}</p>
          </div>
        )}

        {status === 'already' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center space-y-3">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-green-500 font-display text-xl">ENTREGUE ✅</p>
            <p className="text-muted-foreground text-sm">Este pedido já foi marcado como entregue.</p>
          </div>
        )}

        {status === 'ready' && order && (
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="text-center">
              <Truck className="h-10 w-10 text-primary mx-auto mb-2" />
              <h1 className="font-display text-xl text-foreground">ENTREGA</h1>
              <p className="text-muted-foreground text-sm">Confirme quando entregar ao cliente</p>
            </div>

            <div className="space-y-2 bg-background/50 rounded-lg p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cliente</span>
                <span className="text-foreground font-medium">{order.customer_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="text-primary font-display">{fmt(order.total)}</span>
              </div>
              {order.delivery_fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Entrega</span>
                  <span className="text-muted-foreground">{fmt(order.delivery_fee)}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleDeliver}
              disabled={confirming}
              className="w-full bg-green-600 text-white py-4 rounded-xl text-lg font-display hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {confirming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle className="h-5 w-5" />
              )}
              CONFIRMAR ENTREGA
            </button>
          </div>
        )}

        {status === 'delivered' && (
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6 text-center space-y-3">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <p className="text-green-500 font-display text-2xl">ENTREGUE! ✅</p>
            <p className="text-muted-foreground">O pedido foi marcado como entregue com sucesso.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Entrega;
