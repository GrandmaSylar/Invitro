import sql from 'mssql';
import { app } from 'electron';
import { join } from 'node:path';
import fs from 'node:fs';
import log from 'electron-log/main';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export interface DbConfig {
  server: string;
  port?: string | number;
  database: string;
  user: string;
  password?: string;
  encrypt?: boolean;
  trustServerCertificate?: boolean;
}

export interface DbStatus {
  status: 'Connected' | 'Disconnected' | 'Not Configured' | 'Checking';
  latency: number;
  strength: 'Excellent' | 'Good' | 'Moderate' | 'Poor' | 'None';
  server?: string;
  error?: string;
}

export interface TestConnectionResult {
  success: boolean;
  latency?: number;
  strength?: 'Excellent' | 'Good' | 'Moderate' | 'Poor';
  isInitialized?: boolean;
  error?: string;
}

let sqlPool: sql.ConnectionPool | null = null;
const CONFIG_FILENAME = 'db_config.json';

function getConfigFilePath(): string {
  try {
    const metaDir = app.getPath('userData');
    return join(metaDir, CONFIG_FILENAME);
  } catch (_err) {
    return join(process.cwd(), CONFIG_FILENAME);
  }
}

export function getDbConfig(): DbConfig | null {
  const configPath = getConfigFilePath();
  try {
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err: any) {
    log.error('Failed to read db_config.json:', err.message);
  }
  return null;
}

export function hasDbConfig(): boolean {
  return getDbConfig() !== null;
}

export async function saveDbConfig(config: DbConfig): Promise<boolean> {
  const configPath = getConfigFilePath();
  try {
    const dir = join(configPath, '..');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    
    // Close existing pool and connect to new configuration
    await closePool();
    await getPool(config);
    return true;
  } catch (err: any) {
    log.error('Failed to save db config:', err.message);
    if (fs.existsSync(configPath)) {
      try { fs.unlinkSync(configPath); } catch {}
    }
    throw err;
  }
}

export async function resetDbConfig(): Promise<boolean> {
  const configPath = getConfigFilePath();
  try {
    await closePool();
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }
    log.info('Database configuration reset and connection pool destroyed.');
    return true;
  } catch (err: any) {
    log.error('Failed to reset db config:', err.message);
    throw err;
  }
}

export async function closePool(): Promise<void> {
  if (sqlPool) {
    try {
      await sqlPool.close();
      log.info('MSSQL Connection pool closed successfully.');
    } catch (err: any) {
      log.error('Error closing MSSQL pool:', err.message);
    } finally {
      sqlPool = null;
    }
  }
}

export async function getPool(configOverride: DbConfig | null = null): Promise<sql.ConnectionPool> {
  const baseConfig = configOverride || getDbConfig();
  if (!baseConfig) {
    throw new Error('Database connection configuration not found. Setup required.');
  }

  let config = { ...baseConfig };
  if (!configOverride && isSandboxActive() && !config.database.endsWith('_sandbox')) {
    config.database = `${config.database}_sandbox`;
  }

  // If override provided and pool exists, close first
  if (configOverride && sqlPool) {
    await closePool();
  }

  // Active connection state check (replicates fees_tracker fail-safe)
  if (!sqlPool || !sqlPool.connected) {
    if (sqlPool) {
      try {
        await sqlPool.close();
      } catch (err: any) {
        log.warn('Error closing disconnected pool:', err.message);
      }
      sqlPool = null;
    }

    const mssqlConfig: sql.config = {
      server: config.server,
      port: config.port ? parseInt(String(config.port), 10) : 1433,
      database: config.database,
      user: config.user,
      password: config.password || '',
      options: {
        encrypt: config.encrypt !== false,
        trustServerCertificate: config.trustServerCertificate !== false,
        enableArithAbort: true,
        connectTimeout: 60000, // 60s timeout for high latency / remote links
        requestTimeout: 120000 // 120s timeout for heavy clinical reports / queries
      },
      pool: {
        max: 15,
        min: 0,
        idleTimeoutMillis: 30000
      }
    };

    log.info(`Connecting to MSSQL Server: ${config.server}:${config.port || 1433}, DB: ${config.database}...`);
    sqlPool = await sql.connect(mssqlConfig);
    log.info('MSSQL Connection pool established.');
  }

  return sqlPool;
}

export async function testConnection(config: DbConfig): Promise<TestConnectionResult> {
  let tempPool: sql.ConnectionPool | null = null;
  try {
    const mssqlConfig: sql.config = {
      server: config.server,
      port: config.port ? parseInt(String(config.port), 10) : 1433,
      database: config.database,
      user: config.user,
      password: config.password || '',
      options: {
        encrypt: config.encrypt !== false,
        trustServerCertificate: config.trustServerCertificate !== false,
        connectTimeout: 30000
      }
    };

    const start = Date.now();
    tempPool = await sql.connect(mssqlConfig);
    
    // Benchmark latency and schema presence
    const queryStart = Date.now();
    const result = await tempPool.request().query(`
      SELECT 1 AS [test], 
      (SELECT COUNT(*) FROM sysobjects WHERE name IN ('patients', 'lab_records', 'users', 'roles', 'tests')) AS [schema_check]
    `);
    const latency = Date.now() - queryStart;

    let strength: 'Excellent' | 'Good' | 'Moderate' | 'Poor' = 'Poor';
    if (latency < 100) strength = 'Excellent';
    else if (latency < 300) strength = 'Good';
    else if (latency < 800) strength = 'Moderate';

    const tablesCount = result.recordset[0]?.schema_check || 0;
    const isInitialized = tablesCount >= 3;

    return {
      success: true,
      latency,
      strength,
      isInitialized
    };
  } catch (err: any) {
    log.error('testConnection failed:', err.message);
    return {
      success: false,
      error: err.message
    };
  } finally {
    if (tempPool) {
      try {
        await tempPool.close();
      } catch {}
    }
  }
}

export async function getStatus(): Promise<DbStatus> {
  const config = getDbConfig();
  if (!config) {
    return {
      status: 'Not Configured',
      latency: 0,
      strength: 'None'
    };
  }

  try {
    const pool = await getPool();
    const queryStart = Date.now();
    await pool.request().query('SELECT 1 AS [ping]');
    const latency = Date.now() - queryStart;

    let strength: 'Excellent' | 'Good' | 'Moderate' | 'Poor' = 'Poor';
    if (latency < 100) strength = 'Excellent';
    else if (latency < 300) strength = 'Good';
    else if (latency < 800) strength = 'Moderate';

    return {
      status: 'Connected',
      latency,
      strength,
      server: `${config.server}:${config.port || 1433}`
    };
  } catch (err: any) {
    return {
      status: 'Disconnected',
      latency: 0,
      strength: 'None',
      error: err.message
    };
  }
}

export async function initMssqlDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    const pool = await getPool();
    const request = pool.request();

    log.info('Running MSSQL schema initialization and seed queries...');

    await request.query(`
      -- 1. ROLES
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='roles' AND xtype='U')
      BEGIN
        CREATE TABLE roles (
          id VARCHAR(100) PRIMARY KEY,
          name NVARCHAR(100) NOT NULL UNIQUE,
          label NVARCHAR(150) NOT NULL,
          description NVARCHAR(MAX),
          is_system BIT NOT NULL DEFAULT 0,
          permissions NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 2. USERS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      BEGIN
        CREATE TABLE users (
          id VARCHAR(100) PRIMARY KEY,
          full_name NVARCHAR(200) NOT NULL,
          email NVARCHAR(200) NOT NULL UNIQUE,
          username NVARCHAR(100) NOT NULL UNIQUE,
          password_hash NVARCHAR(255) NOT NULL,
          phone NVARCHAR(50),
          role_id VARCHAR(100) NOT NULL,
          permission_overrides NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          theme_preset NVARCHAR(50) NOT NULL DEFAULT 'default',
          two_factor_enabled BIT NOT NULL DEFAULT 0,
          two_factor_method NVARCHAR(50),
          status NVARCHAR(50) NOT NULL DEFAULT 'active',
          last_login NVARCHAR(100),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_users_roles FOREIGN KEY (role_id) REFERENCES roles(id)
        );
      END;

      -- 3. AUDIT EVENTS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='audit_events' AND xtype='U')
      BEGIN
        CREATE TABLE audit_events (
          id VARCHAR(100) PRIMARY KEY,
          timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
          actor_id VARCHAR(100) NOT NULL,
          actor_name NVARCHAR(200) NOT NULL,
          action NVARCHAR(100) NOT NULL,
          target_type NVARCHAR(100) NOT NULL,
          target_id VARCHAR(100) NOT NULL,
          target_name NVARCHAR(200) NOT NULL,
          detail NVARCHAR(MAX) NOT NULL DEFAULT ''
        );
        CREATE INDEX IX_audit_events_timestamp ON audit_events(timestamp DESC);
      END;

      -- 4. APP SETTINGS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='app_settings' AND xtype='U')
      BEGIN
        CREATE TABLE app_settings (
          id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
          general NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          notifications NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          security NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          smtp NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          receipt NVARCHAR(MAX) NOT NULL DEFAULT '{}',
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 5. API KEYS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='api_keys' AND xtype='U')
      BEGIN
        CREATE TABLE api_keys (
          id VARCHAR(100) PRIMARY KEY,
          name NVARCHAR(150) NOT NULL,
          [key] NVARCHAR(255) NOT NULL UNIQUE,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          last_used DATETIME2,
          permissions NVARCHAR(MAX) NOT NULL DEFAULT '[]',
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 6. HOSPITALS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='hospitals' AND xtype='U')
      BEGIN
        CREATE TABLE hospitals (
          id VARCHAR(100) PRIMARY KEY,
          hospital_name NVARCHAR(200) NOT NULL,
          location NVARCHAR(200),
          phone_number NVARCHAR(50),
          address NVARCHAR(MAX),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 7. DOCTORS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='doctors' AND xtype='U')
      BEGIN
        CREATE TABLE doctors (
          id VARCHAR(100) PRIMARY KEY,
          doctor_name NVARCHAR(200) NOT NULL,
          speciality NVARCHAR(150),
          phone_number NVARCHAR(50),
          email NVARCHAR(200),
          affiliate_hospital_id VARCHAR(100),
          location NVARCHAR(200),
          address NVARCHAR(MAX),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_doctors_hospital FOREIGN KEY (affiliate_hospital_id) REFERENCES hospitals(id)
        );
      END;

      -- 8. PARAMETERS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='parameters' AND xtype='U')
      BEGIN
        CREATE TABLE parameters (
          id VARCHAR(100) PRIMARY KEY,
          parameter_name NVARCHAR(200) NOT NULL,
          units NVARCHAR(50),
          reference_range NVARCHAR(200),
          parameter_order_id INT,
          trimester_type NVARCHAR(50),
          is_active BIT NOT NULL DEFAULT 1,
          parameter_code NVARCHAR(50),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 9. TESTS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tests' AND xtype='U')
      BEGIN
        CREATE TABLE tests (
          id VARCHAR(100) PRIMARY KEY,
          test_name NVARCHAR(200) NOT NULL,
          department NVARCHAR(100) NOT NULL,
          test_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
          result_header NVARCHAR(200),
          reference_range NVARCHAR(200),
          include_comprehensive BIT NOT NULL DEFAULT 0,
          is_active BIT NOT NULL DEFAULT 1,
          test_code NVARCHAR(50),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
        CREATE INDEX IX_tests_department ON tests(department);
      END;

      -- 10. TEST PARAMETERS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_parameters' AND xtype='U')
      BEGIN
        CREATE TABLE test_parameters (
          test_id VARCHAR(100) NOT NULL,
          parameter_id VARCHAR(100) NOT NULL,
          sort_order INT NOT NULL DEFAULT 0,
          CONSTRAINT PK_test_parameters PRIMARY KEY (test_id, parameter_id),
          CONSTRAINT FK_tp_test FOREIGN KEY (test_id) REFERENCES tests(id),
          CONSTRAINT FK_tp_parameter FOREIGN KEY (parameter_id) REFERENCES parameters(id)
        );
      END;

      -- 11. ANTIBIOTICS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='antibiotics' AND xtype='U')
      BEGIN
        CREATE TABLE antibiotics (
          id VARCHAR(100) PRIMARY KEY,
          antibiotic_name NVARCHAR(200) NOT NULL,
          is_active BIT NOT NULL DEFAULT 1,
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 12. PATIENTS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='patients' AND xtype='U')
      BEGIN
        CREATE TABLE patients (
          id VARCHAR(100) PRIMARY KEY,
          patient_name NVARCHAR(200) NOT NULL,
          gender NVARCHAR(50),
          dob NVARCHAR(50),
          age INT,
          telephone NVARCHAR(50),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE()
        );
      END;

      -- 13. LAB RECORDS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='lab_records' AND xtype='U')
      BEGIN
        CREATE TABLE lab_records (
          id VARCHAR(100) PRIMARY KEY,
          lab_number NVARCHAR(50) NOT NULL UNIQUE,
          patient_id VARCHAR(100) NOT NULL,
          record_date DATETIME2 NOT NULL DEFAULT GETDATE(),
          status NVARCHAR(50) NOT NULL DEFAULT 'active',
          referral_option NVARCHAR(50),
          referral_doctor_id VARCHAR(100),
          referral_hospital_id VARCHAR(100),
          subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
          total_cost DECIMAL(18,2) NOT NULL DEFAULT 0,
          amount_paid DECIMAL(18,2) NOT NULL DEFAULT 0,
          arrears DECIMAL(18,2) NOT NULL DEFAULT 0,
          created_by_id VARCHAR(100),
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          updated_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_lab_rec_patient FOREIGN KEY (patient_id) REFERENCES patients(id),
          CONSTRAINT FK_lab_rec_doctor FOREIGN KEY (referral_doctor_id) REFERENCES doctors(id),
          CONSTRAINT FK_lab_rec_hospital FOREIGN KEY (referral_hospital_id) REFERENCES hospitals(id)
        );
        CREATE INDEX IX_lab_records_lab_number ON lab_records(lab_number);
        CREATE INDEX IX_lab_records_patient_id ON lab_records(patient_id);
      END;

      -- 14. LAB RECORD TESTS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='lab_record_tests' AND xtype='U')
      BEGIN
        CREATE TABLE lab_record_tests (
          id VARCHAR(100) PRIMARY KEY,
          lab_record_id VARCHAR(100) NOT NULL,
          test_id VARCHAR(100) NOT NULL,
          test_name NVARCHAR(200) NOT NULL,
          department NVARCHAR(100) NOT NULL,
          test_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
          total_cost DECIMAL(18,4) NOT NULL DEFAULT 0,
          amount_paid DECIMAL(18,4) NOT NULL DEFAULT 0,
          arrears DECIMAL(18,4) NOT NULL DEFAULT 0,
          CONSTRAINT FK_lrt_record FOREIGN KEY (lab_record_id) REFERENCES lab_records(id) ON DELETE CASCADE,
          CONSTRAINT FK_lrt_test FOREIGN KEY (test_id) REFERENCES tests(id)
        );
        CREATE INDEX IX_lrt_record_id ON lab_record_tests(lab_record_id);
      END;

      -- 15. TEST RESULTS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='test_results' AND xtype='U')
      BEGIN
        CREATE TABLE test_results (
          id VARCHAR(100) PRIMARY KEY,
          lab_record_test_id VARCHAR(100) NOT NULL,
          test_name NVARCHAR(200) NOT NULL,
          department NVARCHAR(100) NOT NULL,
          reference_range NVARCHAR(200),
          unit NVARCHAR(50),
          result NVARCHAR(MAX),
          flag NVARCHAR(50) NOT NULL DEFAULT 'Normal',
          entered_by_id VARCHAR(100),
          entered_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_tr_record_test FOREIGN KEY (lab_record_test_id) REFERENCES lab_record_tests(id) ON DELETE CASCADE
        );
        CREATE INDEX IX_tr_record_test_id ON test_results(lab_record_test_id);
      END;

      -- 16. PAYMENTS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='payments' AND xtype='U')
      BEGIN
        CREATE TABLE payments (
          id VARCHAR(100) PRIMARY KEY,
          lab_record_id VARCHAR(100) NOT NULL,
          amount DECIMAL(18,4) NOT NULL DEFAULT 0,
          payment_date DATETIME2 NOT NULL DEFAULT GETDATE(),
          received_by_id VARCHAR(100),
          CONSTRAINT FK_pay_record FOREIGN KEY (lab_record_id) REFERENCES lab_records(id) ON DELETE CASCADE
        );
        CREATE INDEX IX_pay_record_id ON payments(lab_record_id);
      END;

      -- 17. NOTIFICATIONS
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='notifications' AND xtype='U')
      BEGIN
        CREATE TABLE notifications (
          id VARCHAR(100) PRIMARY KEY,
          user_id VARCHAR(100) NOT NULL,
          title NVARCHAR(200) NOT NULL,
          message NVARCHAR(MAX) NOT NULL,
          is_read BIT NOT NULL DEFAULT 0,
          type NVARCHAR(50) NOT NULL DEFAULT 'info',
          created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
          CONSTRAINT FK_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IX_notif_user_id ON notifications(user_id);
      END;

      -- ── Performance & Speed Optimization Non-Clustered Indexes ──
      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_patients_phone' AND object_id = OBJECT_ID('patients'))
        CREATE INDEX IX_patients_phone ON patients(telephone);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_patients_name' AND object_id = OBJECT_ID('patients'))
        CREATE INDEX IX_patients_name ON patients(patient_name);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_patients_created_at' AND object_id = OBJECT_ID('patients'))
        CREATE INDEX IX_patients_created_at ON patients(created_at DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_lab_records_record_date' AND object_id = OBJECT_ID('lab_records'))
        CREATE INDEX IX_lab_records_record_date ON lab_records(record_date DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_lab_records_status' AND object_id = OBJECT_ID('lab_records'))
        CREATE INDEX IX_lab_records_status ON lab_records(status);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_lab_records_created_at' AND object_id = OBJECT_ID('lab_records'))
        CREATE INDEX IX_lab_records_created_at ON lab_records(created_at DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_lrt_test_id' AND object_id = OBJECT_ID('lab_record_tests'))
        CREATE INDEX IX_lrt_test_id ON lab_record_tests(test_id);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_tr_entered_at' AND object_id = OBJECT_ID('test_results'))
        CREATE INDEX IX_tr_entered_at ON test_results(entered_at DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_audit_logs_timestamp' AND object_id = OBJECT_ID('audit_logs'))
        CREATE INDEX IX_audit_logs_timestamp ON audit_logs(timestamp DESC);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_audit_logs_action' AND object_id = OBJECT_ID('audit_logs'))
        CREATE INDEX IX_audit_logs_action ON audit_logs(action);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_users_username' AND object_id = OBJECT_ID('users'))
        CREATE INDEX IX_users_username ON users(username);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_users_email' AND object_id = OBJECT_ID('users'))
        CREATE INDEX IX_users_email ON users(email);

      IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name='IX_tests_name' AND object_id = OBJECT_ID('tests'))
        CREATE INDEX IX_tests_name ON tests(test_name);
    `);

    // Seed default roles if missing
    await request.query(`
      IF NOT EXISTS (SELECT * FROM roles WHERE id='developer')
      BEGIN
        INSERT INTO roles (id, name, label, description, is_system, permissions)
        VALUES ('developer', 'developer', 'Developer', 'Full system access for development', 1,
        '{"system.settings":true,"system.users":true,"system.roles":true,"system.audit":true,"system.backup":true,"system.api_keys":true,"patients.view":true,"patients.create":true,"patients.edit":true,"patients.delete":true,"results.view":true,"results.create":true,"results.edit":true,"results.approve":true,"catalog.view":true,"catalog.manage":true,"registry.view":true,"registry.manage":true}');
      END;

      IF NOT EXISTS (SELECT * FROM roles WHERE id='admin')
      BEGIN
        INSERT INTO roles (id, name, label, description, is_system, permissions)
        VALUES ('admin', 'admin', 'Administrator', 'Administrative access', 1,
        '{"system.settings":true,"system.users":true,"system.roles":true,"system.audit":true,"system.backup":true,"patients.view":true,"patients.create":true,"patients.edit":true,"results.view":true,"results.create":true,"results.edit":true,"results.approve":true,"catalog.view":true,"catalog.manage":true,"registry.view":true,"registry.manage":true}');
      END;

      IF NOT EXISTS (SELECT * FROM roles WHERE id='lab_technician')
      BEGIN
        INSERT INTO roles (id, name, label, description, is_system, permissions)
        VALUES ('lab_technician', 'lab_technician', 'Lab Technician', 'Standard laboratory staff', 1,
        '{"patients.view":true,"patients.create":true,"patients.edit":true,"results.view":true,"results.create":true,"results.edit":true,"catalog.view":true,"registry.view":true}');
      END;

      IF NOT EXISTS (SELECT * FROM roles WHERE id='viewer')
      BEGIN
        INSERT INTO roles (id, name, label, description, is_system, permissions)
        VALUES ('viewer', 'viewer', 'Viewer', 'Read-only access', 1,
        '{"patients.view":true,"results.view":true,"catalog.view":true,"registry.view":true}');
      END;

      -- Default App Settings
      IF NOT EXISTS (SELECT * FROM app_settings WHERE id = 1)
      BEGIN
        INSERT INTO app_settings (id, general, notifications, security, smtp, receipt)
        VALUES (
          1,
          '{"appName":"Invitro LIMS","theme":"system","language":"en","timezone":"UTC","dateFormat":"YYYY-MM-DD","timeFormat":"HH:mm"}',
          '{"emailEnabled":false,"smsEnabled":false,"inAppEnabled":true}',
          '{"sessionTimeoutMinutes":30,"passwordMinLength":6,"twoFactorGlobal":false,"maxLoginAttempts":5,"ipWhitelist":[]}',
          '{"host":"","port":587,"username":"","fromEmail":"","useTLS":true}',
          '{"paperSize":"A4","scale":1.0,"showLogo":true,"showWatermark":false,"footerText":"This is an official receipt. Please retain for your records."}'
        );
      END;
    `);

    // Seed default administrator if no users exist
    const userCheck = await request.query('SELECT COUNT(*) AS [count] FROM users');
    if ((userCheck.recordset[0]?.count || 0) === 0) {
      log.info('Seeding default administrator account...');
      const adminPassHash = await bcrypt.hash('admin123', 10);
      const adminReq = pool.request();
      adminReq.input('id', sql.VarChar(100), crypto.randomUUID());
      adminReq.input('full_name', sql.NVarChar(200), 'System Administrator');
      adminReq.input('email', sql.NVarChar(200), 'admin@invitro.local');
      adminReq.input('username', sql.NVarChar(100), 'admin');
      adminReq.input('pass_hash', sql.NVarChar(255), adminPassHash);
      adminReq.input('role_id', sql.VarChar(100), 'admin');
      await adminReq.query(`
        INSERT INTO users (id, full_name, email, username, password_hash, role_id, status)
        VALUES (@id, @full_name, @email, @username, @pass_hash, @role_id, 'active');
      `);
      log.info('Default administrator seeded successfully.');
    }

    log.info('MSSQL schema initialization & indexing completed successfully.');
    return { success: true };
  } catch (err: any) {
    log.error('Failed to initialize MSSQL schema:', err.message);
    return { success: false, error: err.message };
  }
}

// ── Dev/Test/Training Grounds (Sandbox Mode) Management ────────
function getSandboxFilePath(): string {
  try {
    const metaDir = app.getPath('userData');
    return join(metaDir, 'sandbox_mode.json');
  } catch (_err) {
    return join(process.cwd(), 'sandbox_mode.json');
  }
}

export function isSandboxActive(): boolean {
  try {
    const p = getSandboxFilePath();
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf8');
      const data = JSON.parse(raw);
      return !!data.enabled;
    }
  } catch {}
  return false;
}

export function setSandboxActive(enabled: boolean): void {
  try {
    const p = getSandboxFilePath();
    fs.writeFileSync(p, JSON.stringify({ enabled }), 'utf8');
  } catch (err: any) {
    log.error('Failed to save sandbox active state:', err.message);
  }
}

export function getActiveDbName(): string {
  const config = getDbConfig();
  const baseDb = config?.database || 'invitro';
  return isSandboxActive() ? `${baseDb}_sandbox` : baseDb;
}

export async function toggleSandboxMode(enabled: boolean): Promise<{ success: boolean; active: boolean; dbName: string }> {
  setSandboxActive(enabled);
  const config = getDbConfig();
  if (!config) throw new Error('Database connection not configured.');

  const targetDb = enabled 
    ? (config.database.endsWith('_sandbox') ? config.database : `${config.database}_sandbox`) 
    : config.database.replace(/_sandbox$/, '');

  log.info(`Switching Database Environment -> ${enabled ? 'SANDBOX / TRAINING GROUNDS' : 'LIVE PRODUCTION'} (${targetDb})`);
  await closePool();

  if (enabled) {
    // Connect to server default database to check / create sandbox DB
    const rootConfig = { ...config, database: 'master' };
    const rootPool = await getPool(rootConfig);
    const checkReq = rootPool.request();
    await checkReq.query(`
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${targetDb}')
      BEGIN
        CREATE DATABASE [${targetDb}];
      END
    `);
    await closePool();

    // Connect to the sandbox DB and initialize schema & indexing
    const sandboxConfig = { ...config, database: targetDb };
    await getPool(sandboxConfig);
    await initMssqlDatabase();
    await seedPresetDataIfEmpty();
  } else {
    // Switch back to live production DB
    await getPool({ ...config, database: targetDb });
  }

  return { success: true, active: enabled, dbName: targetDb };
}

export async function resetSandboxDatabase(): Promise<{ success: boolean; message: string }> {
  if (!isSandboxActive()) {
    throw new Error("Cannot reset sandbox database while in Live Production Mode.");
  }

  const pool = await getPool();
  log.info("Resetting Sandbox Database data...");

  const req = pool.request();
  await req.query(`
    DELETE FROM test_results;
    DELETE FROM lab_record_tests;
    DELETE FROM payments;
    DELETE FROM lab_records;
    DELETE FROM patients;
    DELETE FROM notifications;
    DELETE FROM audit_logs;
  `);

  await seedPresetDataIfEmpty(true);
  log.info("Sandbox database reset cleanly.");
  return { success: true, message: "Sandbox database wiped and reset with clean preset data." };
}

export async function seedPresetDataIfEmpty(forceReSeed = false): Promise<void> {
  try {
    const pool = await getPool();
    const countCheck = await pool.request().query('SELECT COUNT(*) AS [count] FROM tests');
    const existingCount = Number(countCheck.recordset[0]?.count || 0);

    if (existingCount > 0 && !forceReSeed) {
      return;
    }

    const possibleExcelPaths = [
      join(process.cwd(), 'Lab_Tests_and_Parameters_v2.xlsx'),
      join(app.getAppPath(), 'Lab_Tests_and_Parameters_v2.xlsx'),
    ];
    let excelPath = '';
    for (const p of possibleExcelPaths) {
      if (fs.existsSync(p)) {
        excelPath = p;
        break;
      }
    }

    if (!excelPath) {
      log.warn('Lab_Tests_and_Parameters_v2.xlsx not found for auto-seeding.');
      return;
    }

    log.info(`Seeding tests & parameters from '${excelPath}'...`);
    const XLSX = (await import('xlsx')).default || (await import('xlsx'));
    const workbook = XLSX.readFile(excelPath);
    const testsRaw = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Tests']);
    const paramsRaw = XLSX.utils.sheet_to_json<any>(workbook.Sheets['Parameters']);

    const validTestIds = new Set<string>();

    for (const row of testsRaw) {
      const testId = String(row['Test ID'] || '').trim();
      const department = String(row['Department'] || 'GENERAL').trim().toUpperCase();
      const testName = String(row['Test Name'] || '').trim();
      const cost = Number(row['Cost (GH₵)'] || 0);

      if (!testId || !testName) continue;
      validTestIds.add(testId);

      const req = pool.request();
      req.input('id', sql.VarChar(100), testId);
      req.input('name', sql.NVarChar(200), testName);
      req.input('dept', sql.NVarChar(100), department);
      req.input('cost', sql.Decimal(18, 4), cost);
      req.input('code', sql.NVarChar(50), testId);

      await req.query(`
        IF EXISTS (SELECT 1 FROM tests WHERE id = @id)
        BEGIN
          UPDATE tests SET test_name = @name, department = @dept, test_cost = @cost, test_code = @code, is_active = 1, updated_at = GETDATE() WHERE id = @id;
        END
        ELSE
        BEGIN
          INSERT INTO tests (id, test_name, department, test_cost, is_active, test_code, created_at, updated_at) VALUES (@id, @name, @dept, @cost, 1, @code, GETDATE(), GETDATE());
        END
      `);
    }

    for (const row of paramsRaw) {
      const testId = String(row['Test ID'] || '').trim();
      if (testId && !validTestIds.has(testId)) {
        validTestIds.add(testId);
        const reqOrphan = pool.request();
        reqOrphan.input('id', sql.VarChar(100), testId);
        reqOrphan.input('name', sql.NVarChar(200), `MISCELLANEOUS TEST (${testId})`);
        reqOrphan.input('dept', sql.NVarChar(100), 'MISCELLANEOUS');
        reqOrphan.input('cost', sql.Decimal(18, 4), 0);
        reqOrphan.input('code', sql.NVarChar(50), testId);

        await reqOrphan.query(`
          IF NOT EXISTS (SELECT 1 FROM tests WHERE id = @id)
          BEGIN
            INSERT INTO tests (id, test_name, department, test_cost, is_active, test_code, created_at, updated_at) VALUES (@id, @name, @dept, @cost, 1, @code, GETDATE(), GETDATE());
          END
        `);
      }
    }

    const testOrderMap = new Map<string, number>();

    for (const row of paramsRaw) {
      const paramCode = String(row['Param ID'] || '').trim();
      const testId = String(row['Test ID'] || '').trim();
      const paramName = String(row['Parameter Name'] || '').trim();
      const units = row['Units'] ? String(row['Units']).trim() : null;
      const refRange = row['Reference Range'] ? String(row['Reference Range']).trim() : null;

      if (!testId || !paramName) continue;

      const parameterId = `PARAM-${testId}-${paramCode || '0'}-${paramName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`;
      const currentOrder = (testOrderMap.get(testId) || 0) + 1;
      testOrderMap.set(testId, currentOrder);

      const reqParam = pool.request();
      reqParam.input('id', sql.VarChar(100), parameterId);
      reqParam.input('name', sql.NVarChar(200), paramName);
      reqParam.input('units', sql.NVarChar(50), units);
      reqParam.input('ref', sql.NVarChar(200), refRange);
      reqParam.input('code', sql.NVarChar(50), paramCode || null);

      await reqParam.query(`
        IF EXISTS (SELECT 1 FROM parameters WHERE id = @id)
        BEGIN
          UPDATE parameters SET parameter_name = @name, units = @units, reference_range = @ref, parameter_code = @code, is_active = 1, updated_at = GETDATE() WHERE id = @id;
        END
        ELSE
        BEGIN
          INSERT INTO parameters (id, parameter_name, units, reference_range, is_active, parameter_code, created_at, updated_at) VALUES (@id, @name, @units, @ref, 1, @code, GETDATE(), GETDATE());
        END
      `);

      const reqMap = pool.request();
      reqMap.input('tid', sql.VarChar(100), testId);
      reqMap.input('pid', sql.VarChar(100), parameterId);
      reqMap.input('order', sql.Int, currentOrder);

      await reqMap.query(`
        IF EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @tid AND parameter_id = @pid)
        BEGIN
          UPDATE test_parameters SET sort_order = @order WHERE test_id = @tid AND parameter_id = @pid;
        END
        ELSE
        BEGIN
          INSERT INTO test_parameters (test_id, parameter_id, sort_order) VALUES (@tid, @pid, @order);
        END
      `);
    }

    log.info('Auto-seeding of preset tests and parameters completed.');
  } catch (err: any) {
    log.error('Error auto-seeding preset data:', err.message);
  }
}

