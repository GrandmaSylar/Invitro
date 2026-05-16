-- Add parameter_code column
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS parameter_code TEXT UNIQUE;

-- Function to generate the next parameter code
CREATE OR REPLACE FUNCTION generate_next_parameter_code()
RETURNS TEXT AS $$
DECLARE
  next_val INTEGER;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(parameter_code FROM 2)::INTEGER), 0) + 1
  INTO next_val
  FROM parameters
  WHERE parameter_code ~ '^P\d+$';

  RETURN 'P' || LPAD(next_val::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for UI preview
CREATE OR REPLACE FUNCTION preview_parameter_code()
RETURNS TEXT AS $$
BEGIN
  RETURN generate_next_parameter_code();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function
CREATE OR REPLACE FUNCTION tr_fn_generate_parameter_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parameter_code IS NULL THEN
    NEW.parameter_code := generate_next_parameter_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
DROP TRIGGER IF EXISTS tr_generate_parameter_code ON parameters;
CREATE TRIGGER tr_generate_parameter_code
BEFORE INSERT ON parameters
FOR EACH ROW
EXECUTE FUNCTION tr_fn_generate_parameter_code();

-- Initial backfill for any existing null codes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM parameters WHERE parameter_code IS NULL ORDER BY created_at ASC LOOP
    UPDATE parameters SET parameter_code = generate_next_parameter_code() WHERE id = r.id;
  END LOOP;
END $$;
