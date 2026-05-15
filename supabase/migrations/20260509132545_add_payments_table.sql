CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    lab_record_id text REFERENCES public.lab_records(id) ON DELETE CASCADE NOT NULL,
    amount numeric(10, 2) NOT NULL,
    payment_date timestamp with time zone DEFAULT now() NOT NULL,
    received_by_id text REFERENCES public.users(id) ON DELETE SET NULL,
    receipt_number text UNIQUE NOT NULL
);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated full access to payments" ON public.payments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Generate receipt number function
CREATE OR REPLACE FUNCTION generate_receipt_number()
RETURNS TEXT AS $$
DECLARE
  next_seq INTEGER;
BEGIN
  SELECT COALESCE(MAX(RIGHT(receipt_number, 4)::INTEGER), 0) + 1
  INTO next_seq
  FROM payments
  WHERE receipt_number ~ '^RCPT-\d{8}-\d{4}$';

  RETURN 'RCPT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(next_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
