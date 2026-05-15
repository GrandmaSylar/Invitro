-- Grant privileges to authenticated and anon users
GRANT ALL ON TABLE public.payments TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_receipt_number() TO anon, authenticated, service_role;
