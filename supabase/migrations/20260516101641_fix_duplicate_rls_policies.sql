-- ====================================================================
-- Migration: Fix Duplicate RLS Policies for Catalog Tables
-- Description: The previous migration created both a FOR SELECT and
-- a FOR ALL policy on each table. FOR ALL already covers SELECT,
-- so the duplicate SELECT policy causes "Cannot coerce to single
-- JSON object" errors with PostgREST .single() calls.
-- Fix: Drop the redundant SELECT-only policies.
-- ====================================================================

DROP POLICY IF EXISTS "Allow read access to authenticated users" ON tests;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON parameters;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON test_parameters;
