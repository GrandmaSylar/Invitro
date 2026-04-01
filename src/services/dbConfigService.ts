import { useSettingsStore } from '../stores/useSettingsStore';
import { DatabaseConfig } from '../lib/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 300) + 300);

export const dbConfigService = {
  getConfigs: async (): Promise<DatabaseConfig[]> => {
    await randomDelay();
    return useSettingsStore.getState().dbConfigs;
  },
  
  saveConfig: async (config: Omit<DatabaseConfig, 'id'>) => {
    await randomDelay();
    return useSettingsStore.getState().addDbConfig(config);
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  testConnection: async (config: any): Promise<{ success: boolean; message: string }> => {
    await randomDelay();

    // If config is a string (legacy ID lookup), just succeed
    if (typeof config === 'string') {
      return { success: true, message: 'Connection successful' };
    }

    const { host, port, connectionString, dbType } = config ?? {};

    // Simple DB types (sqlite, firebase) only need a connection string
    const simpleDbs = ['sqlite', 'firebase'];
    if (simpleDbs.includes(dbType)) {
      if (!connectionString || !connectionString.trim()) {
        return { success: false, message: 'Connection string is required for ' + dbType };
      }
      // Sentinel: connection strings containing "fail" or "error" trigger mock failure
      if (/fail|error/i.test(connectionString)) {
        return { success: false, message: 'Could not connect — the provided connection string is invalid' };
      }
      return { success: true, message: 'Connection successful' };
    }

    // For standard DB types, validate host and port
    if (!host || !host.trim()) {
      return { success: false, message: 'Connection failed — host is required' };
    }
    if (!port || port <= 0) {
      return { success: false, message: 'Connection failed — a valid port number is required' };
    }

    // Sentinel values: hosts containing "fail", "error", or "refuse" trigger mock failure
    if (/fail|error|refuse/i.test(host)) {
      return { success: false, message: 'Connection refused — unable to reach host "' + host + '"' };
    }

    // Port out of valid range
    if (port > 65535) {
      return { success: false, message: 'Connection failed — port number is out of range' };
    }

    return { success: true, message: 'Connection successful' };
  },
  
  setActiveConfig: async (id: string) => {
    await randomDelay();
    return useSettingsStore.getState().setActiveDbConfig(id);
  },
  
  updateConfig: async (id: string, data: Partial<DatabaseConfig>) => {
    await randomDelay();
    return useSettingsStore.getState().updateDbConfig(id, data);
  },
  
  deleteConfig: async (id: string) => {
    await randomDelay();
    const config = useSettingsStore.getState().dbConfigs.find(c => c.id === id);
    if (config?.isActive) {
      throw new Error('Cannot delete the active database configuration');
    }
    return useSettingsStore.getState().deleteDbConfig(id);
  }
};
