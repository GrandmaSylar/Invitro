-- ============================================================
-- Bloo LIMS — Microsoft SQL Server Schema
-- Generated from frontend data models
-- Run this against your target database to create all tables
-- ============================================================

-- ── 1. ROLES ────────────────────────────────────────────────
-- Source: src/lib/types.ts → Role interface
-- Used by: RBAC system, user management
CREATE TABLE roles (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    name            NVARCHAR(64)    NOT NULL UNIQUE,
    label           NVARCHAR(128)   NOT NULL,
    description     NVARCHAR(MAX)   NULL,
    isSystem        BIT             NOT NULL DEFAULT 0,
    permissions     NVARCHAR(MAX)   NOT NULL DEFAULT '{}',   -- JSON object: { "key": true/false }
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- ── 2. USERS ────────────────────────────────────────────────
-- Source: src/lib/types.ts → User interface
-- Password is stored as bcrypt hash only, never plaintext
CREATE TABLE users (
    id                  NVARCHAR(64)    NOT NULL PRIMARY KEY,
    fullName            NVARCHAR(128)   NOT NULL,
    email               NVARCHAR(256)   NOT NULL UNIQUE,
    username            NVARCHAR(64)    NOT NULL UNIQUE,
    passwordHash        NVARCHAR(256)   NOT NULL,             -- bcrypt hash (never plaintext)
    phone               NVARCHAR(32)    NULL,
    roleId              NVARCHAR(64)    NOT NULL,
    permissionOverrides NVARCHAR(MAX)   NOT NULL DEFAULT '{}', -- JSON: per-user overrides
    twoFactorEnabled    BIT             NOT NULL DEFAULT 0,
    twoFactorMethod     NVARCHAR(16)    NULL,                  -- 'totp' | 'sms' | 'email'
    status              NVARCHAR(16)    NOT NULL DEFAULT 'active', -- 'active' | 'inactive' | 'suspended'
    lastLogin           NVARCHAR(64)    NULL,
    createdAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_users_roleId FOREIGN KEY (roleId) REFERENCES roles(id)
);

-- ── 3. AUDIT LOG ────────────────────────────────────────────
-- Source: src/lib/types.ts → AuditEvent interface
-- Immutable append-only log of all system actions
CREATE TABLE audit_events (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    timestamp       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    actorId         NVARCHAR(64)    NOT NULL,
    actorName       NVARCHAR(128)   NOT NULL,
    action          NVARCHAR(128)   NOT NULL,
    targetType      NVARCHAR(64)    NOT NULL,
    targetId        NVARCHAR(64)    NOT NULL,
    targetName      NVARCHAR(256)   NOT NULL,
    detail          NVARCHAR(MAX)   NOT NULL DEFAULT ''
);

CREATE INDEX IX_audit_events_timestamp ON audit_events(timestamp DESC);
CREATE INDEX IX_audit_events_actorId   ON audit_events(actorId);
CREATE INDEX IX_audit_events_action    ON audit_events(action);

-- ── 4. APP SETTINGS ─────────────────────────────────────────
-- Source: src/lib/types.ts → AppSettings interface
-- Singleton row storing all app configuration as JSON sections
CREATE TABLE app_settings (
    id              INT             NOT NULL PRIMARY KEY DEFAULT 1,
    general         NVARCHAR(MAX)   NOT NULL DEFAULT '{}',
    notifications   NVARCHAR(MAX)   NOT NULL DEFAULT '{}',
    security        NVARCHAR(MAX)   NOT NULL DEFAULT '{}',
    smtp            NVARCHAR(MAX)   NOT NULL DEFAULT '{}',
    updatedAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT CK_app_settings_singleton CHECK (id = 1)
);

-- ── 5. API KEYS ─────────────────────────────────────────────
-- Source: src/lib/types.ts → ApiKey interface
CREATE TABLE api_keys (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    name            NVARCHAR(128)   NOT NULL,
    [key]           NVARCHAR(256)   NOT NULL UNIQUE,
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    lastUsed        DATETIME2       NULL,
    permissions     NVARCHAR(MAX)   NOT NULL DEFAULT '[]'    -- JSON array of permission strings
);

-- ── 6. HOSPITALS ────────────────────────────────────────────
-- Source: src/app/components/HospitalRecords.tsx → HospitalRecord
CREATE TABLE hospitals (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    hospitalName    NVARCHAR(256)   NOT NULL,
    location        NVARCHAR(256)   NULL,
    phoneNumber     NVARCHAR(32)    NULL,
    address         NVARCHAR(512)   NULL,
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- ── 7. DOCTORS ──────────────────────────────────────────────
-- Source: src/app/components/HospitalRecords.tsx → DoctorRecord
CREATE TABLE doctors (
    id                  NVARCHAR(64)    NOT NULL PRIMARY KEY,
    doctorName          NVARCHAR(256)   NOT NULL,
    speciality          NVARCHAR(128)   NULL,
    phoneNumber         NVARCHAR(32)    NULL,
    email               NVARCHAR(256)   NULL,
    affiliateHospitalId NVARCHAR(64)    NULL,
    location            NVARCHAR(256)   NULL,
    address             NVARCHAR(512)   NULL,
    createdAt           DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_doctors_hospital FOREIGN KEY (affiliateHospitalId) REFERENCES hospitals(id)
);

-- ── 8. TEST PARAMETERS ─────────────────────────────────────
-- Source: src/app/components/TestRegister.tsx → parameterData
-- Individual measurable parameters (e.g. AST, ALT, ALP)
CREATE TABLE parameters (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    parameterName   NVARCHAR(128)   NOT NULL,
    units           NVARCHAR(32)    NULL,
    referenceRange  NVARCHAR(64)    NULL,
    parameterOrderId INT            NULL,
    trimesterType   NVARCHAR(64)    NULL,
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- ── 9. TESTS (TEST CATALOG) ────────────────────────────────
-- Source: src/app/components/TestRegister.tsx → testNameData
--         src/app/components/DashboardAlpha.tsx → AvailableTest
CREATE TABLE tests (
    id                      NVARCHAR(64)    NOT NULL PRIMARY KEY,
    testName                NVARCHAR(256)   NOT NULL,
    department              NVARCHAR(128)   NOT NULL,
    testCost                DECIMAL(12,4)   NOT NULL DEFAULT 0,
    resultHeader            NVARCHAR(256)   NULL,
    referenceRange          NVARCHAR(64)    NULL,
    includeComprehensive    BIT             NOT NULL DEFAULT 0,
    createdAt               DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

CREATE INDEX IX_tests_department ON tests(department);

-- ── 10. TEST ↔ PARAMETER LINK ──────────────────────────────
-- Many-to-many: a test can have multiple parameters
CREATE TABLE test_parameters (
    testId          NVARCHAR(64)    NOT NULL,
    parameterId     NVARCHAR(64)    NOT NULL,
    sortOrder       INT             NOT NULL DEFAULT 0,

    PRIMARY KEY (testId, parameterId),
    CONSTRAINT FK_tp_test  FOREIGN KEY (testId)      REFERENCES tests(id),
    CONSTRAINT FK_tp_param FOREIGN KEY (parameterId)  REFERENCES parameters(id)
);

-- ── 11. ANTIBIOTICS ─────────────────────────────────────────
-- Source: src/app/components/TestRegister.tsx → AntibioticEntry
CREATE TABLE antibiotics (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    antibioticName  NVARCHAR(256)   NOT NULL,
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- ── 12. PATIENTS ────────────────────────────────────────────
-- Source: src/app/components/DashboardAlpha.tsx → new-patient form
CREATE TABLE patients (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    patientName     NVARCHAR(256)   NOT NULL,
    gender          NVARCHAR(16)    NULL,       -- 'Male' | 'Female' | 'Other'
    age             INT             NULL,
    telephone       NVARCHAR(32)    NULL,
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE()
);

-- ── 13. LAB RECORDS ─────────────────────────────────────────
-- Source: src/app/components/DashboardAlpha.tsx → lab number / patient record
-- Each lab record is a single visit/registration for a patient
CREATE TABLE lab_records (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    labNumber       NVARCHAR(64)    NOT NULL UNIQUE,
    patientId       NVARCHAR(64)    NOT NULL,
    recordDate      DATETIME2       NOT NULL DEFAULT GETUTCDATE(),
    status          NVARCHAR(32)    NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'cancelled'
    referralOption  NVARCHAR(32)    NULL,       -- 'None' | 'Doctor' | 'Hospital' | 'Insurance'
    referralDoctorId  NVARCHAR(64)  NULL,
    referralHospitalId NVARCHAR(64) NULL,
    subtotal        DECIMAL(12,2)   NOT NULL DEFAULT 0,
    totalCost       DECIMAL(12,2)   NOT NULL DEFAULT 0,
    amountPaid      DECIMAL(12,2)   NOT NULL DEFAULT 0,
    arrears         DECIMAL(12,2)   NOT NULL DEFAULT 0,
    createdById     NVARCHAR(64)    NULL,
    createdAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_labrecords_patient  FOREIGN KEY (patientId)         REFERENCES patients(id),
    CONSTRAINT FK_labrecords_doctor   FOREIGN KEY (referralDoctorId)   REFERENCES doctors(id),
    CONSTRAINT FK_labrecords_hospital FOREIGN KEY (referralHospitalId) REFERENCES hospitals(id),
    CONSTRAINT FK_labrecords_user     FOREIGN KEY (createdById)        REFERENCES users(id)
);

CREATE INDEX IX_lab_records_labNumber  ON lab_records(labNumber);
CREATE INDEX IX_lab_records_patientId  ON lab_records(patientId);
CREATE INDEX IX_lab_records_date       ON lab_records(recordDate DESC);

-- ── 14. LAB RECORD TESTS (ordered tests per record) ────────
-- Source: src/app/components/DashboardAlpha.tsx → TestItem
-- Each row = one test ordered within a lab record
CREATE TABLE lab_record_tests (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    labRecordId     NVARCHAR(64)    NOT NULL,
    testId          NVARCHAR(64)    NOT NULL,
    testName        NVARCHAR(256)   NOT NULL,   -- denormalized for historical accuracy
    department      NVARCHAR(128)   NOT NULL,
    testCost        DECIMAL(12,4)   NOT NULL DEFAULT 0,
    totalCost       DECIMAL(12,4)   NOT NULL DEFAULT 0,
    amountPaid      DECIMAL(12,4)   NOT NULL DEFAULT 0,
    arrears         DECIMAL(12,4)   NOT NULL DEFAULT 0,

    CONSTRAINT FK_lrt_labrecord FOREIGN KEY (labRecordId) REFERENCES lab_records(id) ON DELETE CASCADE,
    CONSTRAINT FK_lrt_test      FOREIGN KEY (testId)      REFERENCES tests(id)
);

CREATE INDEX IX_lab_record_tests_labRecordId ON lab_record_tests(labRecordId);

-- ── 15. TEST RESULTS ────────────────────────────────────────
-- Source: src/app/components/ResultsEntry.tsx → ResultRow
-- Actual lab results entered per ordered test
CREATE TABLE test_results (
    id              NVARCHAR(64)    NOT NULL PRIMARY KEY,
    labRecordTestId NVARCHAR(64)    NOT NULL,
    testName        NVARCHAR(256)   NOT NULL,
    department      NVARCHAR(128)   NOT NULL,
    referenceRange  NVARCHAR(64)    NULL,
    unit            NVARCHAR(32)    NULL,
    result          NVARCHAR(128)   NULL,
    flag            NVARCHAR(16)    NOT NULL DEFAULT 'Normal', -- 'Normal' | 'High' | 'Low' | 'Critical'
    enteredById     NVARCHAR(64)    NULL,
    enteredAt       DATETIME2       NOT NULL DEFAULT GETUTCDATE(),

    CONSTRAINT FK_results_lrt  FOREIGN KEY (labRecordTestId) REFERENCES lab_record_tests(id) ON DELETE CASCADE,
    CONSTRAINT FK_results_user FOREIGN KEY (enteredById)     REFERENCES users(id)
);

CREATE INDEX IX_test_results_labRecordTestId ON test_results(labRecordTestId);

-- ============================================================
-- SEED DATA: Default system roles
-- ============================================================

INSERT INTO roles (id, name, label, description, isSystem, permissions) VALUES
('developer', 'developer', 'Developer', 'Full system access for development', 1,
 '{"system.settings":true,"system.users":true,"system.roles":true,"system.audit":true,"system.backup":true,"system.api_keys":true,"patients.view":true,"patients.create":true,"patients.edit":true,"patients.delete":true,"results.view":true,"results.create":true,"results.edit":true,"results.approve":true,"catalog.view":true,"catalog.manage":true,"registry.view":true,"registry.manage":true}');

INSERT INTO roles (id, name, label, description, isSystem, permissions) VALUES
('admin', 'admin', 'Administrator', 'Administrative access', 1,
 '{"system.settings":true,"system.users":true,"system.roles":true,"system.audit":true,"system.backup":true,"patients.view":true,"patients.create":true,"patients.edit":true,"results.view":true,"results.create":true,"results.edit":true,"results.approve":true,"catalog.view":true,"catalog.manage":true,"registry.view":true,"registry.manage":true}');

INSERT INTO roles (id, name, label, description, isSystem, permissions) VALUES
('lab_technician', 'lab_technician', 'Lab Technician', 'Standard laboratory staff', 1,
 '{"patients.view":true,"patients.create":true,"patients.edit":true,"results.view":true,"results.create":true,"results.edit":true,"catalog.view":true,"registry.view":true}');

INSERT INTO roles (id, name, label, description, isSystem, permissions) VALUES
('viewer', 'viewer', 'Viewer', 'Read-only access', 1,
 '{"patients.view":true,"results.view":true,"catalog.view":true,"registry.view":true}');

-- ============================================================
-- SEED DATA: Default app settings
-- ============================================================

INSERT INTO app_settings (id, general, notifications, security, smtp) VALUES
(1,
 '{"appName":"Bloo LIMS","theme":"system","language":"en","timezone":"UTC","dateFormat":"YYYY-MM-DD","timeFormat":"HH:mm"}',
 '{"emailEnabled":false,"smsEnabled":false,"inAppEnabled":true}',
 '{"sessionTimeoutMinutes":30,"passwordMinLength":6,"twoFactorGlobal":false,"maxLoginAttempts":5,"ipWhitelist":[]}',
 '{"host":"","port":587,"username":"","fromEmail":"","useTLS":true}'
);

-- ============================================================
-- DONE
-- ============================================================
PRINT 'Schema created successfully. All 15 tables + seed data ready.';
GO
