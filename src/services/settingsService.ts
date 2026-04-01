import { useSettingsStore } from '../stores/useSettingsStore';
import { AppSettings, ApiKey } from '../lib/types';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const randomDelay = () => delay(Math.floor(Math.random() * 300) + 300);

export const settingsService = {
  getSettings: async (): Promise<AppSettings> => {
    await randomDelay();
    return useSettingsStore.getState().settings;
  },
  
  updateSettings: async <K extends keyof AppSettings>(section: K, data: AppSettings[K]) => {
    await randomDelay();
    return useSettingsStore.getState().updateSection(section, data);
  },

  patchSettings: async <K extends keyof AppSettings>(section: K, data: Partial<AppSettings[K]>) => {
    await randomDelay();
    return useSettingsStore.getState().patchSection(section, data);
  },
  
  getApiKeys: async (): Promise<ApiKey[]> => {
    await randomDelay();
    return useSettingsStore.getState().settings.apiKeys;
  },
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createApiKey: async (keyData: any) => {
    await randomDelay();
    const state = useSettingsStore.getState();
    const newKey: ApiKey = {
      ...keyData,
      id: `key_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    useSettingsStore.getState().updateSection('apiKeys', [...state.settings.apiKeys, newKey]);
    return newKey;
  },
  
  revokeApiKey: async (id: string) => {
    await randomDelay();
    const state = useSettingsStore.getState();
    useSettingsStore.getState().updateSection('apiKeys', state.settings.apiKeys.filter((k: ApiKey) => k.id !== id));
    return { success: true };
  }
};
