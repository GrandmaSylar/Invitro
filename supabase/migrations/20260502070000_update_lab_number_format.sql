-- Migration: Update lab number sequence format
-- Creates a daily sequence table to handle sequence numbers that reset each day.

CREATE TABLE IF NOT EXISTS daily_sequences (
    seq_date DATE PRIMARY KEY,
    last_value INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS on daily_sequences just in case
ALTER TABLE daily_sequences ENABLE ROW LEVEL SECURITY;

-- Allow no-one but the system to select/update directly (or we can just keep it restricted)
-- The SECURITY DEFINER function will bypass RLS.

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
