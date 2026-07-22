
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkout_id text UNIQUE,
  merchant_request_id text,
  amount numeric NOT NULL,
  phone text NOT NULL,
  purpose text NOT NULL DEFAULT 'activation',
  status text NOT NULL DEFAULT 'queued',
  mpesa_code text,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments select" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own payments insert" ON public.payments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX payments_user_id_idx ON public.payments(user_id);
CREATE INDEX payments_checkout_id_idx ON public.payments(checkout_id);
