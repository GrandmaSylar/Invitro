/**
 * seed-dev-account.js
 * 
 * Creates a developer account in the BlooDB SQL Server database
 * with full access to all modules.
 *
 * Credentials:
 *   username: grandma
 *   password: Password@123  (stored as bcrypt hash)
 *
 * Usage:
 *   1. Fill in your SQL Server password in server/.env
 *   2. Run:  node sql/seed-dev-account.js
 */

const sql = require('mssql');
const bcrypt = require('bcryptjs');
const path = require('path');

// ── Load .env ──────────────────────────────────────────────
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const SALT_ROUNDS = 12;

const DEV_USER = {
  id: 'usr_dev_grandma',
  fullName: 'Grandma Developer',
  email: 'grandma@bloo.local',
  username: 'grandma',
  plainPassword: 'Password@123',
  phone: null,
  roleId: 'developer',
  permissionOverrides: '{}',
  twoFactorEnabled: false,
  twoFactorMethod: null,
  status: 'active',
};

async function main() {
  const config = {
    server: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '1433', 10),
    database: process.env.DB_NAME || 'BlooDB',
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASSWORD || '',
    options: {
      encrypt: false,
      trustServerCertificate: true,
    },
  };

  console.log(`\n🔌 Connecting to SQL Server at ${config.server}:${config.port}/${config.database}...\n`);

  let pool;
  try {
    pool = await sql.connect(config);
    console.log('✅ Connected successfully.\n');
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('\n   Check your .env file at server/.env and ensure SQL Server is running.\n');
    process.exit(1);
  }

  try {
    // ── Ensure the developer role exists ──────────────────
    const roleCheck = await pool.request()
      .input('roleId', sql.NVarChar, 'developer')
      .query(`SELECT id FROM roles WHERE id = @roleId`);

    if (roleCheck.recordset.length === 0) {
      console.log('📦 Developer role not found — creating it...');
      await pool.request()
        .input('id', sql.NVarChar, 'developer')
        .input('name', sql.NVarChar, 'developer')
        .input('label', sql.NVarChar, 'Developer')
        .input('description', sql.NVarChar, 'Full system access for development')
        .input('isSystem', sql.Bit, true)
        .input('permissions', sql.NVarChar, JSON.stringify({
          'system.settings': true,
          'system.users': true,
          'system.roles': true,
          'system.audit': true,
          'system.backup': true,
          'system.api_keys': true,
          'patients.view': true,
          'patients.create': true,
          'patients.edit': true,
          'patients.delete': true,
          'results.view': true,
          'results.create': true,
          'results.edit': true,
          'results.approve': true,
          'catalog.view': true,
          'catalog.manage': true,
          'registry.view': true,
          'registry.manage': true,
        }))
        .query(`
          INSERT INTO roles (id, name, label, description, isSystem, permissions)
          VALUES (@id, @name, @label, @description, @isSystem, @permissions)
        `);
      console.log('   ✅ Developer role created.\n');
    } else {
      console.log('✅ Developer role already exists.\n');
    }

    // ── Check if user already exists ─────────────────────
    const userCheck = await pool.request()
      .input('username', sql.NVarChar, DEV_USER.username)
      .input('email', sql.NVarChar, DEV_USER.email)
      .query(`SELECT id FROM users WHERE username = @username OR email = @email`);

    if (userCheck.recordset.length > 0) {
      console.log(`⚠️  User "${DEV_USER.username}" already exists (id: ${userCheck.recordset[0].id}).`);
      console.log('   Updating password...\n');

      const hash = await bcrypt.hash(DEV_USER.plainPassword, SALT_ROUNDS);
      await pool.request()
        .input('id', sql.NVarChar, userCheck.recordset[0].id)
        .input('passwordHash', sql.NVarChar, hash)
        .input('roleId', sql.NVarChar, DEV_USER.roleId)
        .input('status', sql.NVarChar, 'active')
        .query(`
          UPDATE users
          SET passwordHash = @passwordHash,
              roleId = @roleId,
              status = @status
          WHERE id = @id
        `);
      console.log('   ✅ Password and role updated.\n');
    } else {
      // ── Hash password and insert ─────────────────────────
      console.log(`🔒 Hashing password with bcrypt (${SALT_ROUNDS} salt rounds)...`);
      const hash = await bcrypt.hash(DEV_USER.plainPassword, SALT_ROUNDS);
      console.log(`   Hash: ${hash.substring(0, 20)}...`);

      await pool.request()
        .input('id', sql.NVarChar, DEV_USER.id)
        .input('fullName', sql.NVarChar, DEV_USER.fullName)
        .input('email', sql.NVarChar, DEV_USER.email)
        .input('username', sql.NVarChar, DEV_USER.username)
        .input('passwordHash', sql.NVarChar, hash)
        .input('phone', sql.NVarChar, DEV_USER.phone)
        .input('roleId', sql.NVarChar, DEV_USER.roleId)
        .input('permissionOverrides', sql.NVarChar, DEV_USER.permissionOverrides)
        .input('twoFactorEnabled', sql.Bit, DEV_USER.twoFactorEnabled)
        .input('twoFactorMethod', sql.NVarChar, DEV_USER.twoFactorMethod)
        .input('status', sql.NVarChar, DEV_USER.status)
        .query(`
          INSERT INTO users (
            id, fullName, email, username, passwordHash,
            phone, roleId, permissionOverrides,
            twoFactorEnabled, twoFactorMethod, status
          ) VALUES (
            @id, @fullName, @email, @username, @passwordHash,
            @phone, @roleId, @permissionOverrides,
            @twoFactorEnabled, @twoFactorMethod, @status
          )
        `);

      console.log('\n   ✅ Dev account created successfully!\n');
    }

    // ── Summary ──────────────────────────────────────────
    console.log('┌─────────────────────────────────────────┐');
    console.log('│         DEV ACCOUNT READY                │');
    console.log('├─────────────────────────────────────────┤');
    console.log(`│  Username:  grandma                      │`);
    console.log(`│  Password:  Password@123                 │`);
    console.log(`│  Role:      Developer (full access)      │`);
    console.log(`│  Email:     grandma@bloo.local            │`);
    console.log('└─────────────────────────────────────────┘');
    console.log('');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await pool.close();
    console.log('🔌 Connection closed.');
  }
}

main();
