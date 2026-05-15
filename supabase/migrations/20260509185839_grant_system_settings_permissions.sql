-- Grant privileges to authenticated and anon users
GRANT ALL ON TABLE public.system_settings TO anon, authenticated, service_role;
