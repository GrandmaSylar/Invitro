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

-- ── Migration 003: Auto-generated lab number sequence ──────
-- Creates a daily sequence table and a function that returns a unique lab
-- number in the format "A020520260001", "A020520260002", etc.

CREATE TABLE IF NOT EXISTS daily_sequences (
    seq_date DATE PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE daily_sequences ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION generate_lab_number()
RETURNS TEXT AS $$
DECLARE
    today_date DATE := CURRENT_DATE;
    today_str TEXT := TO_CHAR(today_date, 'DDMMYYYY');
    seq_val INTEGER;
BEGIN
    INSERT INTO daily_sequences (seq_date, last_value)
    VALUES (today_date, 1)
    ON CONFLICT (seq_date)
    DO UPDATE SET last_value = daily_sequences.last_value + 1
    RETURNING last_value INTO seq_val;

    RETURN 'A' || today_str || LPAD(seq_val::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
