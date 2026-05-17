-- Add test_code column and auto-generation function to the tests table
-- This mirrors the parameter_code system (P001, P002...) but for tests (T001, T002...)

-- 1. Add the column
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS test_code TEXT;

-- 2. Create a unique index on test_code
CREATE UNIQUE INDEX IF NOT EXISTS tests_test_code_unique ON public.tests (test_code) WHERE test_code IS NOT NULL;

-- 3. Create the function to generate the next test code
CREATE OR REPLACE FUNCTION public.generate_next_test_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  max_num INTEGER;
  next_code TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(test_code FROM 2) AS INTEGER)), 0)
  INTO max_num
  FROM public.tests
  WHERE test_code ~ '^T[0-9]+$';

  next_code := 'T' || LPAD((max_num + 1)::TEXT, 3, '0');
  RETURN next_code;
END;
$$;

-- 4. Grant execute permission
GRANT EXECUTE ON FUNCTION public.generate_next_test_code() TO anon, authenticated;

-- 5. Backfill existing tests with codes
DO $$
DECLARE
  r RECORD;
  counter INTEGER := 1;
BEGIN
  FOR r IN SELECT id FROM public.tests WHERE test_code IS NULL ORDER BY created_at ASC
  LOOP
    UPDATE public.tests SET test_code = 'T' || LPAD(counter::TEXT, 3, '0') WHERE id = r.id;
    counter := counter + 1;
  END LOOP;
END;
$$;
