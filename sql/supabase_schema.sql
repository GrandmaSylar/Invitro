-- ============================================================
-- Bloo LIMS — Supabase (PostgreSQL) Schema
-- Converted from MSSQL schema for Supabase deployment
-- Run this in Supabase SQL Editor to create all tables
-- ============================================================

-- ── 1. ROLES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id              TEXT        NOT NULL PRIMARY KEY,
    name            TEXT        NOT NULL UNIQUE,
    label           TEXT        NOT NULL,
    description     TEXT,
    is_system       BOOLEAN     NOT NULL DEFAULT FALSE,
    permissions     JSONB       NOT NULL DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. USERS ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                   TEXT        NOT NULL PRIMARY KEY,
    full_name            TEXT        NOT NULL,
    email                TEXT        NOT NULL UNIQUE,
    username             TEXT        NOT NULL UNIQUE,
    password_hash        TEXT        NOT NULL,
    phone                TEXT,
    role_id              TEXT        NOT NULL REFERENCES roles(id),
    permission_overrides JSONB       NOT NULL DEFAULT '{}',
    two_factor_enabled   BOOLEAN     NOT NULL DEFAULT FALSE,
    two_factor_method    TEXT,
    status               TEXT        NOT NULL DEFAULT 'active',
    last_login           TEXT,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 3. AUDIT LOG ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_events (
    id              TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    actor_id        TEXT        NOT NULL,
    actor_name      TEXT        NOT NULL,
    action          TEXT        NOT NULL,
    target_type     TEXT        NOT NULL,
    target_id       TEXT        NOT NULL,
    target_name     TEXT        NOT NULL,
    detail          TEXT        NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS ix_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS ix_audit_events_actor_id  ON audit_events(actor_id);
CREATE INDEX IF NOT EXISTS ix_audit_events_action    ON audit_events(action);

-- ── 4. APP SETTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
    id              INTEGER     NOT NULL PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    general         JSONB       NOT NULL DEFAULT '{}',
    notifications   JSONB       NOT NULL DEFAULT '{}',
    security        JSONB       NOT NULL DEFAULT '{}',
    smtp            JSONB       NOT NULL DEFAULT '{}',
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. API KEYS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS api_keys (
    id              TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name            TEXT        NOT NULL,
    key             TEXT        NOT NULL UNIQUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used       TIMESTAMPTZ,
    permissions     JSONB       NOT NULL DEFAULT '[]'
);

-- ── 6. HOSPITALS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
    id              TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    hospital_name   TEXT        NOT NULL,
    location        TEXT,
    phone_number    TEXT,
    address         TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 7. DOCTORS ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctors (
    id                    TEXT    NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    doctor_name           TEXT    NOT NULL,
    speciality            TEXT,
    phone_number          TEXT,
    email                 TEXT,
    affiliate_hospital_id TEXT    REFERENCES hospitals(id),
    location              TEXT,
    address               TEXT,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 8. TEST PARAMETERS ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS parameters (
    id                TEXT    NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    parameter_name    TEXT    NOT NULL,
    units             TEXT,
    reference_range   TEXT,
    parameter_order_id INTEGER,
    trimester_type    TEXT,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 9. TESTS (TEST CATALOG) ────────────────────────────────
CREATE TABLE IF NOT EXISTS tests (
    id                    TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    test_name             TEXT        NOT NULL,
    department            TEXT        NOT NULL,
    test_cost             NUMERIC(12,4) NOT NULL DEFAULT 0,
    result_header         TEXT,
    reference_range       TEXT,
    include_comprehensive BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_tests_department ON tests(department);

-- ── 10. TEST ↔ PARAMETER LINK ──────────────────────────────
CREATE TABLE IF NOT EXISTS test_parameters (
    test_id       TEXT    NOT NULL REFERENCES tests(id),
    parameter_id  TEXT    NOT NULL REFERENCES parameters(id),
    sort_order    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (test_id, parameter_id)
);

-- ── 11. ANTIBIOTICS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS antibiotics (
    id              TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    antibiotic_name TEXT        NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 12. PATIENTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patients (
    id              TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    patient_name    TEXT        NOT NULL,
    gender          TEXT,
    age             INTEGER,
    telephone       TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 13. LAB RECORDS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_records (
    id                   TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    lab_number           TEXT        NOT NULL UNIQUE,
    patient_id           TEXT        NOT NULL REFERENCES patients(id),
    record_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status               TEXT        NOT NULL DEFAULT 'active',
    referral_option      TEXT,
    referral_doctor_id   TEXT        REFERENCES doctors(id),
    referral_hospital_id TEXT        REFERENCES hospitals(id),
    subtotal             NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_cost           NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid          NUMERIC(12,2) NOT NULL DEFAULT 0,
    arrears              NUMERIC(12,2) NOT NULL DEFAULT 0,
    created_by_id        TEXT        REFERENCES users(id),
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_lab_records_lab_number ON lab_records(lab_number);
CREATE INDEX IF NOT EXISTS ix_lab_records_patient_id ON lab_records(patient_id);
CREATE INDEX IF NOT EXISTS ix_lab_records_date       ON lab_records(record_date DESC);

-- ── 14. LAB RECORD TESTS ───────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_record_tests (
    id              TEXT          NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    lab_record_id   TEXT          NOT NULL REFERENCES lab_records(id) ON DELETE CASCADE,
    test_id         TEXT          NOT NULL REFERENCES tests(id),
    test_name       TEXT          NOT NULL,
    department      TEXT          NOT NULL,
    test_cost       NUMERIC(12,4) NOT NULL DEFAULT 0,
    total_cost      NUMERIC(12,4) NOT NULL DEFAULT 0,
    amount_paid     NUMERIC(12,4) NOT NULL DEFAULT 0,
    arrears         NUMERIC(12,4) NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ix_lab_record_tests_lab_record_id ON lab_record_tests(lab_record_id);

-- ── 15. TEST RESULTS ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_results (
    id                TEXT        NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    lab_record_test_id TEXT       NOT NULL REFERENCES lab_record_tests(id) ON DELETE CASCADE,
    test_name         TEXT        NOT NULL,
    department        TEXT        NOT NULL,
    reference_range   TEXT,
    unit              TEXT,
    result            TEXT,
    flag              TEXT        NOT NULL DEFAULT 'Normal',
    entered_by_id     TEXT        REFERENCES users(id),
    entered_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_test_results_lab_record_test_id ON test_results(lab_record_test_id);

-- ============================================================
-- SEED DATA: Default system roles
-- ============================================================
INSERT INTO roles (id, name, label, description, is_system, permissions) VALUES
('developer', 'developer', 'Developer', 'Full system access for development', TRUE,
 '{"system.settings":true,"system.users":true,"system.roles":true,"system.audit":true,"system.backup":true,"system.api_keys":true,"patients.view":true,"patients.create":true,"patients.edit":true,"patients.delete":true,"results.view":true,"results.create":true,"results.edit":true,"results.approve":true,"catalog.view":true,"catalog.manage":true,"registry.view":true,"registry.manage":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, label, description, is_system, permissions) VALUES
('admin', 'admin', 'Administrator', 'Administrative access', TRUE,
 '{"system.settings":true,"system.users":true,"system.roles":true,"system.audit":true,"system.backup":true,"patients.view":true,"patients.create":true,"patients.edit":true,"results.view":true,"results.create":true,"results.edit":true,"results.approve":true,"catalog.view":true,"catalog.manage":true,"registry.view":true,"registry.manage":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, label, description, is_system, permissions) VALUES
('lab_technician', 'lab_technician', 'Lab Technician', 'Standard laboratory staff', TRUE,
 '{"patients.view":true,"patients.create":true,"patients.edit":true,"results.view":true,"results.create":true,"results.edit":true,"catalog.view":true,"registry.view":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (id, name, label, description, is_system, permissions) VALUES
('viewer', 'viewer', 'Viewer', 'Read-only access', TRUE,
 '{"patients.view":true,"results.view":true,"catalog.view":true,"registry.view":true}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED DATA: Default app settings
-- ============================================================
INSERT INTO app_settings (id, general, notifications, security, smtp) VALUES
(1,
 '{"appName":"Bloo LIMS","theme":"system","language":"en","timezone":"UTC","dateFormat":"YYYY-MM-DD","timeFormat":"HH:mm"}'::jsonb,
 '{"emailEnabled":false,"smsEnabled":false,"inAppEnabled":true}'::jsonb,
 '{"sessionTimeoutMinutes":30,"passwordMinLength":6,"twoFactorGlobal":false,"maxLoginAttempts":5,"ipWhitelist":[]}'::jsonb,
 '{"host":"","port":587,"username":"","fromEmail":"","useTLS":true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Enable on all tables
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_parameters ENABLE ROW LEVEL SECURITY;
ALTER TABLE antibiotics ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_record_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Permissive policies: allow authenticated users full access
-- (tighten these per-table as needed for production)
CREATE POLICY "Allow authenticated read" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON roles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON roles FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON users FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Allow authenticated update" ON users FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON audit_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated insert" ON audit_events FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated read" ON app_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated update" ON app_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated read" ON api_keys FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON api_keys FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated all" ON hospitals FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON doctors FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON parameters FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON tests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON test_parameters FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON antibiotics FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON patients FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON lab_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON lab_record_tests FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated all" ON test_results FOR ALL TO authenticated USING (true);

-- Allow anon access to roles and users for login flow (read-only)
CREATE POLICY "Allow anon read roles" ON roles FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anon read users" ON users FOR SELECT TO anon USING (true);
