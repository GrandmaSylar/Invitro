-- ============================================================
-- Bloo LIMS — Prototype Seed Data Migration
-- Extracts hardcoded parameters and tests from fit prototype
-- ============================================================

-- 0. Ensure department column exists on tests
ALTER TABLE tests ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT '';

-- 1. Insert Parameters
INSERT INTO parameters (parameter_name, units, reference_range, parameter_order_id, trimester_type) VALUES
('AST', 'U/L', '0.0 - 38.0', 10, NULL),
('ALT', 'U/L', '0.0 - 40.0', 10, NULL),
('ALP', 'U/L', '<270', 10, NULL),
('ALBUMIN', 'g/L', '35.0 - 53.0', 10, NULL),
('TOTAL PROTEIN', 'g/L', '66.0 - 83.0', 10, NULL),
('TOTAL BILIRUBIN', 'umol/L', '3.4 - 20.0', 10, NULL),
('DIRECT BILIRUBIN', 'umol/L', '0.0 - 6.8', 10, NULL);

-- 2. Insert Tests
INSERT INTO tests (test_name, department, test_cost) VALUES
('24HR URINE CREATININE', 'BIOCHEMISTRY', 0.0000),
('24HR URINE PROTEIN', 'BIOCHEMISTRY', 50.0000),
('ANA (Anti-Nuclear Antibody)', 'IMMUNOSEROLOGY', 50.0000),
('ANF', 'IMMUNOSEROLOGY', 0.0000);

-- Note: To link these parameters to tests, you can use the UI in TestRegister.
-- Example: LFT (Liver Function Test) is missing from the tests above but 
-- could be linked to the parameters above once created.
