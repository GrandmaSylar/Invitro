-- Add is_active column for soft deletes to catalog tables
ALTER TABLE tests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE parameters ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE antibiotics ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing rows to be active
UPDATE tests SET is_active = true WHERE is_active IS NULL;
UPDATE parameters SET is_active = true WHERE is_active IS NULL;
UPDATE departments SET is_active = true WHERE is_active IS NULL;
UPDATE antibiotics SET is_active = true WHERE is_active IS NULL;
