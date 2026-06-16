import Database from 'better-sqlite3';
import { app, safeStorage } from 'electron';
import { join } from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import log from 'electron-log/main';
import bcrypt from 'bcryptjs';
import net from 'node:net';

import Database from 'better-sqlite3';
import { app, safeStorage } from 'electron';
import { join } from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import log from 'electron-log/main';
import bcrypt from 'bcryptjs';
import net from 'node:net';

let db: Database.Database;

const ALGORITHM = 'aes-256-gcm';
const KEY_FILENAME = 'db.key';
const DB_FILENAME = 'lims.db';

function getEncryptionKey(): Buffer {
  const metaDir = app.getPath('userData');
  const keyPath = join(metaDir, KEY_FILENAME);
  
  try {
    if (fs.existsSync(keyPath)) {
      const encrypted = fs.readFileSync(keyPath);
      if (safeStorage.isEncryptionAvailable()) {
        const decryptedStr = safeStorage.decryptString(encrypted);
        return Buffer.from(decryptedStr, 'hex');
      } else {
        return encrypted;
      }
    }
  } catch (err: any) {
    log.error('Failed to read or decrypt db.key:', err.message);
  }
  
  const newKey = crypto.randomBytes(32);
  try {
    const encrypted = safeStorage.isEncryptionAvailable()
      ? safeStorage.encryptString(newKey.toString('hex'))
      : newKey;
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    fs.writeFileSync(keyPath, encrypted);
  } catch (err: any) {
    log.error('Failed to write persistent db.key:', err.message);
  }
  return newKey;
}

export function decryptDatabase() {
  const dbDir = app.getPath('userData');
  const dbPath = app.isPackaged 
    ? join(dbDir, DB_FILENAME) 
    : join(process.cwd(), DB_FILENAME);
  const encPath = dbPath + '.enc';

  if (fs.existsSync(dbPath)) {
    log.warn('Plaintext database found on startup. Skipping decryption (recovering from crash/forced close).');
    return;
  }

  if (!fs.existsSync(encPath)) {
    log.info('No encrypted database file found, starting with clean db.');
    return;
  }

  try {
    log.info('Decrypting local SQLite database...');
    const key = getEncryptionKey();
    const encryptedData = fs.readFileSync(encPath);
    
    // The format is: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
    if (encryptedData.length < 28) {
      throw new Error('Encrypted file too short or corrupted');
    }
    const iv = encryptedData.subarray(0, 12);
    const authTag = encryptedData.subarray(12, 28);
    const ciphertext = encryptedData.subarray(28);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    fs.writeFileSync(dbPath, decrypted);
    log.info('Database decrypted successfully.');
  } catch (err: any) {
    log.error('Failed to decrypt database:', err.message);
  }
}

export function encryptDatabase() {
  const dbDir = app.getPath('userData');
  const dbPath = app.isPackaged 
    ? join(dbDir, DB_FILENAME) 
    : join(process.cwd(), DB_FILENAME);
  const encPath = dbPath + '.enc';

  if (!fs.existsSync(dbPath)) {
    return;
  }

  if (db) {
    try {
      db.close();
      log.info('Database connection closed before encryption.');
    } catch (err: any) {
      log.error('Error closing database connection:', err.message);
    }
  }

  try {
    log.info('Encrypting local SQLite database...');
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(12);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const plaintext = fs.readFileSync(dbPath);
    
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    // Output: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
    const finalBuffer = Buffer.concat([iv, authTag, ciphertext]);
    fs.writeFileSync(encPath, finalBuffer);
    
    // Wipe and delete plaintext database file
    fs.writeFileSync(dbPath, crypto.randomBytes(plaintext.length));
    fs.unlinkSync(dbPath);
    
    // Securely wipe and delete WAL file if it exists
    const walPath = dbPath + '-wal';
    if (fs.existsSync(walPath)) {
      const size = fs.statSync(walPath).size;
      if (size > 0) {
        fs.writeFileSync(walPath, crypto.randomBytes(size));
      }
      fs.unlinkSync(walPath);
    }
    
    // Securely wipe and delete SHM file if it exists
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(shmPath)) {
      const size = fs.statSync(shmPath).size;
      if (size > 0) {
        fs.writeFileSync(shmPath, crypto.randomBytes(size));
      }
      fs.unlinkSync(shmPath);
    }
    
    log.info('Database encrypted and plaintext files (including WAL/SHM) securely removed.');
  } catch (err: any) {
    log.error('Failed to encrypt database:', err.message);
  }
}

// Retrieve or generate a persistent device_id securely
export function getOrCreateDeviceID(): string {
  const metaDir = app.getPath('userData');
  const metaPath = join(metaDir, 'device.key');
  
  try {
    if (fs.existsSync(metaPath)) {
      const encrypted = fs.readFileSync(metaPath);
      if (safeStorage.isEncryptionAvailable()) {
        return safeStorage.decryptString(encrypted);
      } else {
        return encrypted.toString('utf8');
      }
    }
  } catch (err: any) {
    log.error('Failed to read or decrypt persistent device.key:', err.message);
  }
  
  const newId = crypto.randomUUID();
  try {
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    if (safeStorage.isEncryptionAvailable()) {
      const encrypted = safeStorage.encryptString(newId);
      fs.writeFileSync(metaPath, encrypted);
    } else {
      fs.writeFileSync(metaPath, newId, 'utf8');
    }
  } catch (err: any) {
    log.error('Failed to write persistent device.key:', err.message);
  }
  return newId;
}

export function initDatabase() {
  const dbDir = app.getPath('userData');
  const dbPath = app.isPackaged 
    ? join(dbDir, 'lims.db') 
    : join(process.cwd(), 'lims.db');
    
  decryptDatabase();
  log.info(`Initializing SQLite local database at: ${dbPath}`);
  
  try {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    
    // Create Schema
    createLocalSchema();
    log.info('Local SQLite database schema initialized successfully');

    // Start background full sync cycle interval (runs every 30 seconds)
    setInterval(() => {
      runFullSyncCycle().catch((err) => log.error('Background full sync error:', err));
    }, 30000);

    // Run once immediately on database initialization (delayed by 5s to avoid startup locking)
    setTimeout(() => {
      runFullSyncCycle().catch((err) => log.error('Initial background full sync error:', err));
    }, 5000);
  } catch (err: any) {
    log.error('Failed to initialize local SQLite database:', err);
    throw err;
  }
}

function createLocalSchema() {
  // Sync queue & metadata
  db.exec(`
    CREATE TABLE IF NOT EXISTS device_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_queue (
      id TEXT PRIMARY KEY,
      table_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT NOT NULL,
      device_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      attempts INTEGER DEFAULT 0,
      last_error TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
    CREATE INDEX IF NOT EXISTS idx_sync_queue_record_id ON sync_queue(record_id);
  `);

  // Core LIMS Tables matching Supabase schema (SQLite compatible data types)
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      label TEXT NOT NULL,
      description TEXT,
      is_system INTEGER DEFAULT 0,
      permissions TEXT DEFAULT '{}',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      phone TEXT,
      role_id TEXT NOT NULL,
      permission_overrides TEXT DEFAULT '{}',
      theme_preset TEXT DEFAULT 'default',
      two_factor_enabled INTEGER DEFAULT 0,
      two_factor_method TEXT,
      status TEXT DEFAULT 'active',
      last_login TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      settings TEXT DEFAULT '{}',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_used TEXT,
      permissions TEXT DEFAULT '[]',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS hospitals (
      id TEXT PRIMARY KEY,
      hospital_name TEXT NOT NULL,
      location TEXT,
      phone_number TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      doctor_name TEXT NOT NULL,
      speciality TEXT,
      phone_number TEXT,
      email TEXT,
      affiliate_hospital_id TEXT,
      location TEXT,
      address TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (affiliate_hospital_id) REFERENCES hospitals(id)
    );

    CREATE TABLE IF NOT EXISTS parameters (
      id TEXT PRIMARY KEY,
      parameter_name TEXT NOT NULL,
      units TEXT,
      reference_range TEXT,
      parameter_order_id INTEGER,
      trimester_type TEXT,
      is_active INTEGER DEFAULT 1,
      parameter_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tests (
      id TEXT PRIMARY KEY,
      test_name TEXT NOT NULL,
      department TEXT NOT NULL,
      test_cost REAL DEFAULT 0,
      result_header TEXT,
      reference_range TEXT,
      include_comprehensive INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      test_code TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS test_parameters (
      test_id TEXT NOT NULL,
      parameter_id TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      PRIMARY KEY (test_id, parameter_id),
      FOREIGN KEY (test_id) REFERENCES tests(id),
      FOREIGN KEY (parameter_id) REFERENCES parameters(id)
    );

    CREATE TABLE IF NOT EXISTS antibiotics (
      id TEXT PRIMARY KEY,
      antibiotic_name TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      patient_name TEXT NOT NULL,
      gender TEXT,
      dob TEXT,
      age INTEGER,
      telephone TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      device_id TEXT
    );

    CREATE TABLE IF NOT EXISTS lab_records (
      id TEXT PRIMARY KEY,
      lab_number TEXT NOT NULL UNIQUE,
      patient_id TEXT NOT NULL,
      record_date TEXT DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'active',
      referral_option TEXT,
      referral_doctor_id TEXT,
      referral_hospital_id TEXT,
      subtotal REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      arrears REAL DEFAULT 0,
      created_by_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      device_id TEXT,
      FOREIGN KEY (patient_id) REFERENCES patients(id),
      FOREIGN KEY (referral_doctor_id) REFERENCES doctors(id),
      FOREIGN KEY (referral_hospital_id) REFERENCES hospitals(id),
      FOREIGN KEY (created_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS lab_record_tests (
      id TEXT PRIMARY KEY,
      lab_record_id TEXT NOT NULL,
      test_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      department TEXT NOT NULL,
      test_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      arrears REAL DEFAULT 0,
      FOREIGN KEY (lab_record_id) REFERENCES lab_records(id) ON DELETE CASCADE,
      FOREIGN KEY (test_id) REFERENCES tests(id)
    );

    CREATE TABLE IF NOT EXISTS test_results (
      id TEXT PRIMARY KEY,
      lab_record_test_id TEXT NOT NULL,
      test_name TEXT NOT NULL,
      department TEXT NOT NULL,
      reference_range TEXT,
      unit TEXT,
      result TEXT,
      flag TEXT DEFAULT 'Normal',
      entered_by_id TEXT,
      entered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      device_id TEXT,
      FOREIGN KEY (lab_record_test_id) REFERENCES lab_record_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (entered_by_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      type TEXT DEFAULT 'info',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      department_name TEXT NOT NULL UNIQUE,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      lab_record_id TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_date TEXT DEFAULT CURRENT_TIMESTAMP,
      received_by_id TEXT,
      receipt_number TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      device_id TEXT,
      FOREIGN KEY (lab_record_id) REFERENCES lab_records(id) ON DELETE CASCADE,
      FOREIGN KEY (received_by_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id TEXT PRIMARY KEY,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      actor_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      target_name TEXT NOT NULL,
      detail TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS daily_sequences (
      seq_date TEXT PRIMARY KEY,
      last_value INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function getDatabase(): Database.Database {
  if (!db) {
    initDatabase();
  }
  return db;
}

export function cacheUserCredentials(userRow: any, roleRow: any, plaintextPassword?: string) {
  const localDb = getDatabase();
  
  // 1. Upsert role
  localDb.prepare(`
    INSERT INTO roles (id, name, label, description, is_system, permissions, updated_at)
    VALUES ($id, $name, $label, $description, $is_system, $permissions, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      label = excluded.label,
      description = excluded.description,
      permissions = excluded.permissions,
      updated_at = excluded.updated_at
  `).run({
    id: roleRow.id,
    name: roleRow.name,
    label: roleRow.label,
    description: roleRow.description || null,
    is_system: roleRow.is_system ? 1 : 0,
    permissions: typeof roleRow.permissions === 'string' ? roleRow.permissions : JSON.stringify(roleRow.permissions)
  });

  let passwordHash = userRow.password_hash;
  if (plaintextPassword) {
    try {
      passwordHash = bcrypt.hashSync(plaintextPassword, 10);
    } catch (err: any) {
      log.error('Failed to bcrypt hash user password during cacheUserCredentials:', err);
    }
  }

  // 2. Upsert user
  localDb.prepare(`
    INSERT INTO users (
      id, full_name, email, username, password_hash, phone, role_id, 
      permission_overrides, theme_preset, two_factor_enabled, two_factor_method, status, updated_at
    )
    VALUES (
      $id, $full_name, $email, $username, $password_hash, $phone, $role_id,
      $permission_overrides, $theme_preset, $two_factor_enabled, $two_factor_method, $status, datetime('now')
    )
    ON CONFLICT(id) DO UPDATE SET
      full_name = excluded.full_name,
      email = excluded.email,
      username = excluded.username,
      password_hash = excluded.password_hash,
      phone = excluded.phone,
      role_id = excluded.role_id,
      permission_overrides = excluded.permission_overrides,
      theme_preset = excluded.theme_preset,
      two_factor_enabled = excluded.two_factor_enabled,
      two_factor_method = excluded.two_factor_method,
      status = excluded.status,
      updated_at = excluded.updated_at
  `).run({
    id: userRow.id,
    full_name: userRow.full_name,
    email: userRow.email,
    username: userRow.username,
    password_hash: passwordHash,
    phone: userRow.phone || null,
    role_id: userRow.role_id,
    permission_overrides: typeof userRow.permission_overrides === 'string' ? userRow.permission_overrides : JSON.stringify(userRow.permission_overrides || {}),
    theme_preset: userRow.theme_preset || 'default',
    two_factor_enabled: userRow.two_factor_enabled ? 1 : 0,
    two_factor_method: userRow.two_factor_method || null,
    status: userRow.status || 'active'
  });
}

export async function verifyOfflineLogin(login: string, password: string): Promise<any> {
  const localDb = getDatabase();
  
  // Find user by email or username
  const user = localDb.prepare(`
    SELECT * FROM users 
    WHERE (email = ? OR username = ?) AND status = 'active'
  `).get(login, login) as any;
  
  if (!user) {
    throw new Error('User not found or inactive');
  }
  
  // Compare passwords
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  
  // Get role permissions
  const role = localDb.prepare('SELECT * FROM roles WHERE id = ?').get(user.role_id) as any;
  
  return {
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      username: user.username,
      phone: user.phone,
      roleId: user.role_id,
      permissionOverrides: typeof user.permission_overrides === 'string' ? JSON.parse(user.permission_overrides) : user.permission_overrides,
      themePreset: user.theme_preset,
      twoFactorEnabled: !!user.two_factor_enabled,
      status: user.status
    },
    permissions: role ? (typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions) : {}
  };
}

export function checkInternetConnection(): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.connect(53, '8.8.8.8');
  });
}

// Importing the Supabase Node client dynamically to avoid circular references/load ordering
import { supabaseNode } from './supabaseNode.js';

let isSyncing = false;

export async function runOutboundSyncInternal() {
  if (isSyncing) return;
  
  try {
    const { data: { session } } = await supabaseNode.auth.getSession();
    if (!session) {
      log.info('Outbound Sync: Skipping outbound sync because there is no authenticated user session in the main process.');
      return;
    }
  } catch (err: any) {
    log.error('Outbound Sync: Error checking auth session:', err.message);
    return;
  }
  
  const localDb = getDatabase();
  
  // Clean up failed queue entries older than 30 days to prevent bloat
  try {
    const deleted = localDb.prepare(`
      DELETE FROM sync_queue 
      WHERE status = 'failed' AND attempts >= 5 
        AND datetime(created_at) < datetime('now', '-30 days')
    `).run();
    if (deleted.changes > 0) {
      log.info(`Sync Queue: Cleaned up ${deleted.changes} failed entries older than 30 days.`);
    }
  } catch (err: any) {
    log.error('Failed to clean up sync_queue:', err.message);
  }
  
  // Get pending operations (or failed ones with less than 5 attempts)
  const pending = localDb.prepare(`
    SELECT * FROM sync_queue 
    WHERE status = 'pending' OR (status = 'failed' AND attempts < 5)
    ORDER BY created_at ASC
  `).all() as any[];
  
  if (pending.length === 0) return;
  
  isSyncing = true;
  log.info(`Outbound Sync: Found ${pending.length} pending items to sync.`);
  
  for (const item of pending) {
    localDb.prepare("UPDATE sync_queue SET status = 'syncing' WHERE id = ?").run(item.id);
    
    try {
      const payload = JSON.parse(item.payload);
      let error;
      
      if (item.operation === 'INSERT') {
        let finalPayload = { ...payload };

        if (item.table_name === 'lab_records' && payload.lab_number && payload.lab_number.startsWith('TEMP-')) {
          log.info(`Sync: Generating official lab number for temporary number ${payload.lab_number}`);
          const { data: officialLabNumber, error: rpcErr } = await supabaseNode.rpc('generate_lab_number');
          if (rpcErr) {
            log.error('Sync: Failed to generate official lab number, will retry:', rpcErr.message);
            throw rpcErr;
          }
          log.info(`Sync: Generated official lab number ${officialLabNumber} for record ${item.record_id}`);
          finalPayload.lab_number = officialLabNumber;
          
          // Proactively update local SQLite record
          localDb.prepare('UPDATE lab_records SET lab_number = ? WHERE id = ?').run(officialLabNumber, item.record_id);
        }

        if (item.table_name === 'payments' && payload.receipt_number && payload.receipt_number.startsWith('TEMP-')) {
          log.info(`Sync: Generating official receipt number for temporary number ${payload.receipt_number}`);
          const { data: officialReceiptNumber, error: rpcErr } = await supabaseNode.rpc('generate_receipt_number');
          if (rpcErr) {
            log.error('Sync: Failed to generate official receipt number, will retry:', rpcErr.message);
            throw rpcErr;
          }
          log.info(`Sync: Generated official receipt number ${officialReceiptNumber} for payment ${item.record_id}`);
          finalPayload.receipt_number = officialReceiptNumber;
          
          // Proactively update local SQLite payment record
          localDb.prepare('UPDATE payments SET receipt_number = ? WHERE id = ?').run(officialReceiptNumber, item.record_id);
        }

        const insertPayload: Record<string, any> = { ...finalPayload };
        const tablesWithDeviceId = ['patients', 'lab_records', 'test_results'];
        if (tablesWithDeviceId.includes(item.table_name)) {
          insertPayload.device_id = item.device_id;
        }

        const { error: err } = await supabaseNode
          .from(item.table_name)
          .insert(insertPayload);
        error = err;
      } else if (item.operation === 'UPDATE') {
        const { error: err } = await supabaseNode
          .from(item.table_name)
          .update(payload)
          .eq('id', item.record_id);
        error = err;
      } else if (item.operation === 'DELETE') {
        const { error: err } = await supabaseNode
          .from(item.table_name)
          .delete()
          .eq('id', item.record_id);
        error = err;
      }
      
      if (error) throw error;
      
      // Update status to done
      localDb.prepare("UPDATE sync_queue SET status = 'done' WHERE id = ?").run(item.id);
      log.info(`Outbound Sync: Successfully synced ${item.table_name} record ${item.record_id}`);
    } catch (err: any) {
      log.error(`Outbound Sync: Failed to sync ${item.table_name} record ${item.record_id}:`, err.message);
      
      localDb.prepare(`
        UPDATE sync_queue 
        SET status = 'failed', attempts = attempts + 1, last_error = ? 
        WHERE id = ?
      `).run(err.message, item.id);
    }
  }
  
  isSyncing = false;
}

export async function runOutboundSync() {
  // Verify actual internet connection
  const online = await checkInternetConnection();
  if (!online) {
    return;
  }
  await runOutboundSyncInternal();
}

interface TableSyncConfig {
  tableName: string;
  sqliteTableName?: string;
  timestampColumn?: string;
  upsertSql: string;
  sqliteParamMapper: (row: any) => Record<string, any>;
}

const SYNC_CONFIGS: TableSyncConfig[] = [
  {
    tableName: 'roles',
    upsertSql: `
      INSERT INTO roles (id, name, label, description, is_system, permissions, created_at, updated_at)
      VALUES ($id, $name, $label, $description, $is_system, $permissions, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        label = excluded.label,
        description = excluded.description,
        is_system = excluded.is_system,
        permissions = excluded.permissions,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      name: r.name,
      label: r.label,
      description: r.description || null,
      is_system: r.is_system ? 1 : 0,
      permissions: typeof r.permissions === 'string' ? r.permissions : JSON.stringify(r.permissions || {}),
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'users',
    upsertSql: `
      INSERT INTO users (id, full_name, email, username, password_hash, phone, role_id, permission_overrides, theme_preset, two_factor_enabled, two_factor_method, status, last_login, created_at, updated_at)
      VALUES ($id, $full_name, $email, $username, $password_hash, $phone, $role_id, $permission_overrides, $theme_preset, $two_factor_enabled, $two_factor_method, $status, $last_login, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        full_name = excluded.full_name,
        email = excluded.email,
        username = excluded.username,
        password_hash = excluded.password_hash,
        phone = excluded.phone,
        role_id = excluded.role_id,
        permission_overrides = excluded.permission_overrides,
        theme_preset = excluded.theme_preset,
        two_factor_enabled = excluded.two_factor_enabled,
        two_factor_method = excluded.two_factor_method,
        status = excluded.status,
        last_login = excluded.last_login,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      username: r.username,
      password_hash: r.password_hash,
      phone: r.phone || null,
      role_id: r.role_id,
      permission_overrides: typeof r.permission_overrides === 'string' ? r.permission_overrides : JSON.stringify(r.permission_overrides || {}),
      theme_preset: r.theme_preset || 'default',
      two_factor_enabled: r.two_factor_enabled ? 1 : 0,
      two_factor_method: r.two_factor_method || null,
      status: r.status || 'active',
      last_login: r.last_login || null,
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'app_settings',
    sqliteTableName: 'system_settings',
    upsertSql: `
      INSERT INTO system_settings (id, settings, updated_at)
      VALUES (1, $settings, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        settings = excluded.settings,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      settings: JSON.stringify({
        general: r.general || {},
        notifications: r.notifications || {},
        security: r.security || {},
        smtp: r.smtp || {},
        receipt: r.receipt || { paperSize: 'A4', scale: 1, showLogo: true, showWatermark: false }
      }),
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'api_keys',
    upsertSql: `
      INSERT INTO api_keys (id, name, key, created_at, last_used, permissions, updated_at)
      VALUES ($id, $name, $key, $created_at, $last_used, $permissions, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        key = excluded.key,
        last_used = excluded.last_used,
        permissions = excluded.permissions,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      name: r.name,
      key: r.key,
      created_at: r.created_at,
      last_used: r.last_used || null,
      permissions: typeof r.permissions === 'string' ? r.permissions : JSON.stringify(r.permissions || []),
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'hospitals',
    upsertSql: `
      INSERT INTO hospitals (id, hospital_name, location, phone_number, address, created_at, updated_at)
      VALUES ($id, $hospital_name, $location, $phone_number, $address, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        hospital_name = excluded.hospital_name,
        location = excluded.location,
        phone_number = excluded.phone_number,
        address = excluded.address,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      hospital_name: r.hospital_name,
      location: r.location || null,
      phone_number: r.phone_number || null,
      address: r.address || null,
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'doctors',
    upsertSql: `
      INSERT INTO doctors (id, doctor_name, speciality, phone_number, email, affiliate_hospital_id, location, address, created_at, updated_at)
      VALUES ($id, $doctor_name, $speciality, $phone_number, $email, $affiliate_hospital_id, $location, $address, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        doctor_name = excluded.doctor_name,
        speciality = excluded.speciality,
        phone_number = excluded.phone_number,
        email = excluded.email,
        affiliate_hospital_id = excluded.affiliate_hospital_id,
        location = excluded.location,
        address = excluded.address,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      doctor_name: r.doctor_name,
      speciality: r.speciality || null,
      phone_number: r.phone_number || null,
      email: r.email || null,
      affiliate_hospital_id: r.affiliate_hospital_id || null,
      location: r.location || null,
      address: r.address || null,
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'parameters',
    upsertSql: `
      INSERT INTO parameters (id, parameter_name, units, reference_range, parameter_order_id, trimester_type, is_active, parameter_code, created_at, updated_at)
      VALUES ($id, $parameter_name, $units, $reference_range, $parameter_order_id, $trimester_type, $is_active, $parameter_code, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        parameter_name = excluded.parameter_name,
        units = excluded.units,
        reference_range = excluded.reference_range,
        parameter_order_id = excluded.parameter_order_id,
        trimester_type = excluded.trimester_type,
        is_active = excluded.is_active,
        parameter_code = excluded.parameter_code,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      parameter_name: r.parameter_name,
      units: r.units || null,
      reference_range: r.reference_range || null,
      parameter_order_id: r.parameter_order_id || null,
      trimester_type: r.trimester_type || null,
      is_active: r.is_active ? 1 : 0,
      parameter_code: r.parameter_code || null,
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'tests',
    upsertSql: `
      INSERT INTO tests (id, test_name, department, test_cost, result_header, reference_range, include_comprehensive, is_active, test_code, created_at, updated_at)
      VALUES ($id, $test_name, $department, $test_cost, $result_header, $reference_range, $include_comprehensive, $is_active, $test_code, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        test_name = excluded.test_name,
        department = excluded.department,
        test_cost = excluded.test_cost,
        result_header = excluded.result_header,
        reference_range = excluded.reference_range,
        include_comprehensive = excluded.include_comprehensive,
        is_active = excluded.is_active,
        test_code = excluded.test_code,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      test_name: r.test_name,
      department: r.department,
      test_cost: Number(r.test_cost),
      result_header: r.result_header || null,
      reference_range: r.reference_range || null,
      include_comprehensive: r.include_comprehensive ? 1 : 0,
      is_active: r.is_active ? 1 : 0,
      test_code: r.test_code || null,
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  },
  {
    tableName: 'departments',
    timestampColumn: 'created_at',
    upsertSql: `
      INSERT INTO departments (id, department_name, is_active, created_at, updated_at)
      VALUES ($id, $department_name, $is_active, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        department_name = excluded.department_name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      department_name: r.department_name,
      is_active: r.is_active ? 1 : 0,
      created_at: r.created_at,
      updated_at: r.updated_at || r.created_at
    })
  },
  {
    tableName: 'antibiotics',
    timestampColumn: 'created_at',
    upsertSql: `
      INSERT INTO antibiotics (id, antibiotic_name, is_active, created_at, updated_at)
      VALUES ($id, $antibiotic_name, $is_active, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        antibiotic_name = excluded.antibiotic_name,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      antibiotic_name: r.antibiotic_name,
      is_active: r.is_active ? 1 : 0,
      created_at: r.created_at,
      updated_at: r.updated_at || r.created_at
    })
  },
  {
    tableName: 'patients',
    upsertSql: `
      INSERT INTO patients (id, patient_name, gender, dob, age, telephone, created_at, updated_at, device_id)
      VALUES ($id, $patient_name, $gender, $dob, $age, $telephone, $created_at, $updated_at, $device_id)
      ON CONFLICT(id) DO UPDATE SET
        patient_name = excluded.patient_name,
        gender = excluded.gender,
        dob = excluded.dob,
        age = excluded.age,
        telephone = excluded.telephone,
        updated_at = excluded.updated_at,
        device_id = excluded.device_id
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      patient_name: r.patient_name,
      gender: r.gender || null,
      dob: r.dob || null,
      age: r.age || null,
      telephone: r.telephone || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      device_id: r.device_id || null
    })
  },
  {
    tableName: 'lab_records',
    upsertSql: `
      INSERT INTO lab_records (id, lab_number, patient_id, record_date, status, referral_option, referral_doctor_id, referral_hospital_id, subtotal, total_cost, amount_paid, arrears, created_by_id, created_at, updated_at, device_id)
      VALUES ($id, $lab_number, $patient_id, $record_date, $status, $referral_option, $referral_doctor_id, $referral_hospital_id, $subtotal, $total_cost, $amount_paid, $arrears, $created_by_id, $created_at, $updated_at, $device_id)
      ON CONFLICT(id) DO UPDATE SET
        lab_number = excluded.lab_number,
        status = excluded.status,
        referral_option = excluded.referral_option,
        referral_doctor_id = excluded.referral_doctor_id,
        referral_hospital_id = excluded.referral_hospital_id,
        subtotal = excluded.subtotal,
        total_cost = excluded.total_cost,
        amount_paid = excluded.amount_paid,
        arrears = excluded.arrears,
        updated_at = excluded.updated_at,
        device_id = excluded.device_id
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      lab_number: r.lab_number,
      patient_id: r.patient_id,
      record_date: r.record_date,
      status: r.status || 'active',
      referral_option: r.referral_option || null,
      referral_doctor_id: r.referral_doctor_id || null,
      referral_hospital_id: r.referral_hospital_id || null,
      subtotal: Number(r.subtotal),
      total_cost: Number(r.total_cost),
      amount_paid: Number(r.amount_paid),
      arrears: Number(r.arrears),
      created_by_id: r.created_by_id || null,
      created_at: r.created_at,
      updated_at: r.updated_at,
      device_id: r.device_id || null
    })
  },
  {
    tableName: 'payments',
    timestampColumn: 'payment_date',
    upsertSql: `
      INSERT INTO payments (id, lab_record_id, amount, payment_date, received_by_id, receipt_number, device_id)
      VALUES ($id, $lab_record_id, $amount, $payment_date, $received_by_id, $receipt_number, $device_id)
      ON CONFLICT(id) DO UPDATE SET
        amount = excluded.amount,
        payment_date = excluded.payment_date,
        received_by_id = excluded.received_by_id,
        receipt_number = excluded.receipt_number,
        device_id = excluded.device_id
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      lab_record_id: r.lab_record_id,
      amount: Number(r.amount),
      payment_date: r.payment_date,
      received_by_id: r.received_by_id || null,
      receipt_number: r.receipt_number,
      device_id: r.device_id || null
    })
  },
  {
    tableName: 'test_results',
    upsertSql: `
      INSERT INTO test_results (id, lab_record_test_id, test_name, department, reference_range, unit, result, flag, entered_by_id, entered_at, updated_at, device_id)
      VALUES ($id, $lab_record_test_id, $test_name, $department, $reference_range, $unit, $result, $flag, $entered_by_id, $entered_at, $updated_at, $device_id)
      ON CONFLICT(id) DO UPDATE SET
        reference_range = excluded.reference_range,
        unit = excluded.unit,
        result = excluded.result,
        flag = excluded.flag,
        entered_by_id = excluded.entered_by_id,
        updated_at = excluded.updated_at,
        device_id = excluded.device_id
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      lab_record_test_id: r.lab_record_test_id,
      test_name: r.test_name,
      department: r.department,
      reference_range: r.reference_range || null,
      unit: r.unit || null,
      result: r.result || null,
      flag: r.flag || 'Normal',
      entered_by_id: r.entered_by_id || null,
      entered_at: r.entered_at,
      updated_at: r.updated_at,
      device_id: r.device_id || null
    })
  },
  {
    tableName: 'notifications',
    upsertSql: `
      INSERT INTO notifications (id, user_id, title, message, is_read, type, created_at, updated_at)
      VALUES ($id, $user_id, $title, $message, $is_read, $type, $created_at, $updated_at)
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        message = excluded.message,
        is_read = excluded.is_read,
        type = excluded.type,
        updated_at = excluded.updated_at
    `,
    sqliteParamMapper: (r) => ({
      id: r.id,
      user_id: r.user_id,
      title: r.title,
      message: r.message,
      is_read: r.is_read ? 1 : 0,
      type: r.type || 'info',
      created_at: r.created_at,
      updated_at: r.updated_at
    })
  }
];

export async function pullInboundChanges() {
  const { data: { session } } = await supabaseNode.auth.getSession();
  const hasSession = !!session;
  if (!hasSession) {
    log.warn('Inbound Sync: No authenticated user session in main process. Proceeding to pull public tables anonymously.');
  }

  const localDb = getDatabase();

  // Self-Healing: If we have an authenticated session and a private table is empty locally,
  // clear its sync timestamp to force a full pull of historical records.
  if (hasSession) {
    const privateTables = ['patients', 'lab_records', 'payments', 'test_results', 'notifications'];
    for (const pTable of privateTables) {
      try {
        const rowCount = localDb.prepare(`SELECT COUNT(*) as count FROM ${pTable}`).get() as any;
        if (rowCount && rowCount.count === 0) {
          const metaKey = `last_inbound_sync_${pTable}`;
          localDb.prepare("DELETE FROM device_meta WHERE key = ?").run(metaKey);
          log.info(`Inbound Sync Self-Healing: Cleared sync timestamp for empty table ${pTable} to trigger full pull.`);
        }
      } catch (e: any) {
        log.error(`Inbound Sync Self-Healing: Failed to verify row count for table ${pTable}:`, e.message);
      }
    }
  }

  let shouldSyncTestParameters = false;
  let hasAnySucceeded = false;

  try {
    log.info(`Inbound Sync: Starting inbound sync cycle...`);
    
    for (const config of SYNC_CONFIGS) {
      const isPrivateTable = ['patients', 'lab_records', 'payments', 'test_results', 'notifications'].includes(config.tableName);
      if (isPrivateTable && !hasSession) {
        log.info(`Inbound Sync: Skipping private table ${config.tableName} pull since user session is not authenticated.`);
        continue;
      }

      try {
        const metaKey = `last_inbound_sync_${config.tableName}`;
        const lastSyncRow = localDb.prepare("SELECT value FROM device_meta WHERE key = ?").get(metaKey) as any;
        let since = lastSyncRow ? lastSyncRow.value : null;

        if (!since) {
          const ninetyDaysAgo = new Date();
          ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
          since = ninetyDaysAgo.toISOString();
        }

        log.info(`Inbound Sync: Pulling remote changes for table ${config.tableName} since ${since}...`);

        const timestampCol = config.timestampColumn || 'updated_at';
        
        const { data: remoteRecords, error } = await supabaseNode
          .from(config.tableName)
          .select('*')
          .gt(timestampCol, since)
          .order(timestampCol, { ascending: true });

        if (error) {
          log.error(`Inbound Sync: Failed to fetch table ${config.tableName}:`, error.message);
          continue; // Resiliently skip this table instead of failing the whole loop
        }
        
        if (remoteRecords && remoteRecords.length > 0) {
          log.info(`Inbound Sync: Received ${remoteRecords.length} records for table ${config.tableName}`);
          
          const sqliteTable = config.sqliteTableName || config.tableName;
          const upsertStmt = localDb.prepare(config.upsertSql);
          const checkPendingOutbound = localDb.prepare(`
            SELECT 1 FROM sync_queue 
            WHERE record_id = ? AND status = 'pending' AND table_name = ?
          `);

          const transaction = localDb.transaction((records) => {
            for (const record of records) {
              const hasPending = checkPendingOutbound.get(record.id, sqliteTable);
              if (!hasPending) {
                upsertStmt.run(config.sqliteParamMapper(record));
              }
            }
          });
          transaction(remoteRecords);

          if ((config.tableName === 'tests' || config.tableName === 'parameters') && remoteRecords.length > 0) {
            shouldSyncTestParameters = true;
          }

          if (config.tableName === 'lab_records' && remoteRecords.length > 0) {
            const recordIds = remoteRecords.map(r => r.id);
            const { data: remoteTests, error: testsError } = await supabaseNode
              .from('lab_record_tests')
              .select('*')
              .in('lab_record_id', recordIds);

            if (!testsError && remoteTests && remoteTests.length > 0) {
              const upsertLrt = localDb.prepare(`
                INSERT INTO lab_record_tests (id, lab_record_id, test_id, test_name, department, test_cost, total_cost, amount_paid, arrears)
                VALUES ($id, $lab_record_id, $test_id, $test_name, $department, $test_cost, $total_cost, $amount_paid, $arrears)
                ON CONFLICT(id) DO UPDATE SET
                  test_name = excluded.test_name,
                  department = excluded.department,
                  test_cost = excluded.test_cost,
                  total_cost = excluded.total_cost,
                  amount_paid = excluded.amount_paid,
                  arrears = excluded.arrears
              `);
              
              localDb.transaction(() => {
                for (const rt of remoteTests) {
                  upsertLrt.run({
                    id: rt.id,
                    lab_record_id: rt.lab_record_id,
                    test_id: rt.test_id,
                    test_name: rt.test_name,
                    department: rt.department,
                    test_cost: Number(rt.test_cost),
                    total_cost: Number(rt.total_cost),
                    amount_paid: Number(rt.amount_paid),
                    arrears: Number(rt.arrears)
                  });
                }
              })();
            }
          }

          const lastRecordTime = remoteRecords[remoteRecords.length - 1][timestampCol];
          localDb.prepare("INSERT INTO device_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
            .run(metaKey, lastRecordTime);
          log.info(`Inbound Sync: Table ${config.tableName} sync timestamp updated to ${lastRecordTime}`);
        } else {
          // If no new remote records, update timestamp to now so we don't query same historical gap endlessly
          const currentCheckTime = new Date().toISOString();
          localDb.prepare("INSERT INTO device_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
            .run(metaKey, currentCheckTime);
        }
        
        hasAnySucceeded = true;
      } catch (tableErr: any) {
        log.error(`Inbound Sync: Exception during sync loop for table ${config.tableName}:`, tableErr.message);
      }
    }

    if (shouldSyncTestParameters) {
      log.info('Inbound Sync: Catalog updated, refreshing test_parameters...');
      const { data: remoteTestParams, error: tpError } = await supabaseNode
        .from('test_parameters')
        .select('*');
      if (!tpError && remoteTestParams) {
        localDb.transaction(() => {
          localDb.prepare('DELETE FROM test_parameters').run();
          const insertTp = localDb.prepare(`
            INSERT INTO test_parameters (test_id, parameter_id, sort_order)
            VALUES (?, ?, ?)
          `);
          for (const tp of remoteTestParams) {
            insertTp.run(tp.test_id, tp.parameter_id, tp.sort_order);
          }
        })();
      }
    }

    if (hasAnySucceeded) {
      const globalSyncTime = new Date().toISOString();
      localDb.prepare("INSERT INTO device_meta (key, value) VALUES ('last_inbound_sync', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
        .run(globalSyncTime);
    }
  } catch (err: any) {
    log.error('Inbound Sync: Inbound synchronization failed:', err.message);
  }
}

let isSyncingFull = false;

export async function runFullSyncCycle() {
  if (isSyncingFull) return;
  
  // Verify actual internet connection
  const online = await checkInternetConnection();
  if (!online) {
    return;
  }
  
  isSyncingFull = true;
  try {
    log.info('Starting Full Sync Cycle (Outbound -> Inbound)...');
    await runOutboundSyncInternal();
    await pullInboundChanges();
    log.info('Full Sync Cycle completed successfully.');
  } catch (err: any) {
    log.error('Full Sync Cycle failed:', err.message);
  } finally {
    isSyncingFull = false;
  }
}

