export interface DatabaseConfig {
  id: string;
  name: string;
  dbType: 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'firebase' | string;
  host?: string;
  port?: number;
  dbName?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  sslCertificate?: string;
  connectionString?: string;
  poolSize?: number;
  timeoutMs?: number;
  isActive: boolean;
  lastTestedAt?: string;
  lastTestResult?: 'success' | 'failure' | null;
}
