import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../lib/types';
import { DEFAULT_APP_SETTINGS } from '../lib/mockData';

interface SettingsStore {
  settings: AppSettings;
  updateSection: <K extends keyof AppSettings>(section: K, data: AppSettings[K]) => void;
  patchSection: <K extends keyof AppSettings>(section: K, data: Partial<AppSettings[K]>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: DEFAULT_APP_SETTINGS,
      
      updateSection: (section, data) => set((state) => ({
        settings: {
          ...state.settings,
          [section]: data,
        }
      })),

      patchSection: (section, data) => set((state) => ({
        settings: {
          ...state.settings,
          [section]: {
            ...state.settings[section],
            ...data,
          }
        }
      })),
    }),
    {
      name: 'lims-settings',
    }
  )
);
