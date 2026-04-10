import * as fs from 'fs';
import * as path from 'path';
import { DatabaseConfig } from '../types';

const CONFIG_PATH = path.join(process.cwd(), '.bloo-config.json');

export const ConfigService = {
  getConfigs(): DatabaseConfig[] {
    if (!fs.existsSync(CONFIG_PATH)) {
      return [];
    }
    try {
      const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(data) as DatabaseConfig[];
    } catch (err) {
      console.error('Failed to read config file:', err);
      return [];
    }
  },

  getActiveConfig(): DatabaseConfig | null {
    const configs = this.getConfigs();
    const active = configs.find(c => c.isActive) || null;

    if (active) return active;

    // Check for environmental fallbacks (e.g. for local dev or first-time setup via .env)
    if (process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER) {
      return {
        id: 'env-configured-mssql',
        name: 'MSSQL (Env)',
        dbType: 'sqlserver',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '1433', 10),
        dbName: process.env.DB_NAME,
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        ssl: false,
        isActive: true
      };
    }

    return null;
  },

  saveConfigs(configs: DatabaseConfig[]): void {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(configs, null, 2), 'utf-8');
  },

  addConfig(config: DatabaseConfig): DatabaseConfig {
    const configs = this.getConfigs();
    configs.push(config);
    this.saveConfigs(configs);
    return config;
  },

  updateConfig(id: string, updates: Partial<DatabaseConfig>): DatabaseConfig | null {
    const configs = this.getConfigs();
    const index = configs.findIndex(c => c.id === id);
    if (index === -1) return null;

    configs[index] = { ...configs[index], ...updates };
    this.saveConfigs(configs);
    return configs[index];
  },

  setActiveConfig(id: string): void {
    const configs = this.getConfigs();
    configs.forEach(c => {
      c.isActive = (c.id === id);
    });
    this.saveConfigs(configs);
  },

  deleteConfig(id: string): void {
    let configs = this.getConfigs();
    configs = configs.filter(c => c.id !== id);
    this.saveConfigs(configs);
  }
};
