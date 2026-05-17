import { create } from 'zustand';
import { AppSettings } from '../lib/types';
import { DEFAULT_APP_SETTINGS } from '../lib/mockData';
import { supabase } from '../lib/supabase';

interface SettingsStore {
  settings: AppSettings;
  isLoading: boolean;
  initialize: () => Promise<void>;
  updateSection: <K extends keyof AppSettings>(section: K, data: AppSettings[K]) => Promise<void>;
  patchSection: <K extends keyof AppSettings>(section: K, data: Partial<AppSettings[K]>) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  (set, get) => ({
    settings: DEFAULT_APP_SETTINGS,
    isLoading: true,
    
    initialize: async () => {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('settings')
          .eq('id', 1)
          .single();
          
        if (data && !error) {
          const mergedSettings = { ...DEFAULT_APP_SETTINGS };
          const fetchedSettings = data.settings as Partial<AppSettings>;
          
          for (const key in fetchedSettings) {
             const k = key as keyof AppSettings;
             if (Array.isArray(fetchedSettings[k])) {
               mergedSettings[k] = fetchedSettings[k] as any;
             } else if (typeof fetchedSettings[k] === 'object' && fetchedSettings[k] !== null) {
               mergedSettings[k] = { ...mergedSettings[k], ...fetchedSettings[k] } as any;
             } else {
               mergedSettings[k] = fetchedSettings[k] as any;
             }
          }
          
          set({ settings: mergedSettings, isLoading: false });
        } else {
          set({ isLoading: false });
        }
      } catch (e) {
        console.error("Failed to fetch settings from database", e);
        set({ isLoading: false });
      }
    },
    
    updateSection: async (section, data) => {
      const currentSettings = get().settings;
      const newSettings = {
        ...currentSettings,
        [section]: data,
      };
      
      set({ settings: newSettings });
      
      await supabase
        .from('system_settings')
        .update({ settings: newSettings })
        .eq('id', 1);
    },

    patchSection: async (section, data) => {
      const currentSettings = get().settings;
      const newSettings = {
        ...currentSettings,
        [section]: {
          ...currentSettings[section],
          ...data,
        }
      };
      
      set({ settings: newSettings });
      
      await supabase
        .from('system_settings')
        .update({ settings: newSettings })
        .eq('id', 1);
    },
  })
);
