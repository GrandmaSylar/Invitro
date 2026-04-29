-- ============================================================
-- Bloo LIMS — Schema Migrations
-- Run these in Supabase SQL Editor after the initial schema
-- ============================================================

-- ── Migration 001: Add DOB column to patients ──────────────
ALTER TABLE patients ADD COLUMN IF NOT EXISTS dob DATE;

-- ── Migration 002: Dashboard stats RPC function ────────────
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
