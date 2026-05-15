CREATE TABLE IF NOT EXISTS public.system_settings (
    id integer PRIMARY KEY DEFAULT 1,
    settings jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view settings
CREATE POLICY "Allow authenticated read system_settings" ON public.system_settings
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to update settings
CREATE POLICY "Allow authenticated update system_settings" ON public.system_settings
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Insert default row
INSERT INTO public.system_settings (id, settings) 
VALUES (1, '{}'::jsonb) 
ON CONFLICT (id) DO NOTHING;
