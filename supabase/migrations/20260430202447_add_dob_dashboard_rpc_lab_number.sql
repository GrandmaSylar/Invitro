-- ── Migration: Add DOB column, Dashboard RPC, and Lab Number Sequence ──

-- 1. Add DOB column to patients
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;

-- 2. Dashboard stats RPC function
-- Returns the count of lab_record_tests that have no results yet.
CREATE OR REPLACE FUNCTION count_pending_results()
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM lab_record_tests lrt
  WHERE NOT EXISTS (
    SELECT 1 FROM test_results tr
    WHERE tr.lab_record_test_id = lrt.id
  );
$$ LANGUAGE SQL SECURITY DEFINER;

-- 3. Auto-generated lab number sequence
-- Creates a sequence and a function that returns a unique lab
-- number in the format "LAB-00001", "LAB-00002", etc.

CREATE SEQUENCE IF NOT EXISTS lab_number_seq START 1;

CREATE OR REPLACE FUNCTION generate_lab_number()
RETURNS TEXT AS $$
  SELECT 'LAB-' || LPAD(nextval('lab_number_seq')::TEXT, 5, '0');
$$ LANGUAGE SQL SECURITY DEFINER;
