-- ====================================================================
-- Migration: Add RLS Policies for Catalog Tables
-- Description: Ensures authenticated users can read tests, parameters, 
-- and their link table, preventing the empty array issue in the UI.
-- ====================================================================

-- 1. Ensure RLS is enabled
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_parameters ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON tests;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON parameters;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON test_parameters;

-- 3. Create SELECT policies for authenticated users
CREATE POLICY "Allow read access to authenticated users" 
ON tests FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow read access to authenticated users" 
ON parameters FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow read access to authenticated users" 
ON test_parameters FOR SELECT 
TO authenticated 
USING (true);

-- 4. Create INSERT, UPDATE, DELETE policies for authenticated users
-- (So you can manage them from the UI)
CREATE POLICY "Allow write access to authenticated users" 
ON tests FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow write access to authenticated users" 
ON parameters FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow write access to authenticated users" 
ON test_parameters FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
