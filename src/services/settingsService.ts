/**
 * Settings Service — Read/write application settings and manage API keys.
 * Refactored to route queries through the dbAdapter to support offline SQLite capability.
 */
import { dbAdapter } from './dbAdapter';
import type { AppSettings, ApiKey } from '../lib/types';

export const settingsService = {
  getSettings: async (): Promise<AppSettings> => {
    return dbAdapter.settings.getSettings();
  },

  updateSettings: async <K extends keyof AppSettings>(section: K, sectionData: AppSettings[K]) => {
    return dbAdapter.settings.updateSettings(section, sectionData);
  },

  patchSettings: async <K extends keyof AppSettings>(section: K, partialData: Partial<AppSettings[K]>) => {
    return dbAdapter.settings.patchSettings(section, partialData);
  },

  getApiKeys: async (): Promise<ApiKey[]> => {
    return dbAdapter.settings.getApiKeys();
  },

  createApiKey: async (keyData: { name: string; key?: string; permissions: string[] }): Promise<ApiKey> => {
    return dbAdapter.settings.createApiKey(keyData);
  },

  revokeApiKey: async (id: string) => {
    return dbAdapter.settings.revokeApiKey(id);
  },
};
