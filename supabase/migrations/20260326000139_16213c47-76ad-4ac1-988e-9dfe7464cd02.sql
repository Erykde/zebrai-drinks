
-- Cash register sessions (open/close)
CREATE TABLE public.cash_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  closing_balance NUMERIC(10,2),
  status TEXT NOT NULL DEFAULT 'open',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.cash_register ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cash_register"
  ON public.cash_register FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Cash transactions (entries/exits)
CREATE TABLE public.cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  register_id UUID NOT NULL REFERENCES public.cash_register(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'entry',
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'venda',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cash_transactions"
  ON public.cash_transactions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
