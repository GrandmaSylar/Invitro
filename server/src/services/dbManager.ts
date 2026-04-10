import { DataSource, DataSourceOptions } from 'typeorm';
import { DatabaseConfig } from '../types';
import * as admin from 'firebase-admin';
import { UserEntity } from '../entities/User';
import { RoleEntity } from '../entities/Role';

/** All TypeORM entities registered with the application. */
const ALL_ENTITIES = [UserEntity, RoleEntity];

/**
 * Map the setup-wizard key to the driver string TypeORM actually expects.
 * Most keys are 1:1 except `sqlserver` → `mssql`.
 */
const DB_TYPE_MAP: Record<string, string> = {
  sqlserver: 'mssql',
  postgresql: 'postgres',
};

export class DatabaseManager {
  private static activeDataSource: DataSource | null = null;
  private static isFirebaseActive = false;

  // ── Test Connection ──────────────────────────────────────────
  public static async testConnection(
    config: DatabaseConfig,
  ): Promise<{ success: boolean; message: string }> {
    try {
      if (config.dbType === 'firebase') {
        const adminApp = admin.initializeApp(
          { credential: admin.credential.cert(JSON.parse(config.connectionString || '{}')) },
          `test-${Date.now()}`,
        );
        await adminApp.firestore().collection('_test').limit(1).get();
        await adminApp.delete();
        return { success: true, message: 'Firebase connection successful' };
      }

      const typeormConfig = this.buildTypeOrmConfig(config, false);
      const testDataSource = new DataSource({ ...typeormConfig, synchronize: false, logging: false });
      await testDataSource.initialize();
      await testDataSource.query('SELECT 1');
      await testDataSource.destroy();

      return { success: true, message: 'Connection successful' };
    } catch (error: any) {
      console.error('Test Connection Debug Log:', {
        dbType: config.dbType,
        host: config.host,
        port: config.port,
        dbName: config.dbName,
        user: config.username,
        error: error.message,
        stack: error.stack
      });
      return { success: false, message: `Connection failed: ${error.message}` };
    }
  }

  // ── Full Initialisation ──────────────────────────────────────
  public static async initializeActiveConnection(
    config: DatabaseConfig,
    synchronize = false,
  ): Promise<void> {
    if (this.activeDataSource && this.activeDataSource.isInitialized) {
      await this.activeDataSource.destroy();
    }
    this.activeDataSource = null;
    this.isFirebaseActive = false;

    if (config.dbType === 'firebase') {
      try {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(config.connectionString || '{}')),
          });
        }
        this.isFirebaseActive = true;
        console.log('Firebase initialized successfully.');
      } catch (err) {
        console.error('Failed to initialize Firebase:', err);
      }
      return;
    }

    try {
      const typeormConfig = this.buildTypeOrmConfig(config, synchronize);
      this.activeDataSource = new DataSource(typeormConfig);
      await this.activeDataSource.initialize();
      console.log(`Successfully connected to ${config.dbType} database!`);
    } catch (err) {
      console.error('Failed to initialize TypeORM connection:', err);
    }
  }

  // ── Provision (synchronize schema) ───────────────────────────
  public static async provisionSchema(config: DatabaseConfig): Promise<void> {
    try {
      // Step 1: Try a normal connection first. If it has tables, we skip sync.
      await this.initializeActiveConnection(config, false);
      
      const ds = this.getDataSource();
      const repo = ds.getRepository(RoleEntity);
      const count = await repo.count();
      
      if (count > 0) {
        console.log(`[Provision] Schema already seeded with ${count} roles. Skipping sync.`);
        return;
      }
      
      // If we are here, connection worked but DB is empty? Re-init with sync.
      await this.initializeActiveConnection(config, true);
    } catch (err: any) {
      console.log(`[Provision] Direct connection failed or schema missing, falling back to sync: ${err.message}`);
      await this.initializeActiveConnection(config, true);
    }
  }

  // ── Accessors ────────────────────────────────────────────────
  public static getDataSource(): DataSource {
    if (!this.activeDataSource) {
      throw new Error('Database connection has not been initialized.');
    }
    return this.activeDataSource;
  }

  public static hasActiveConnection(): boolean {
    return (this.activeDataSource !== null && this.activeDataSource.isInitialized) || this.isFirebaseActive;
  }

  public static isFirebase(): boolean {
    return this.isFirebaseActive;
  }

  // ── Build TypeORM config ─────────────────────────────────────
  private static buildTypeOrmConfig(
    config: DatabaseConfig,
    synchronize = false,
  ): DataSourceOptions {
    const isSqlite = config.dbType === 'sqlite';
    const driverType = DB_TYPE_MAP[config.dbType] || config.dbType;

    const baseOptions: Record<string, any> = {
      type: driverType as any,
      synchronize,
      logging: false,
      entities: ALL_ENTITIES,
    };

    // SQLite — file-based, no host/port
    if (isSqlite) {
      return {
        ...baseOptions,
        database: config.connectionString || 'local.sqlite',
      } as DataSourceOptions;
    }

    // Start building standard options
    const standard: Record<string, any> = {
      ...baseOptions,
    };

    if (config.connectionString && driverType !== 'mssql') {
      // Connection string override (Supabase, Neon, PlanetScale, etc.)
      standard.url = config.connectionString;
      standard.ssl = config.ssl ? { rejectUnauthorized: false } : false;
    } else {
      // Standard host/port connection
      standard.host = config.host;
      standard.port = config.port;
      standard.username = config.username;
      standard.password = config.password;
      standard.database = config.dbName;
      standard.ssl = config.ssl ? { rejectUnauthorized: false } : false;
    }

    // Connection pool settings
    if (config.poolSize) {
      standard.extra = { ...standard.extra, max: config.poolSize };
    }
    if (config.timeoutMs) {
      standard.connectTimeoutMS = config.timeoutMs;
    }

    // MSSQL-specific options
    // Node.js v22+ tightened TLS validation. Even with trustServerCertificate: true,
    // Node's own TLS stack can reject a self-signed cert before tedious handles it.
    // Fix: disable TLS cert rejection at the Node level via cryptoCredentialsDetails,
    // and let encrypt/trustServerCertificate handle the logical connection security.
    if (driverType === 'mssql') {
      // mssql driver requires 'options' for meticulous tedious settings
      // and it often prefers 'extra' or specific sub-keys.
      standard.extra = {
        validateConnection: false,
        trustServerCertificate: true,
      };

      standard.options = {
        encrypt: config.ssl === true,
        trustServerCertificate: true,
        enableArithAbort: true,
        cryptoCredentialsDetails: {
          rejectUnauthorized: false, // Bypass Node 24 TLS validation
        },
      };

      // TypeORM MSSQL driver expects 'host' to be mapped to 'server' if 'url' is not provided
      // and sometimes 'server' is used directly in the base options.
      (standard as any).server = config.host;

      delete standard.ssl;
    }

    return standard as DataSourceOptions;
  }
}
