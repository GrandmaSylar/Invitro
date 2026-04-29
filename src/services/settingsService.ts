import { supabase } from '../lib/supabase';
import { mapApiKeyRow } from '../lib/mappers';
import { useSettingsStore } from '../stores/useSettingsStore';
import type { AppSettings, ApiKey } from '../lib/types';

export const settingsService = {
  getSettings: async (): Promise<AppSettings> => {
    const { data, error } = await supabase
      .from('app_settings')
      .select('*')
      .eq('id', 1)
      .single();

    if (error || !data) {
      console.warn('Failed to fetch settings from Supabase, using local store:', error?.message);
      return useSettingsStore.getState().settings;
    }

    return {
      general: data.general as any,
      notifications: data.notifications as any,
      security: data.security as any,
      smtp: data.smtp as any,
      apiKeys: [], // API keys are in a separate table
    };
  },

  updateSettings: async <K extends keyof AppSettings>(section: K, sectionData: AppSettings[K]) => {
    const { error } = await supabase
      .from('app_settings')
      .update({ [section]: sectionData as any, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) throw new Error(`Failed to update settings: ${error.message}`);
    useSettingsStore.getState().updateSection(section, sectionData);
  },

  patchSettings: async <K extends keyof AppSettings>(section: K, partialData: Partial<AppSettings[K]>) => {
    // Fetch current, merge, then update
    const current = await settingsService.getSettings();
    const merged = { ...current[section], ...partialData };

    const { error } = await supabase
      .from('app_settings')
      .update({ [section]: merged as any, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (error) throw new Error(`Failed to patch settings: ${error.message}`);
    useSettingsStore.getState().patchSection(section, partialData);
  },

  getApiKeys: async (): Promise<ApiKey[]> => {
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch API keys: ${error.message}`);

    return (data ?? []).map(mapApiKeyRow);
  },

  createApiKey: async (keyData: { name: string; key?: string; permissions: string[] }): Promise<ApiKey> => {
    const newKey = keyData.key || `bloo_${crypto.randomUUID().replace(/-/g, '')}`;

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        name: keyData.name,
        key: newKey,
        permissions: keyData.permissions as any,
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create API key: ${error.message}`);

    return mapApiKeyRow(data);
  },

  revokeApiKey: async (id: string) => {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to revoke API key: ${error.message}`);
    return { success: true };
  },
};
