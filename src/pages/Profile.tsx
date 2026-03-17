import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Ticket, MapPin, LogOut, ChevronRight, Shield, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import zebraiLogo from '@/assets/zebrai-logo.jpg';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const Profile = () => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addressSheet, setAddressSheet] = useState(false);
  const [couponSheet, setCouponSheet] = useState(false);
  const [newAddress, setNewAddress] = useState({ label: 'Casa', address: '', complement: '' });

  // Fetch user addresses
  const { data: addresses = [] } = useQuery({
    queryKey: ['my-addresses', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch available coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['available-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('is_active', true);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addAddress = useMutation({
    mutationFn: async () => {
      if (!user || !newAddress.address.trim()) throw new Error('Preencha o endereço');
      const { error } = await supabase.from('customer_addresses').insert({
        user_id: user.id,
        label: newAddress.label || 'Casa',
        address: newAddress.address.trim(),
        complement: newAddress.complement.trim() || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      setNewAddress({ label: 'Casa', address: '', complement: '' });
      toast.success('Endereço salvo!');
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteAddress = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('customer_addresses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-addresses'] });
      toast.success('Endereço removido');
    },
  });

  const handleLogout = async () => {
    await signOut();
    toast.success('Você saiu da conta.');
    navigate('/');
  };

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Meu Perfil';

  return (
    <div className="min-h-screen bg-muted pb-20">
      {/* Profile header */}
      <div className="bg-card px-4 pt-10 pb-6 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 border-2 border-primary mx-auto flex items-center justify-center overflow-hidden">
          {user ? (
            <img src={zebraiLogo} alt="Perfil" className="w-full h-full object-cover" />
          ) : (
            <User className="h-10 w-10 text-primary" />
          )}
        </div>
        <h1 className="font-display text-2xl text-foreground mt-3">
          {user ? displayName : 'Meu Perfil'}
        </h1>
        {user && <p className="text-sm text-muted-foreground mt-1">{user.email}</p>}
        {!user && (
          <div className="flex gap-2 justify-center mt-3">
            <button
              onClick={() => navigate('/auth?mode=login')}
              className="bg-primary text-primary-foreground px-5 py-2 rounded-full font-semibold text-sm"
            >
              Entrar
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup')}
              className="bg-card text-primary border border-primary px-5 py-2 rounded-full font-semibold text-sm"
            >
              Cadastrar
            </button>
          </div>
        )}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-2">
        {/* Coupons */}
        {user && (
          <button
            onClick={() => setCouponSheet(true)}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 text-left hover:bg-card/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Ticket className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-foreground">Cupons</span>
              <p className="text-xs text-muted-foreground">{coupons.length} cupom(ns) disponível(is)</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Addresses */}
        {user && (
          <button
            onClick={() => setAddressSheet(true)}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 text-left hover:bg-card/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-foreground">Meus Endereços</span>
              <p className="text-xs text-muted-foreground">{addresses.length} endereço(s) salvo(s)</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        {/* Admin link - only for admins */}
        {user && isAdmin && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 text-left hover:bg-primary/5 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-sm text-primary">Painel Administrativo</span>
              <p className="text-xs text-muted-foreground">Gerenciar loja</p>
            </div>
            <ChevronRight className="h-4 w-4 text-primary" />
          </button>
        )}

        {/* Logout */}
        {user && (
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 bg-card rounded-xl p-4 text-left hover:bg-destructive/10 transition-colors mt-4"
          >
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <span className="font-semibold text-sm text-destructive">Sair da conta</span>
          </button>
        )}
      </div>

      {/* Addresses Sheet */}
      <Sheet open={addressSheet} onOpenChange={setAddressSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-display text-xl">Meus Endereços</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-6">
            {addresses.map((addr: any) => (
              <div key={addr.id} className="flex items-start gap-3 bg-muted rounded-xl p-3">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{addr.label}</p>
                  <p className="text-xs text-muted-foreground">{addr.address}</p>
                  {addr.complement && <p className="text-xs text-muted-foreground">{addr.complement}</p>}
                </div>
                <button onClick={() => deleteAddress.mutate(addr.id)} className="text-destructive p-1">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            <div className="border-t border-border pt-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">Adicionar endereço</p>
              <Input
                value={newAddress.label}
                onChange={e => setNewAddress(p => ({ ...p, label: e.target.value }))}
                placeholder="Ex: Casa, Trabalho"
                className="text-sm"
              />
              <Input
                value={newAddress.address}
                onChange={e => setNewAddress(p => ({ ...p, address: e.target.value }))}
                placeholder="Rua, número, bairro..."
                className="text-sm"
              />
              <Input
                value={newAddress.complement}
                onChange={e => setNewAddress(p => ({ ...p, complement: e.target.value }))}
                placeholder="Complemento (apto, bloco...)"
                className="text-sm"
              />
              <Button
                onClick={() => addAddress.mutate()}
                disabled={addAddress.isPending || !newAddress.address.trim()}
                className="w-full"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Salvar endereço
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Coupons Sheet */}
      <Sheet open={couponSheet} onOpenChange={setCouponSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <SheetTitle className="font-display text-xl">Cupons Disponíveis</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 pb-6">
            {coupons.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Nenhum cupom disponível no momento</p>
            ) : (
              coupons.map((c: any) => (
                <div key={c.id} className="bg-muted rounded-xl p-4 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Ticket className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground font-mono">{c.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.discount_type === 'percentage' ? `${c.discount_value}% de desconto` : `R$ ${Number(c.discount_value).toFixed(2)} de desconto`}
                    </p>
                    {c.min_order_value > 0 && (
                      <p className="text-xs text-muted-foreground">Pedido mínimo: R$ {Number(c.min_order_value).toFixed(2)}</p>
                    )}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(c.code); toast.success('Código copiado!'); }}
                    className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full"
                  >
                    Copiar
                  </button>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      <BottomNav />
    </div>
  );
};

export default Profile;
