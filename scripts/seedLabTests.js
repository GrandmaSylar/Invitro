import XLSX from 'xlsx';
import sql from 'mssql';
import fs from 'node:fs';
import path from 'node:path';

function getDbConfig() {
  const appData = process.env.APPDATA || (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
  const possiblePaths = [
    path.join(appData, 'invitro-aidmed-lims', 'db_config.json'),
    path.join(appData, 'Invitro LIMS', 'db_config.json'),
    path.join(process.cwd(), 'db_config.json'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      console.log('Found database configuration at:', p);
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  }
  return null;
}

async function seedDatabase() {
  const dbConfig = getDbConfig();
  if (!dbConfig) {
    console.error('ERROR: Could not find db_config.json configuration file.');
    process.exit(1);
  }

  const sqlConfig = {
    server: dbConfig.server,
    port: dbConfig.port ? Number(dbConfig.port) : 1433,
    database: process.env.TARGET_DB || dbConfig.database,
    user: dbConfig.user,
    password: dbConfig.password,
    options: {
      encrypt: dbConfig.encrypt ?? false,
      trustServerCertificate: dbConfig.trustServerCertificate ?? true,
      connectTimeout: 30000,
      requestTimeout: 30000,
    },
  };

  console.log(`Connecting to MSSQL Database '${dbConfig.database}' on '${dbConfig.server}'...`);
  const pool = await sql.connect(sqlConfig);
  console.log('Connected to MSSQL Database successfully!');

  const excelPath = path.join(process.cwd(), 'Lab_Tests_and_Parameters_v2.xlsx');
  console.log('Reading Excel file:', excelPath);
  
  const workbook = XLSX.readFile(excelPath);
  const testsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Tests']);
  const paramsRaw = XLSX.utils.sheet_to_json(workbook.Sheets['Parameters']);

  console.log(`Loaded ${testsRaw.length} tests and ${paramsRaw.length} parameter rows from Excel.`);

  // Set of valid test IDs
  const validTestIds = new Set();

  // 1. Seed Tests
  let testCount = 0;
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
        UPDATE tests
        SET test_name = @name, department = @dept, test_cost = @cost, test_code = @code, is_active = 1, updated_at = GETDATE()
        WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO tests (id, test_name, department, test_cost, is_active, test_code, created_at, updated_at)
        VALUES (@id, @name, @dept, @cost, 1, @code, GETDATE(), GETDATE());
      END
    `);

    testCount++;
  }

  console.log(`Successfully seeded ${testCount} tests into 'tests' table!`);

  // 2. Ensure missing orphan tests are created automatically to satisfy FK constraints
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
          INSERT INTO tests (id, test_name, department, test_cost, is_active, test_code, created_at, updated_at)
          VALUES (@id, @name, @dept, @cost, 1, @code, GETDATE(), GETDATE());
        END
      `);
      console.log(`Created auto-generated parent test '${testId}' for parameters.`);
    }
  }

  // 3. Seed Parameters and Test-Parameter Mappings
  let paramCount = 0;
  let mapCount = 0;

  // Track parameter order per test_id
  const testOrderMap = new Map();

  for (const row of paramsRaw) {
    const paramCode = String(row['Param ID'] || '').trim();
    const testId = String(row['Test ID'] || '').trim();
    const paramName = String(row['Parameter Name'] || '').trim();
    const units = row['Units'] ? String(row['Units']).trim() : null;
    const refRange = row['Reference Range'] ? String(row['Reference Range']).trim() : null;

    if (!testId || !paramName) continue;

    // Unique parameter ID per test + parameter combination
    const parameterId = `PARAM-${testId}-${paramCode || '0'}-${paramName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30)}`;

    const currentOrder = (testOrderMap.get(testId) || 0) + 1;
    testOrderMap.set(testId, currentOrder);

    // Upsert into parameters
    const reqParam = pool.request();
    reqParam.input('id', sql.VarChar(100), parameterId);
    reqParam.input('name', sql.NVarChar(200), paramName);
    reqParam.input('units', sql.NVarChar(50), units);
    reqParam.input('ref', sql.NVarChar(200), refRange);
    reqParam.input('code', sql.NVarChar(50), paramCode || null);

    await reqParam.query(`
      IF EXISTS (SELECT 1 FROM parameters WHERE id = @id)
      BEGIN
        UPDATE parameters
        SET parameter_name = @name, units = @units, reference_range = @ref, parameter_code = @code, is_active = 1, updated_at = GETDATE()
        WHERE id = @id;
      END
      ELSE
      BEGIN
        INSERT INTO parameters (id, parameter_name, units, reference_range, is_active, parameter_code, created_at, updated_at)
        VALUES (@id, @name, @units, @ref, 1, @code, GETDATE(), GETDATE());
      END
    `);
    paramCount++;

    // Upsert into test_parameters mapping
    const reqMap = pool.request();
    reqMap.input('tid', sql.VarChar(100), testId);
    reqMap.input('pid', sql.VarChar(100), parameterId);
    reqMap.input('order', sql.Int, currentOrder);

    await reqMap.query(`
      IF EXISTS (SELECT 1 FROM test_parameters WHERE test_id = @tid AND parameter_id = @pid)
      BEGIN
        UPDATE test_parameters
        SET sort_order = @order
        WHERE test_id = @tid AND parameter_id = @pid;
      END
      ELSE
      BEGIN
        INSERT INTO test_parameters (test_id, parameter_id, sort_order)
        VALUES (@tid, @pid, @order);
      END
    `);
    mapCount++;
  }

  console.log(`Successfully seeded ${paramCount} parameters into 'parameters' table!`);
  console.log(`Successfully created ${mapCount} test-parameter links in 'test_parameters' table!`);

  await pool.close();
  console.log('Database seeding process completed cleanly!');
}

seedDatabase().catch((err) => {
  console.error('Database Seeding Failed:', err);
  process.exit(1);
});
