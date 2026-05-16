-- 1. Remove the parameter_order_id column as it is no longer needed
ALTER TABLE public.parameters DROP COLUMN IF EXISTS parameter_order_id;

-- 2. Reset and re-calculate all parameter codes to start from P001
-- We'll use a temporary sequence to ensure a clean sequential order
DO $$
DECLARE
    r RECORD;
    counter INTEGER := 1;
BEGIN
    -- Clear all existing codes first to avoid unique constraint violations during update
    UPDATE public.parameters SET parameter_code = NULL;
    
    -- Re-assign codes based on created_at or parameter_name
    FOR r IN (SELECT id FROM public.parameters ORDER BY created_at ASC, parameter_name ASC) LOOP
        UPDATE public.parameters 
        SET parameter_code = 'P' || LPAD(counter::TEXT, 3, '0')
        WHERE id = r.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- 3. Ensure the generator function is robust
CREATE OR REPLACE FUNCTION generate_next_parameter_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
BEGIN
  -- Find the maximum current number and add 1
  SELECT COALESCE(MAX(SUBSTRING(parameter_code FROM 2)::INTEGER), 0) + 1
  INTO next_val
  FROM public.parameters
  WHERE parameter_code ~ '^P\d+$';

  RETURN 'P' || LPAD(next_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
