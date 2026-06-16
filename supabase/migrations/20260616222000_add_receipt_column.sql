-- ============================================================
-- Migration: Add Receipt Configuration Column to App Settings
-- Date: 2026-06-16
-- ============================================================

ALTER TABLE app_settings ADD COLUMN IF NOT EXISTS receipt JSONB NOT NULL DEFAULT '{}';
